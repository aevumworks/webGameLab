"""Package repaired glTF meshes for WebGL, preserving geometry and tangent-space PBR maps."""
import argparse
from io import BytesIO
import json
from pathlib import Path
import struct

from PIL import Image

def encode_model(kind, source, target):
    blob = Path(source).read_bytes()
    size = struct.unpack_from("<I", blob, 12)[0]
    doc = json.loads(blob[20:20+size])
    binary = blob[28+size:]
    image_views = {im["bufferView"]: (i, im) for i, im in enumerate(doc.get("images", []))}
    normals = {doc["textures"][m["normalTexture"]["index"]]["source"] for m in doc["materials"] if "normalTexture" in m}
    caps = (2048,1536) if kind == "standing" else (1024,768)
    output = bytearray()
    for i, view in enumerate(doc["bufferViews"]):
        start = view.get("byteOffset",0)
        block = binary[start:start+view["byteLength"]]
        if i in image_views:
            image_id, record = image_views[i]
            is_normal = image_id in normals
            with Image.open(BytesIO(block)) as im:
                im = im.convert("RGB")
                limit = caps[1] if is_normal else caps[0]
                im.thumbnail((limit,limit),Image.Resampling.LANCZOS)
                encoded = BytesIO()
                im.save(encoded,format="JPEG",quality=95 if is_normal else 92,subsampling=0,optimize=True)
                block = encoded.getvalue()
                record["mimeType"]="image/jpeg"
        output += bytes((-len(output))%4)
        view["byteOffset"] = len(output)
        view["byteLength"] = len(block)
        output += block
    output += bytes((-len(output))%4)
    doc["buffers"][0]["byteLength"] = len(output)
    doc["asset"]["extras"] = {"edition":"WGL-005","sculpt":kind,"revision":"r1"}
    header=json.dumps(doc,separators=(",",":"),ensure_ascii=True).encode("ascii")
    header += b" "*((-len(header))%4)
    out=Path(target)
    out.parent.mkdir(parents=True,exist_ok=True)
    with out.open("wb") as f:
        f.write(struct.pack("<4sIIII",b"glTF",2,28+len(header)+len(output),len(header),0x4e4f534a))
        f.write(header)
        f.write(struct.pack("<II",len(output),0x004e4942))
        f.write(output)
    return out.stat().st_size

if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("kind",choices=("standing","recumbent"))
    parser.add_argument("source")
    parser.add_argument("target")
    args=parser.parse_args()
    print(args.kind,encode_model(args.kind,args.source,args.target),"bytes")
