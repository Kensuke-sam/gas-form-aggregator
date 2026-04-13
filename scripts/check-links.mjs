#!/usr/bin/env node
/**
 * docs/ 配下の HTML から相対リンクと相対参照（href / src）を抽出し、
 * 参照先ファイルが実在するかチェックする。
 * 欠損があれば exit 1 で終了（CI で検知可能）。
 *
 * 対象外:
 *   - 絶対URL（http:// https://）、mailto:、tel:
 *   - ページ内アンカー（# のみ）
 *   - data: スキーム
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve, isAbsolute } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS = join(ROOT, 'docs');

async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else if (e.isFile() && e.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

function extractRefs(html) {
  const refs = [];
  const re = /\s(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) refs.push(m[1]);
  return refs;
}

function shouldSkip(ref) {
  if (!ref) return true;
  if (ref.startsWith('#')) return true;
  if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) return true;
  if (isAbsolute(ref)) return true; // "/" で始まる運用は想定しない
  return false;
}

async function exists(p) {
  try { await stat(p); return true; } catch (_) { return false; }
}

async function main() {
  const htmlFiles = await walk(DOCS);
  const errors = [];
  let checked = 0;

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    const refs = extractRefs(html);
    for (let ref of refs) {
      if (shouldSkip(ref)) continue;
      const [pathPart] = ref.split('#');
      if (!pathPart) continue;
      const [cleanPath] = pathPart.split('?');
      const target = resolve(dirname(file), cleanPath);
      checked += 1;
      if (!(await exists(target))) {
        errors.push({
          from: relative(ROOT, file),
          ref,
          target: relative(ROOT, target),
        });
      }
    }
  }

  if (errors.length > 0) {
    console.error(`リンク切れが見つかりました (${errors.length} 件):`);
    for (const e of errors) {
      console.error(`  ${e.from} → ${e.ref}  (期待先: ${e.target})`);
    }
    process.exit(1);
  }

  console.log(`HTML ${htmlFiles.length} 件 / 相対リンク ${checked} 件を検査。リンク切れなし。`);
}

main().catch(e => { console.error(e); process.exit(1); });
