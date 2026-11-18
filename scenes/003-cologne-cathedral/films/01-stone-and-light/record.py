"""Capture this edition's WebGL framebuffer into a silent H.264 film."""

import argparse
import json
import os
import secrets
import subprocess
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock, Thread
from urllib.parse import unquote, urlsplit


EDITION = Path(__file__).resolve().parent
ROOT = EDITION.parents[3]
MOVIE = "wgl-003-01-stone-and-light.mp4"


class Recording:
    def __init__(self, options):
        self.options = options
        self.key = secrets.token_urlsafe(18)
        self.output = options.output.resolve()
        self.partial = self.output.with_name(self.output.stem + "." + self.key + ".partial.mp4")
        self.lock = Lock()
        self.process = None
        self.index = 0
        self.total = 0
        self.complete = False

    def start(self, fps, total):
        if self.process is not None:
            raise ValueError("A recording is already in progress.")
        if type(fps) is not int or type(total) is not int or not (1 <= fps <= 120 and 1 <= total <= 100000):
            raise ValueError("Invalid frame rate or frame count.")
        o = self.options
        self.total = total
        self.process = subprocess.Popen([
            o.ffmpeg, "-hide_banner", "-loglevel", "error",
            "-f", "rawvideo", "-pixel_format", "rgba", "-video_size", f"{o.width}x{o.height}",
            "-framerate", str(fps), "-i", "pipe:0", "-an",
            "-vf", "vflip,scale=in_range=full:out_range=limited:out_color_matrix=bt709,format=yuv420p",
            "-c:v", "libx264", "-preset", "medium", "-threads", "8", "-crf", "17",
            "-maxrate", "15M", "-bufsize", "24M", "-g", str(2 * fps),
            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "iec61966-2-1",
            "-color_range", "tv", "-movflags", "+faststart", str(self.partial)
        ], stdin=subprocess.PIPE)
        print(f"Recording {total} frames at {fps} fps", flush=True)

    def frame(self, number, size, stream):
        if self.process is None or number != self.index or number >= self.total:
            raise ValueError("Unexpected frame number.")
        if size != self.options.width * self.options.height * 4:
            raise ValueError("Unexpected RGBA frame size.")
        data = stream.read(size)
        if len(data) != size:
            raise ValueError("Incomplete framebuffer.")
        self.process.stdin.write(data)
        self.index += 1
        if self.index % 90 == 0:
            print(f"{self.index}/{self.total}", flush=True)

    def finish(self):
        if self.process is None or self.index != self.total:
            raise ValueError("Timeline is incomplete.")
        self.process.stdin.close()
        if self.process.wait() != 0:
            raise RuntimeError("FFmpeg failed to encode this recording.")
        os.replace(self.partial, self.output)
        self.complete = True
        print(f"Saved {self.output} ({self.output.stat().st_size:,} bytes)", flush=True)

    def close(self):
        if self.process is not None and self.process.poll() is None:
            self.process.terminate()
            self.process.wait()
        if self.partial.exists():
            self.partial.unlink()


class CaptureHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript", ".webp": "image/webp"}

    def log_message(self, *_):
        pass

    def reply(self, code, body=b"", content_type="text/plain"):
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def do_GET(self):
        rec = self.server.recording
        if self.path == f"/{rec.key}/settings":
            info = {"width": rec.options.width, "height": rec.options.height}
            return self.reply(200, json.dumps(info).encode(), "application/json")
        return super().do_GET()

    def send_head(self):
        # The browser only needs the scene, its shared engine, and the parameter card.
        path = unquote(urlsplit(self.path).path)
        names = path.lstrip("/").split("/")
        if names[0] not in {"scenes", "architecture", "knowledge", "vendor"} or any(
            part.startswith(".") or "\\" in part or ":" in part for part in names
        ):
            self.send_error(HTTPStatus.NOT_FOUND)
            return None
        target = Path(self.translate_path(path)).resolve()
        if not target.is_relative_to(ROOT) or not target.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return None
        return super().send_head()

    def do_POST(self):
        rec = self.server.recording
        prefix = f"/{rec.key}/"
        if not self.path.startswith(prefix):
            self.close_connection = True
            return self.reply(404)
        action = self.path[len(prefix):]
        try:
            with rec.lock:
                length = int(self.headers.get("Content-Length", 0))
                if action == "start":
                    if length <= 0 or length > 1024:
                        raise ValueError("Invalid timeline settings.")
                    settings = json.loads(self.rfile.read(length))
                    rec.start(settings["fps"], settings["frameCount"])
                elif action.startswith("frame/"):
                    rec.frame(int(action[6:]), length, self.rfile)
                elif action == "finish":
                    rec.finish()
                else:
                    raise ValueError("Unknown capture request.")
        except (ValueError, KeyError, OSError, RuntimeError) as error:
            self.close_connection = True
            print(error, flush=True)
            return self.reply(409, str(error).encode())
        self.reply(204)
        if action == "finish":
            Thread(target=self.server.shutdown, daemon=True).start()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", default="ffmpeg", help="FFmpeg executable with libx264")
    parser.add_argument("--port", type=int, default=4193)
    parser.add_argument("--width", type=int, default=2560)
    parser.add_argument("--height", type=int, default=1440)
    parser.add_argument("--output", type=Path, default=Path.cwd() / ("capture-" + MOVIE))
    options = parser.parse_args()
    if any(n < 2 or n % 2 for n in (options.width, options.height)):
        parser.error("Capture dimensions must be positive even numbers.")
    if options.output.exists():
        parser.error("The output already exists. Choose a new --output path.")
    recording = Recording(options)
    handler = partial(CaptureHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", options.port), handler) as server:
        server.recording = recording
        path = EDITION.relative_to(ROOT).as_posix()
        print(f"Open http://127.0.0.1:{server.server_port}/{path}/render.html?capture&record={recording.key}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            recording.close()
    return 0 if recording.complete else 1


if __name__ == "__main__":
    raise SystemExit(main())
