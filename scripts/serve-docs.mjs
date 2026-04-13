#!/usr/bin/env node
/**
 * docs/ を静的配信するローカルプレビューサーバー。
 * GitHub Pages と同じ相対パス構造で動作確認できる。
 *
 * 使い方:
 *   node scripts/serve-docs.mjs          # http://localhost:4173
 *   PORT=8080 node scripts/serve-docs.mjs
 *
 * 依存なし（Node 標準 http / fs / path のみ）。
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', 'docs');
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const resolved = normalize(join(root, decoded));
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

const server = createServer(async (req, res) => {
  try {
    let urlPath = req.url || '/';
    if (urlPath === '/') urlPath = '/index.html';
    let file = safeJoin(ROOT, urlPath);
    if (!file) { res.writeHead(403); return res.end('Forbidden'); }

    let info;
    try { info = await stat(file); }
    catch (_) { res.writeHead(404); return res.end(`404 Not Found: ${urlPath}`); }

    if (info.isDirectory()) {
      file = join(file, 'index.html');
      try { info = await stat(file); }
      catch (_) { res.writeHead(404); return res.end(`404 Not Found: ${urlPath}`); }
    }

    const ext = extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(body);
  } catch (err) {
    res.writeHead(500);
    res.end('Server error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`docs/ を配信中: http://localhost:${PORT}/`);
  console.log(`停止するには Ctrl+C`);
});
