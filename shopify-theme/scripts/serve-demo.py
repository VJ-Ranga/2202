#!/usr/bin/env python3
"""Serve html-demo with cache-disabled headers for local visual review."""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1] / "html-demo"

class DemoHandler(SimpleHTTPRequestHandler):
    server_version = "2202Demo/1.0"

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        path = urlsplit(self.path).path
        if path == "/" or path.endswith(".html"):
            self.send_header("Clear-Site-Data", '"cache"')
        super().end_headers()

    def log_message(self, fmt, *args):
        super().log_message(fmt, *args)


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--bind", default="0.0.0.0")
    args = parser.parse_args()
    handler = partial(DemoHandler, directory=str(ROOT))
    server = ThreadingHTTPServer((args.bind, args.port), handler)
    print(f"Serving {ROOT} at http://{args.bind}:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    main()
