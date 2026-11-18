"""Run the Giza series framebuffer recorder for the full walking tour."""
from pathlib import Path
import runpy

edition=Path(__file__).resolve().parent
if __name__=="__main__":
    recorder=runpy.run_path(str(edition.parent/"01-the-guardian"/"record.py"))
    raise SystemExit(recorder["main"](edition))
