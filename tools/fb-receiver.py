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
    def do_GET(self):
        # relay 頁：fb-extract.js 把 JSON 放在 # 後面導過來（FB 的 CSP 不准直接 fetch localhost），這頁再 POST 給自己
        page = ('<!doctype html><meta charset=utf-8><title>FB 接收器</title><body style="font:16px sans-serif;padding:24px">'
                '<p id=m>收到資料，存檔中…</p><script>'
                'const h=location.hash.slice(1); if(!h){document.getElementById("m").textContent="接收器運作中。在 FB 頁面 Console 執行 window.__fbPost=\'http://localhost:8898/\' 再貼 tools/fb-extract.js。";}'
                'else fetch("/",{method:"POST",headers:{"Content-Type":"application/json"},body:decodeURIComponent(h)})'
                '.then(r=>r.text()).then(t=>{document.getElementById("m").textContent="已存檔："+t+"。按上一頁回到 Facebook。";history.replaceState(null,"",location.pathname);})'
                '.catch(e=>document.getElementById("m").textContent="存檔失敗："+e);'
                '</script>')
        b = page.encode(); self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.end_headers(); self.wfile.write(b)
    def do_POST(self):
        raw = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        try: d = json.loads(raw); gid = d['group']['id']; n = len(d['posts'])
        except Exception as e:
            self.send_response(400); self._cors(); self.end_headers(); self.wfile.write(str(e).encode()); return
        path = os.path.join(OUT, f"fb-{gid}-{time.strftime('%Y%m%d-%H%M%S')}.json")
        open(path, 'wb').write(raw); print(f"收到 群組 {gid} {n} 篇 → {path}", flush=True)
        self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(f"群組 {gid} {n} 篇 → {os.path.basename(path)}".encode())
    def log_message(self, *a): pass
print('接收器聽 http://127.0.0.1:8898/', flush=True)
HTTPServer(('127.0.0.1', 8898), H).serve_forever()
