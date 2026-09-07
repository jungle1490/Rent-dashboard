#!/usr/bin/env python3
"""本機接收器：只聽 127.0.0.1:8898，收 tools/fb-extract.js POST 過來的 JSON，存到 logs/fb-inbox/。
用法：python3 tools/fb-receiver.py ；在 FB 頁面 Console 先執行 window.__fbPost='http://localhost:8898/' 再貼腳本。"""
import json, os, time
from http.server import BaseHTTPRequestHandler, HTTPServer
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'logs', 'fb-inbox'); os.makedirs(OUT, exist_ok=True)
class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    def do_OPTIONS(self): self.send_response(204); self._cors(); self.end_headers()
    def do_POST(self):
        raw = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        try: d = json.loads(raw); gid = d['group']['id']; n = len(d['posts'])
        except Exception as e:
            self.send_response(400); self._cors(); self.end_headers(); self.wfile.write(str(e).encode()); return
        path = os.path.join(OUT, f"fb-{gid}-{time.strftime('%Y%m%d-%H%M%S')}.json")
        open(path, 'wb').write(raw); print(f"收到 群組 {gid} {n} 篇 → {path}", flush=True)
        self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, *a): pass
print('接收器聽 http://127.0.0.1:8898/', flush=True)
HTTPServer(('127.0.0.1', 8898), H).serve_forever()
