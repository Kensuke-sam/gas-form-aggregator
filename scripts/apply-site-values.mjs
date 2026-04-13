#!/usr/bin/env node
/**
 * config/site-values.json の値で、LP・法務ページ・メールテンプレ内のプレースホルダを一括置換する。
 *
 * 使い方:
 *   node scripts/apply-site-values.mjs         # ドライラン（差分のみ表示）
 *   node scripts/apply-site-values.mjs --write # 実際に書き込む
 *
 * 冪等性:
 *   - 初回は `{屋号}` などのプレースホルダが実値に置換される。
 *   - 2回目以降は `config/.site-values.lock.json`（自動生成）が
 *     「前回適用時の値」を保持し、その値から最新値への差し替えを行う。
 *   - したがって `config/site-values.json` を編集して再実行するだけで
 *     全ファイルの該当箇所が追従する。
 *   - ロックファイルが失われた場合は初回扱い（プレースホルダ→実値）で動く。
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOCK_PATH = join(ROOT, 'config/.site-values.lock.json');

const TARGETS = [
  'legal/privacy.md',
  'legal/terms.md',
  'legal/tokutei.md',
  'docs/legal/privacy.html',
  'docs/legal/terms.html',
  'docs/legal/tokutei.html',
  'docs/index.html',
  'deliverables/setup-guide.md',
  'templates/invoice.md',
  'templates/quotation.md',
  'templates/receipt.md',
  'x-social/profile.md',
  'x-social/pinned-post.md',
  'ops/form-confirmation-message.md',
];

// 特定ファイルで `{YYYY-MM-DD}` は「支払期限」など per-invoice の動的値を指し、
// 制定日（established_date）として置換すると誤適用になる。そのキーだけ除外する。
const EXCLUDED_KEYS_PER_FILE = {
  'templates/invoice.md': ['established_date'],
  'templates/quotation.md': ['established_date'],
  'templates/receipt.md': ['established_date'],
};

// value key → 初回扱い時に使う複数のプレースホルダ（表記揺れを吸収）
// および補助置換（対応する site-values キーが無いもの）。
const INITIAL_PLACEHOLDERS = {
  business_name: ['{屋号 / 個人名}', '{屋号}', '[屋号]'],
  owner_name: ['{氏名}'],
  contact_email: ['{連絡先メールアドレス}', '{連絡先メール}', '{メールアドレス}', '{メール}', '[メールアドレス]', '[納品時に記入]'],
  analytics_tool: ['{使用ツール名：Google Analytics等}', '{ツール名}'],
  established_date: ['{YYYY-MM-DD}'],
};

// site-values に対応しないが、常に定型文へ置換する項目（初回のみ作用）
const STATIC_INITIAL = [
  ['{郵便番号・住所}', '請求があった場合、遅滞なく開示いたします。'],
  ['{番号}', '請求があった場合、遅滞なく開示いたします。'],
];

async function loadLock() {
  try {
    const raw = await readFile(LOCK_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

async function main() {
  const write = process.argv.includes('--write');
  const cfgRaw = await readFile(join(ROOT, 'config/site-values.json'), 'utf8');
  const cfg = JSON.parse(cfgRaw);
  const lock = await loadLock();

  const currentValues = {
    business_name: cfg.business_name,
    owner_name: cfg.owner_name,
    contact_email: cfg.contact_email,
    established_date: cfg.established_date,
    analytics_tool: cfg.analytics_tool,
  };

  // 置換ペア列を構築（前値 → 新値）。
  // ロック有り: ロック値 → 最新値。 ロック無し: 初回プレースホルダ → 最新値。
  const pairs = [];
  for (const [key, newVal] of Object.entries(currentValues)) {
    if (!newVal) continue;
    if (lock && lock[key]) {
      if (lock[key] !== newVal) pairs.push([lock[key], newVal, key]);
    } else {
      for (const placeholder of (INITIAL_PLACEHOLDERS[key] || [])) {
        pairs.push([placeholder, newVal, key]);
      }
    }
  }
  if (!lock) {
    for (const [needle, replacement] of STATIC_INITIAL) pairs.push([needle, replacement, '(static)']);
  }

  let totalChanged = 0;
  for (const rel of TARGETS) {
    const abs = join(ROOT, rel);
    let before;
    try { before = await readFile(abs, 'utf8'); }
    catch (_) { console.warn(`(skip) 見つからない: ${rel}`); continue; }

    let after = before;
    const hits = [];
    const excluded = EXCLUDED_KEYS_PER_FILE[rel] || [];
    for (const [needle, replacement, key] of pairs) {
      if (needle === replacement) continue;
      if (excluded.includes(key)) continue;
      if (after.includes(needle)) {
        const count = after.split(needle).length - 1;
        hits.push(`[${key}] ${needle} → ${replacement} (${count}件)`);
        after = after.split(needle).join(replacement);
      }
    }
    if (after !== before) {
      totalChanged += 1;
      console.log(`[${write ? 'WRITE' : 'DRY'}] ${relative(ROOT, abs)}`);
      hits.forEach(h => console.log(`    - ${h}`));
      if (write) await writeFile(abs, after, 'utf8');
    }
  }

  if (write) {
    await writeFile(LOCK_PATH, JSON.stringify(currentValues, null, 2) + '\n', 'utf8');
    console.log(`\n${totalChanged}ファイルを更新した。`);
    console.log(`ロックファイル更新: ${relative(ROOT, LOCK_PATH)}`);
  } else {
    console.log(`\n${totalChanged}ファイルに差分あり。書き込むには --write を付けて再実行。`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
