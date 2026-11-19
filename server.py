#!/usr/bin/env python3
"""
InfoLogik — Static File Server (Render.com uchun)
"""

import os
import http.server
import socketserver

PORT = int(os.environ.get('PORT', 10000))

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}")

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"InfoLogik server ishga tushdi: http://0.0.0.0:{PORT}")
    httpd.serve_forever()
