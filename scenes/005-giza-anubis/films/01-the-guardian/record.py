"""Record the live Giza scene in vertical H.264 with the series' existing framebuffer recorder."""
import argparse
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import runpy

EDITION = Path(__file__).resolve().parent
ROOT = EDITION.parents[3]
SHARED = ROOT / "scenes/003-cologne-cathedral/films/01-stone-and-light/record.py"
protocol = runpy.run_path(str(SHARED))
Recording, BaseHandler = protocol["Recording"], protocol["CaptureHandler"]
SCENE = EDITION.parents[1]
PREFIX = "/" + SCENE.relative_to(ROOT).as_posix() + "/models/"

class Handler(BaseHandler):
    def send_head(self):
        # A local edition may link its two approved GLBs from an external asset library.
        path = urlsplit(self.path).path
        for file in ("standing-r1.glb","recumbent-r1.glb"):
            if path != PREFIX + file:
                continue
            model = self.server.models / file
            if not model.is_file():
                self.send_error(404)
                return None
            self.send_response(200)
            self.send_header("Content-Type","model/gltf-binary")
            self.send_header("Content-Length",str(model.stat().st_size))
            self.end_headers()
            return model.open("rb")
        return super().send_head()

def main(edition=EDITION):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--ffmpeg",default="ffmpeg")
    p.add_argument("--port",type=int,default=4195)
    p.add_argument("--output",type=Path,required=True)
    p.add_argument("--models",type=Path,default=SCENE/"models")
    options=p.parse_args()
    if options.output.exists():p.error("Select a new output path")
    options.width,options.height=1080,1920
    options.output.parent.mkdir(parents=True,exist_ok=True)
    rec=Recording(options)
    handler=partial(Handler,directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1",options.port),handler) as server:
        server.recording=rec;server.models=options.models.resolve()
        page=edition.relative_to(ROOT).as_posix()
        print(f"http://127.0.0.1:{server.server_port}/{page}/index.html?capture&record={rec.key}",flush=True)
        try:server.serve_forever()
        finally:rec.close()
    return 0 if rec.complete else 1

if __name__=="__main__":raise SystemExit(main())
