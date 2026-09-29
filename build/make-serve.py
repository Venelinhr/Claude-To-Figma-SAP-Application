#!/usr/bin/env python3
"""make-serve.py — serve a Make app replica and let the page POST its probe dump to disk.
  python3 build/make-serve.py <dir> [port] [--out <dir>]
GET  → static files from <dir>.   POST /save?name=make-dump.json → writes the body to <out>/<name> (default <dir>/..)."""
import http.server, os, sys, urllib.parse
a = [x for x in sys.argv[1:] if not x.startswith('--')]
root = os.path.abspath(a[0]); port = int(a[1]) if len(a) > 1 else 8765
out = os.path.abspath(sys.argv[sys.argv.index('--out') + 1]) if '--out' in sys.argv else os.path.dirname(root)
os.chdir(root)
class H(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        q = urllib.parse.urlparse(self.path)
        name = os.path.basename(urllib.parse.parse_qs(q.query).get('name', ['dump.json'])[0])
        data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        open(os.path.join(out, name), 'wb').write(data)
        self.send_response(200); self.send_header('Access-Control-Allow-Origin', '*'); self.end_headers(); self.wfile.write(str(len(data)).encode())
    def do_OPTIONS(self):
        self.send_response(204); self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Methods', 'POST'); self.send_header('Access-Control-Allow-Headers', '*'); self.end_headers()
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
