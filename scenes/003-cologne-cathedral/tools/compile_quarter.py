"""Compile the open NRW CityGML, DGM1 and DOP inputs listed in ../references/README.md."""
from pathlib import Path
import argparse
import json
import math
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image

EAST, NORTH, LEVEL = 356477.59, 5645284.27, 55.10
ANGLE = math.atan2(.051, 31.91)
C, S = math.cos(ANGLE), math.sin(ANGLE)
CATHEDRAL = "DENW37AL1000qmxq"
LANDMARKS = {"DENW37AL1000qx0j": "forum", "DENW37AL1000qs0C": "ludwig", "DENW37AL1000qy6T": "roman"}

def local(e,n,h):
    return [(e-EAST)*S-(n-NORTH)*C,h-LEVEL,-(e-EAST)*C-(n-NORTH)*S]

def coords(element):
    numbers = np.fromstring(element.text, sep=" ").reshape((-1,3))
    return numbers[:-1] if np.array_equal(numbers[0],numbers[-1]) else numbers

def geometry(building):
    vertices, indices, faces = [], {}, []
    for tag, role in [("GroundSurface",0),("WallSurface",1),("RoofSurface",2)]:
        for poly in building.iterfind(".//{*}"+tag+"//{*}Polygon"):
            rings=[]
            for ring in poly.iterfind("./*/{*}LinearRing/{*}posList"):
                ids=[]
                for e,n,h in coords(ring):
                    vertex=tuple(round(v*10) for v in local(e,n,h))
                    if vertex not in indices:indices[vertex]=len(vertices);vertices.append(vertex)
                    idx=indices[vertex]
                    if not ids or idx!=ids[-1]:ids.append(idx)
                if len(ids)>1 and ids[0]==ids[-1]:ids.pop()
                if len(set(ids))>=3:rings.append(ids)
            if rings:faces.append([role,*rings])
    return vertices,faces

def compile_quarter(args):
    result=[]
    for _,member in ET.iterparse(args.gml,events=["end"]):
        if not member.tag.endswith("}cityObjectMember"):continue
        building=member.find("./{*}Building")
        if building is None:member.clear();continue
        uid=building.get("{http://www.opengis.net/gml}id")
        ground=building.find(".//{*}GroundSurface//{*}posList")
        if uid==CATHEDRAL or ground is None:member.clear();continue
        points=coords(ground)
        lo,hi=points.min(axis=0),points.max(axis=0)
        if hi[0]<356292 or lo[0]>356804 or hi[1]<5645055 or lo[1]>5645525:member.clear();continue
        vertices,faces=geometry(building)
        function=building.findtext("./{*}function","")
        style=LANDMARKS.get(uid,"station" if function.endswith(("_3090","_3091")) else "city")
        if vertices and faces:result.append([uid,style,vertices,faces])
        member.clear()
    # UTM metres, pixel centres. The high plateau around the church is kept at its finished floor.
    im=Image.open(args.dgm)
    tie=im.tag_v2[33922];sx,sy,*_=im.tag_v2[33550];tile_e,tile_n=tie[3:5]
    raster=np.asarray(im)
    grid=dict(x=-220,z=-300,dx=4,cols=111,rows=121,heights=[])
    for row in range(grid["rows"]):
        for col in range(grid["cols"]):
            x,z=grid["x"]+col*grid["dx"],grid["z"]+row*grid["dx"]
            e,n=EAST+x*S-z*C,NORTH-x*C-z*S
            ix=int((e-tile_e)/sx);iy=int((tile_n-n)/sy)
            grid["heights"].append(round((float(raster[iy,ix])-LEVEL)*100))
    datum=dict(origin=[EAST,NORTH,LEVEL],angle=ANGLE,ortho=[356270,5645010,356850,5645590],unit=.1)
    args.output.mkdir(parents=True,exist_ok=True)
    with (args.output/"quarter.json").open("w",encoding="utf-8",newline="\n") as f:
        json.dump(dict(datum=datum,grid=grid,buildings=result),f,separators=(",",":"));f.write("\n")
    Image.open(args.dop).convert("RGB").save(args.output/"orthophoto.webp",quality=88,method=5)
    print(len(result),"buildings",sum(len(b[3]) for b in result),"surveyed surfaces",grid["rows"]*grid["cols"],"ground samples")

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ["gml","dgm","dop","output"]:parser.add_argument(name,type=Path)
    compile_quarter(parser.parse_args())
