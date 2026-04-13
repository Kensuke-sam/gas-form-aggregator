#!/usr/bin/env node
/**
 * docs/assets/og-image.svg を 1200×630 PNG に書き出す。
 * ローカルの Google Chrome を headless 起動して SVG を描画しスクショする。
 *
 * 使い方:
 *   node scripts/build-og-image.mjs
 *
 * 前提:
 *   - macOS: /Applications/Google Chrome.app が存在する
 *   - その他: CHROME_BIN 環境変数で実行ファイルを指定可能
 *
 * 依存なし（Node 標準 child_process / path のみ）。
 * CI では使わない想定（Chrome 依存のため）。デザイン変更時のローカル再生成用。
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'docs/assets/og-image.svg');
const DST = join(ROOT, 'docs/assets/og-image.png');

const CANDIDATES = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const chrome = CANDIDATES.find(p => existsSync(p));
if (!chrome) {
  console.error('Chrome が見つからない。CHROME_BIN 環境変数で実行ファイルを指定してください。');
  process.exit(1);
}
if (!existsSync(SRC)) {
  console.error(`ソース SVG が見つからない: ${SRC}`);
  process.exit(1);
}

console.log(`Chrome: ${chrome}`);
console.log(`変換: ${SRC} → ${DST}`);

const result = spawnSync(chrome, [
  '--headless',
  '--disable-gpu',
  `--screenshot=${DST}`,
  '--window-size=1200,630',
  '--default-background-color=FFFFFFFF',
  `file://${SRC}`,
], { stdio: 'inherit' });

if (result.status !== 0) {
  console.error('Chrome headless 変換に失敗。');
  process.exit(result.status || 1);
}
console.log('OG 画像を生成した。');
