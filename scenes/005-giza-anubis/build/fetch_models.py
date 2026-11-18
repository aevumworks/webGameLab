"""Restore the exhibition assets outside Git. A first Pages deployment can rebuild from a Rodin PBR source."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import struct
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE = "https://aevumworks.github.io/webGameLab/scenes/005-giza-anubis/models/"
SOURCE = {"standing":"7246403cd1c9d52e92d5f7159561f67f0b09a2917cce26c116ae9b7a1c3aedd5",
          "recumbent":"157ec8c42549b8711cfa41821fbe023b997790b3e84d5c8344d419ef96a7ccdf"}

def request_bytes(url):
    with urlopen(Request(url,headers={"User-Agent":"webGameLab-asset-build"}),timeout=45) as r:
        return r.read()

def valid(blob, kind):
    if len(blob)<28 or blob[:4]!=b"glTF" or struct.unpack_from("<I",blob,8)[0]!=len(blob):
        return False
    size=struct.unpack_from("<I",blob,12)[0]
    return json.loads(blob[20:20+size]).get("asset",{}).get("extras")=={"edition":"WGL-005","sculpt":kind,"revision":"r1"}

def restore(dest,raw):
    dest.mkdir(parents=True,exist_ok=True)
    pending=[]
    for kind,digest in SOURCE.items():
        name=kind+"-r1.glb"
        target=dest/name
        if target.is_file() and valid(target.read_bytes(),kind):
            continue
        try:
            published=request_bytes(BASE+name)
        except HTTPError as ex:
            if ex.code != 404:raise
            published=b""
        if published and valid(published,kind):
            target.write_bytes(published)
            continue
        url=os.environ.get("WGL005_"+kind.upper()+"_SOURCE")
        if not raw or not url:
            raise SystemExit("The exhibition asset is unavailable: "+name)
        blob=request_bytes(url)
        if hashlib.sha256(blob).hexdigest()!=digest:
            raise SystemExit("Rodin PBR source checksum mismatch for "+kind)
        raw.mkdir(parents=True,exist_ok=True)
        (raw/(kind+".glb")).write_bytes(blob)
        pending.append(kind)
    return pending

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output",type=Path)
    parser.add_argument("--raw",type=Path)
    args=parser.parse_args()
    todo=restore(args.output,args.raw)
    if "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"],"a",encoding="utf8") as f:
            f.write("rebuild="+" ".join(todo)+"\n")
    print("Ready to serve" if not todo else "Rebuilding "+" and ".join(todo))
