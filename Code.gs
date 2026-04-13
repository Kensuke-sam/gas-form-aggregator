/**
 * フォーム仕分け自動化パック
 *
 * Googleフォーム回答を、設定シート駆動でカテゴリ別シートへ振り分ける。
 * ルール・通知・ログ・正規化・重複検知・ダッシュボード生成までを
 * すべてスプレッドシートの設定シート（_config / _rules / _normalize）から制御できる。
 *
 * 主要エントリポイント（カスタムメニュー「フォーム仕分け」から呼び出し）:
 *   - initSetupSheets       : 設定シートを初期化
 *   - sortAllResponses      : 全件を一括で仕分け
 *   - dryRunAllResponses    : ルールの結果だけを _log にプレビュー（書き込みなし）
 *   - testLatestResponse    : 最新1件でルールをテスト（書き込みなし）
 *   - generateDashboard     : _dashboard シートにサマリーを再生成
 *   - initDemo              : デモ用サンプルデータを投入（Before/After撮影用）
 *   - setAutoTrigger        : フォーム送信時トリガーを設定
 *   - removeAutoTrigger     : トリガーを解除
 *   - openLogSheet          : ログシートを開く
 *
 * ルール判定ロジックは lib/rule-engine.js と内容が同期しています。
 * ロジックを変更する場合は両方を更新してください。
 */

const SYSTEM = {
  CONFIG_SHEET: '_config',
  RULES_SHEET: '_rules',
  LOG_SHEET: '_log',
  NORMALIZE_SHEET: '_normalize',
  DASHBOARD_SHEET: '_dashboard',
  MENU_NAME: 'フォーム仕分け',
};

// =============================================================
// メニュー
// =============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(SYSTEM.MENU_NAME)
    .addItem('設定シートを初期化', 'initSetupSheets')
    .addSeparator()
    .addItem('全件を一括仕分け', 'sortAllResponses')
    .addItem('ドライラン（書き込みなし）', 'dryRunAllResponses')
    .addItem('テスト実行（最新1件）', 'testLatestResponse')
    .addSeparator()
    .addItem('ダッシュボードを再生成', 'generateDashboard')
    .addSeparator()
    .addItem('自動トリガーを設定', 'setAutoTrigger')
    .addItem('自動トリガーを解除', 'removeAutoTrigger')
    .addSeparator()
    .addItem('処理ログを開く', 'openLogSheet')
    .addItem('デモデータを投入', 'initDemo')
    .addToUi();
}

// =============================================================
// 設定シート初期化
// =============================================================

function initSetupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureConfigSheet(ss);
  ensureRulesSheet(ss);
  ensureNormalizeSheet(ss);
  ensureLogSheet(ss);
  SpreadsheetApp.getUi().alert(
    '設定シートを初期化しました。\n\n' +
    '1. 「' + SYSTEM.CONFIG_SHEET + '」で基本設定を調整\n' +
    '2. 「' + SYSTEM.RULES_SHEET + '」で仕分けルールを記述\n' +
    '3. （任意）「' + SYSTEM.NORMALIZE_SHEET + '」で表記揺れを吸収\n' +
    '4. メニューから「自動トリガーを設定」'
  );
}

function ensureConfigSheet(ss) {
  let sheet = ss.getSheetByName(SYSTEM.CONFIG_SHEET);
  if (sheet) return sheet;
  sheet = ss.insertSheet(SYSTEM.CONFIG_SHEET);
  const rows = [
    ['key', 'value', '説明'],
    ['source_sheet', 'フォームの回答 1', 'フォーム回答が入るシート名'],
    ['header_row', '1', 'ヘッダ行の行番号'],
    ['default_target', 'その他', 'どのルールにも合わなかった回答の行き先（空ならスキップ）'],
    ['dedupe_columns', '', '重複検知に使う列番号（カンマ区切り 例: 2,4 / 空なら重複検知なし）'],
    ['notify_enabled', 'true', 'メール通知の有効/無効（true / false）'],
    ['slack_webhook', '', 'Slack Incoming Webhook URL（空なら送信しない）'],
    ['chatwork_token', '', 'Chatwork APIトークン（空なら送信しない）'],
    ['chatwork_room_id', '', 'Chatwork ルームID'],
    ['log_enabled', 'true', '処理ログの有効/無効'],
    ['error_notify_email', '', 'エラー発生時の通知先メール（空ならスキップ）'],
  ];
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
  formatHeader(sheet, 3);
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 280);
  sheet.setColumnWidth(3, 440);
  return sheet;
}

function ensureRulesSheet(ss) {
  let sheet = ss.getSheetByName(SYSTEM.RULES_SHEET);
  if (sheet) return sheet;
  sheet = ss.insertSheet(SYSTEM.RULES_SHEET);
  const rows = [
    ['rule_name', 'match_column', 'operator', 'value', 'target_sheet', 'notify_email', 'slack_mention', '有効'],
    ['例：資料請求', '3', 'equals', '資料請求', '資料請求一覧', '', '', 'TRUE'],
    ['例：高額見積', '4', 'gte', '500000', '優先対応', 'manager@example.com', '@channel', 'TRUE'],
    ['例：社外ドメイン', '2', 'not_contains', '@example.com', '社外問い合わせ', '', '', 'TRUE'],
  ];
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  formatHeader(sheet, rows[0].length);
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 110);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 160);
  sheet.setColumnWidth(5, 180);
  sheet.setColumnWidth(6, 220);
  sheet.setColumnWidth(7, 120);
  sheet.setColumnWidth(8, 70);
  return sheet;
}

function ensureNormalizeSheet(ss) {
  let sheet = ss.getSheetByName(SYSTEM.NORMALIZE_SHEET);
  if (sheet) return sheet;
  sheet = ss.insertSheet(SYSTEM.NORMALIZE_SHEET);
  const rows = [
    ['column', 'raw', 'canonical', '有効'],
    ['3', '資料要求', '資料請求', 'TRUE'],
    ['3', '見積り', '見積もり', 'TRUE'],
  ];
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  formatHeader(sheet, rows[0].length);
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 200);
  sheet.setColumnWidth(4, 70);
  return sheet;
}

function ensureLogSheet(ss) {
  let sheet = ss.getSheetByName(SYSTEM.LOG_SHEET);
  if (sheet) return sheet;
  sheet = ss.insertSheet(SYSTEM.LOG_SHEET);
  sheet.getRange(1, 1, 1, 6).setValues([
    ['timestamp', 'matched_rule', 'target_sheet', 'notify_sent', 'status', 'detail'],
  ]);
  formatHeader(sheet, 6);
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(3, 160);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 100);
  sheet.setColumnWidth(6, 440);
  return sheet;
}

// =============================================================
// 設定読み込み
// =============================================================

function loadConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SYSTEM.CONFIG_SHEET);
  if (!sheet) {
    throw new Error('「' + SYSTEM.CONFIG_SHEET + '」シートが見つかりません。メニューから「設定シートを初期化」を実行してください。');
  }
  const values = sheet.getDataRange().getValues();
  const kv = {};
  for (let i = 1; i < values.length; i++) {
    const key = values[i][0];
    if (!key) continue;
    kv[String(key).trim()] = values[i][1];
  }
  return {
    sourceSheet: String(kv.source_sheet || 'フォームの回答 1'),
    headerRow: Number(kv.header_row || 1),
    defaultTarget: String(kv.default_target || '').trim(),
    dedupeColumns: parseDedupeColumns(kv.dedupe_columns),
    notifyEnabled: toBool(kv.notify_enabled),
    slackWebhook: String(kv.slack_webhook || '').trim(),
    chatworkToken: String(kv.chatwork_token || '').trim(),
    chatworkRoomId: String(kv.chatwork_room_id || '').trim(),
    logEnabled: toBool(kv.log_enabled),
    errorNotifyEmail: String(kv.error_notify_email || '').trim(),
  };
}

function parseDedupeColumns(v) {
  if (!v) return [];
  return String(v).split(',').map(s => Number(s.trim())).filter(n => Number.isInteger(n) && n > 0);
}

function loadRules() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SYSTEM.RULES_SHEET);
  if (!sheet) {
    throw new Error('「' + SYSTEM.RULES_SHEET + '」シートが見つかりません。メニューから「設定シートを初期化」を実行してください。');
  }
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const rules = [];
  for (let i = 1; i < values.length; i++) {
    const [ruleName, col, op, value, target, notifyEmail, slackMention, enabled] = values[i];
    if (!ruleName && !target) continue;
    if (enabled !== undefined && enabled !== '' && !toBool(enabled)) continue;
    rules.push({
      ruleName: String(ruleName || '').trim(),
      column: Number(col),
      operator: String(op || '').trim().toLowerCase(),
      value: value,
      targetSheet: String(target || '').trim(),
      notifyEmail: String(notifyEmail || '').trim(),
      slackMention: String(slackMention || '').trim(),
    });
  }
  return rules;
}

function loadNormalizeMap() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SYSTEM.NORMALIZE_SHEET);
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return {};
  const map = {};
  for (let i = 1; i < values.length; i++) {
    const [col, raw, canonical, enabled] = values[i];
    if (!col || raw === '' || raw === undefined) continue;
    if (enabled !== undefined && enabled !== '' && !toBool(enabled)) continue;
    const c = Number(col);
    if (!Number.isInteger(c) || c < 1) continue;
    if (!map[c]) map[c] = {};
    map[c][String(raw)] = String(canonical || '');
  }
  return map;
}

function toBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}

// =============================================================
// 正規化・ルール判定
// =============================================================

function normalizeRow(row, normalizeMap) {
  if (!normalizeMap) return row;
  const out = row.slice();
  Object.keys(normalizeMap).forEach(colStr => {
    const col = Number(colStr);
    const idx = col - 1;
    if (idx < 0 || idx >= out.length) return;
    const current = out[idx];
    const key = current === null || current === undefined ? '' : String(current);
    if (normalizeMap[col] && Object.prototype.hasOwnProperty.call(normalizeMap[col], key)) {
      out[idx] = normalizeMap[col][key];
    }
  });
  return out;
}

function evaluateRule(rule, row) {
  if (rule.operator === 'any' || rule.operator === 'default') return true;
  if (!rule.column || rule.column < 1) return false;
  const cell = row[rule.column - 1];
  const s = cell === null || cell === undefined ? '' : String(cell);
  const v = rule.value === null || rule.value === undefined ? '' : String(rule.value);
  switch (rule.operator) {
    case 'equals': return s.trim() === v.trim();
    case 'not_equals': return s.trim() !== v.trim();
    case 'contains': return v !== '' && s.indexOf(v) !== -1;
    case 'not_contains': return v === '' || s.indexOf(v) === -1;
    case 'starts_with': return v !== '' && s.indexOf(v) === 0;
    case 'ends_with': return v !== '' && s.length >= v.length && s.lastIndexOf(v) === s.length - v.length;
    case 'regex':
      try { return new RegExp(v).test(s); } catch (_) { return false; }
    case 'gte': return Number(cell) >= Number(v);
    case 'lte': return Number(cell) <= Number(v);
    case 'gt': return Number(cell) > Number(v);
    case 'lt': return Number(cell) < Number(v);
    case 'eq': return Number(cell) === Number(v);
    default: return false;
  }
}

function routeRow(row, rules, config) {
  for (const rule of rules) {
    if (evaluateRule(rule, row)) {
      return { rule: rule, targetSheet: rule.targetSheet };
    }
  }
  if (config.defaultTarget) return { rule: null, targetSheet: config.defaultTarget };
  return null;
}

function makeDedupeKey(row, columns) {
  if (!columns || columns.length === 0) return '';
  return columns.map(c => {
    const v = row[c - 1];
    return v === null || v === undefined ? '' : String(v);
  }).join('||');
}

// =============================================================
// 一括仕分け
// =============================================================

function sortAllResponses() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const config = loadConfig();
    const rules = loadRules();
    const normMap = loadNormalizeMap();
    const source = ss.getSheetByName(config.sourceSheet);
    if (!source) throw new Error('ソースシートが見つかりません：' + config.sourceSheet);

    const data = source.getDataRange().getValues();
    if (data.length <= config.headerRow) {
      SpreadsheetApp.getUi().alert('仕分け対象のデータがありません。');
      return;
    }
    const headers = data[config.headerRow - 1];
    const rows = data.slice(config.headerRow).map(r => normalizeRow(r, normMap));

    const grouped = {};
    const seenKeys = {};
    let skipped = 0;
    let duplicated = 0;

    rows.forEach(row => {
      const result = routeRow(row, rules, config);
      if (!result || !result.targetSheet) { skipped++; return; }
      if (isSystemSheet(result.targetSheet) || result.targetSheet === config.sourceSheet) { skipped++; return; }

      if (config.dedupeColumns.length > 0) {
        const key = makeDedupeKey(row, config.dedupeColumns);
        if (key && seenKeys[key]) { duplicated++; return; }
        if (key) seenKeys[key] = true;
      }

      if (!grouped[result.targetSheet]) grouped[result.targetSheet] = [];
      grouped[result.targetSheet].push(row);
    });

    Object.keys(grouped).forEach(target => {
      const sheet = getOrCreateSheet(ss, target);
      sheet.clearContents();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeader(sheet, headers.length);
      sheet.getRange(2, 1, grouped[target].length, headers.length).setValues(grouped[target]);
    });

    const total = Object.values(grouped).reduce((a, b) => a + b.length, 0);
    writeLog(config, {
      ruleName: '(一括)',
      targetSheet: Object.keys(grouped).join(', '),
      notifySent: false,
      status: 'success',
      detail: '振り分け: ' + total + '件 / スキップ: ' + skipped + '件 / 重複除外: ' + duplicated + '件',
    });
    SpreadsheetApp.getUi().alert('仕分け完了\n\n振り分け: ' + total + '件\nスキップ: ' + skipped + '件\n重複除外: ' + duplicated + '件');
  } catch (err) {
    handleError(err);
  }
}

// =============================================================
// ドライラン
// =============================================================

function dryRunAllResponses() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const config = loadConfig();
    const rules = loadRules();
    const normMap = loadNormalizeMap();
    const source = ss.getSheetByName(config.sourceSheet);
    if (!source) throw new Error('ソースシートが見つかりません：' + config.sourceSheet);

    const data = source.getDataRange().getValues();
    if (data.length <= config.headerRow) {
      SpreadsheetApp.getUi().alert('テスト対象のデータがありません。');
      return;
    }
    const rows = data.slice(config.headerRow).map(r => normalizeRow(r, normMap));

    const counts = {};
    let matched = 0, unmatched = 0;
    rows.forEach(row => {
      const result = routeRow(row, rules, config);
      if (result && result.targetSheet) {
        const key = (result.rule ? result.rule.ruleName : '(default)') + ' → ' + result.targetSheet;
        counts[key] = (counts[key] || 0) + 1;
        matched++;
      } else {
        unmatched++;
      }
    });

    const summary = Object.keys(counts).map(k => '  ' + k + ': ' + counts[k] + '件').join('\n');
    writeLog(config, {
      ruleName: '(dry-run)',
      targetSheet: '',
      notifySent: false,
      status: 'dry-run',
      detail: 'マッチ: ' + matched + '件 / 未マッチ: ' + unmatched + '件 / ' + Object.keys(counts).length + '分類',
    });
    SpreadsheetApp.getUi().alert(
      'ドライラン結果（書き込みはしていません）\n\n' +
      summary + '\n\n' +
      '未マッチ: ' + unmatched + '件'
    );
  } catch (err) {
    handleError(err);
  }
}

// =============================================================
// フォーム送信トリガー
// =============================================================

function onFormSubmit(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const config = loadConfig();
    const rules = loadRules();
    const normMap = loadNormalizeMap();
    const rawRow = e && e.values ? e.values : null;
    if (!rawRow) return;
    const row = normalizeRow(rawRow, normMap);

    const source = ss.getSheetByName(config.sourceSheet);
    if (!source) throw new Error('ソースシートが見つかりません：' + config.sourceSheet);
    const headers = source.getRange(config.headerRow, 1, 1, source.getLastColumn()).getValues()[0];

    const result = routeRow(row, rules, config);
    if (!result || !result.targetSheet) {
      writeLog(config, { ruleName: '(該当なし)', targetSheet: '', notifySent: false, status: 'skipped', detail: '該当ルールなし' });
      return;
    }
    if (isSystemSheet(result.targetSheet) || result.targetSheet === config.sourceSheet) {
      writeLog(config, { ruleName: result.rule ? result.rule.ruleName : '(default)', targetSheet: result.targetSheet, notifySent: false, status: 'skipped', detail: 'システム/ソースシートへの書き込みは拒否' });
      return;
    }

    const sheet = getOrCreateSheet(ss, result.targetSheet);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      formatHeader(sheet, headers.length);
    }

    if (config.dedupeColumns.length > 0) {
      const key = makeDedupeKey(row, config.dedupeColumns);
      if (key && isDuplicateInSheet(sheet, headers.length, config.dedupeColumns, key)) {
        writeLog(config, { ruleName: result.rule ? result.rule.ruleName : '(default)', targetSheet: result.targetSheet, notifySent: false, status: 'duplicate', detail: '重複キー: ' + key });
        return;
      }
    }

    sheet.appendRow(row);

    let notifySent = false;
    if (config.notifyEnabled && result.rule && result.rule.notifyEmail) {
      sendEmailNotification(result.rule.notifyEmail, result.targetSheet, headers, row, ss.getUrl());
      notifySent = true;
    }
    if (config.slackWebhook) {
      sendSlackNotification(config.slackWebhook, result, headers, row);
    }
    if (config.chatworkToken && config.chatworkRoomId) {
      sendChatworkNotification(config, result, headers, row);
    }

    writeLog(config, {
      ruleName: result.rule ? result.rule.ruleName : '(default)',
      targetSheet: result.targetSheet,
      notifySent: notifySent,
      status: 'success',
      detail: '',
    });
  } catch (err) {
    handleError(err);
  }
}

function isDuplicateInSheet(sheet, numColumns, dedupeColumns, key) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  const values = sheet.getRange(2, 1, lastRow - 1, numColumns).getValues();
  for (let i = 0; i < values.length; i++) {
    if (makeDedupeKey(values[i], dedupeColumns) === key) return true;
  }
  return false;
}

// =============================================================
// テスト実行（最新1件）
// =============================================================

function testLatestResponse() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const config = loadConfig();
    const rules = loadRules();
    const normMap = loadNormalizeMap();
    const source = ss.getSheetByName(config.sourceSheet);
    if (!source) throw new Error('ソースシートが見つかりません：' + config.sourceSheet);

    const lastRow = source.getLastRow();
    if (lastRow <= config.headerRow) {
      SpreadsheetApp.getUi().alert('テスト対象の行がありません。');
      return;
    }
    const raw = source.getRange(lastRow, 1, 1, source.getLastColumn()).getValues()[0];
    const row = normalizeRow(raw, normMap);
    const result = routeRow(row, rules, config);
    const ruleName = result && result.rule ? result.rule.ruleName : (result ? '(default)' : '(該当なし)');
    const target = result ? result.targetSheet : '(なし)';
    SpreadsheetApp.getUi().alert(
      'テスト結果（書き込みはしていません）\n\n' +
      'マッチしたルール: ' + ruleName + '\n' +
      '振り分け先シート: ' + target
    );
  } catch (err) {
    handleError(err);
  }
}

// =============================================================
// 通知
// =============================================================

function sendEmailNotification(to, target, headers, row, sheetUrl) {
  const subject = '[' + target + '] 新規フォーム回答';
  const body = headers.map((h, i) => '・' + h + ': ' + (row[i] !== undefined ? row[i] : '')).join('\n');
  const tail = sheetUrl ? '\n\nシートを開く: ' + sheetUrl : '';
  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: body + tail + '\n\n---\n自動送信: フォーム仕分け自動化パック',
  });
}

function sendSlackNotification(webhook, result, headers, row) {
  const target = result.targetSheet;
  const ruleName = result.rule ? result.rule.ruleName : '(default)';
  const mention = result.rule && result.rule.slackMention ? result.rule.slackMention + ' ' : '';
  const lines = headers.map((h, i) => '• *' + h + '*: ' + (row[i] !== undefined ? row[i] : '')).join('\n');
  const payload = {
    text: mention + '新規フォーム回答 *' + target + '* (ルール: ' + ruleName + ')\n' + lines,
  };
  UrlFetchApp.fetch(webhook, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}

function sendChatworkNotification(config, result, headers, row) {
  const target = result.targetSheet;
  const ruleName = result.rule ? result.rule.ruleName : '(default)';
  const lines = headers.map((h, i) => h + ': ' + (row[i] !== undefined ? row[i] : '')).join('\n');
  const body = '[info][title]新規フォーム回答 (' + target + ')[/title]ルール: ' + ruleName + '\n' + lines + '[/info]';
  const url = 'https://api.chatwork.com/v2/rooms/' + encodeURIComponent(config.chatworkRoomId) + '/messages';
  UrlFetchApp.fetch(url, {
    method: 'post',
    headers: { 'X-ChatWorkToken': config.chatworkToken },
    payload: { body: body },
    muteHttpExceptions: true,
  });
}

// =============================================================
// ダッシュボード生成
// =============================================================

function generateDashboard() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const config = loadConfig();
    const rules = loadRules();
    const normMap = loadNormalizeMap();
    const source = ss.getSheetByName(config.sourceSheet);
    if (!source) throw new Error('ソースシートが見つかりません：' + config.sourceSheet);

    const data = source.getDataRange().getValues();
    if (data.length <= config.headerRow) {
      SpreadsheetApp.getUi().alert('集計対象のデータがありません。');
      return;
    }
    const rows = data.slice(config.headerRow).map(r => normalizeRow(r, normMap));

    const byCategory = {};
    const byDate = {};
    const byRule = {};
    let unmatched = 0;

    rows.forEach(row => {
      const result = routeRow(row, rules, config);
      const target = result && result.targetSheet ? result.targetSheet : '(未マッチ)';
      const ruleName = result && result.rule ? result.rule.ruleName : (result ? '(default)' : '(未マッチ)');
      byCategory[target] = (byCategory[target] || 0) + 1;
      byRule[ruleName] = (byRule[ruleName] || 0) + 1;
      if (!result || !result.targetSheet) unmatched++;

      // 1列目をタイムスタンプと見なす
      const ts = row[0];
      if (ts instanceof Date) {
        const d = Utilities.formatDate(ts, Session.getScriptTimeZone() || 'Asia/Tokyo', 'yyyy-MM-dd');
        byDate[d] = (byDate[d] || 0) + 1;
      }
    });

    let sheet = ss.getSheetByName(SYSTEM.DASHBOARD_SHEET);
    if (!sheet) sheet = ss.insertSheet(SYSTEM.DASHBOARD_SHEET);
    sheet.clear();

    let r = 1;
    sheet.getRange(r, 1).setValue('ダッシュボード').setFontWeight('bold').setFontSize(16);
    r += 1;
    sheet.getRange(r, 1).setValue('生成: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Tokyo', 'yyyy-MM-dd HH:mm'));
    r += 2;

    r = writeDashboardSection(sheet, r, 'カテゴリ別 件数', byCategory);
    r = writeDashboardSection(sheet, r, 'ルール別 件数', byRule);
    r = writeDashboardSection(sheet, r, '日付別 件数', byDate, true);

    sheet.getRange(r, 1).setValue('合計: ' + rows.length + '件  /  未マッチ: ' + unmatched + '件').setFontWeight('bold');

    sheet.autoResizeColumns(1, 2);
    ss.setActiveSheet(sheet);
  } catch (err) {
    handleError(err);
  }
}

function writeDashboardSection(sheet, startRow, title, dict, sortByKey) {
  let r = startRow;
  sheet.getRange(r, 1).setValue(title).setFontWeight('bold').setBackground('#e2e8f0');
  sheet.getRange(r, 2).setBackground('#e2e8f0');
  r += 1;
  const keys = Object.keys(dict);
  if (sortByKey) keys.sort(); else keys.sort((a, b) => dict[b] - dict[a]);
  keys.forEach(key => {
    sheet.getRange(r, 1).setValue(key);
    sheet.getRange(r, 2).setValue(dict[key]);
    r += 1;
  });
  return r + 1;
}

// =============================================================
// デモデータ投入
// =============================================================

function initDemo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert(
    'デモデータ投入',
    'デモ用のフォーム回答10件を「' + (loadConfigOrDefault().sourceSheet) + '」シートに投入し、ルール・正規化マップのサンプルを整えます。よろしいですか？',
    ui.ButtonSet.OK_CANCEL
  );
  if (res !== ui.Button.OK) return;

  try {
    ensureConfigSheet(ss);
    ensureRulesSheet(ss);
    ensureNormalizeSheet(ss);
    ensureLogSheet(ss);

    const config = loadConfig();
    let source = ss.getSheetByName(config.sourceSheet);
    if (!source) source = ss.insertSheet(config.sourceSheet);
    source.clear();
    const headers = ['タイムスタンプ', 'メールアドレス', '参加区分', '希望日程', '同伴人数'];
    source.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeader(source, headers.length);
    const base = new Date();
    const sample = [
      ['一般', '4/20', 0],
      ['学生', '4/21', 1],
      ['関係者', '4/20', 0],
      ['一般', '4/22', 3],
      ['学生', '4/20', 0],
      ['一般', '4/21', 4],
      ['関係者', '4/22', 0],
      ['学生', '4/22', 2],
      ['一般', '4/20', 0],
      ['一般', '4/21', 1],
    ];
    const rows = sample.map((s, i) => {
      const ts = new Date(base.getTime() - (sample.length - i) * 45 * 60 * 1000);
      return [ts, 'user' + String.fromCharCode(97 + i) + '@example.com', s[0], s[1], s[2]];
    });
    source.getRange(2, 1, rows.length, headers.length).setValues(rows);

    // ルールも上書き
    const rules = ss.getSheetByName(SYSTEM.RULES_SHEET);
    rules.clear();
    const ruleRows = [
      ['rule_name', 'match_column', 'operator', 'value', 'target_sheet', 'notify_email', 'slack_mention', '有効'],
      ['学生', '3', 'equals', '学生', '学生申込', '', '', 'TRUE'],
      ['関係者', '3', 'equals', '関係者', '関係者申込', '', '', 'TRUE'],
      ['団体申込', '5', 'gte', '3', '団体対応', '', '@channel', 'TRUE'],
      ['4/20 開催', '4', 'equals', '4/20', '4月20日分', '', '', 'TRUE'],
    ];
    rules.getRange(1, 1, ruleRows.length, ruleRows[0].length).setValues(ruleRows);
    formatHeader(rules, ruleRows[0].length);

    ui.alert(
      'デモデータを投入しました。\n\n' +
      '次に「全件を一括仕分け」を実行すると、カテゴリ別シートが自動で作られます。\n' +
      'Before/After のスクリーンショット撮影に使えます。'
    );
  } catch (err) {
    handleError(err);
  }
}

function loadConfigOrDefault() {
  try { return loadConfig(); } catch (_) { return { sourceSheet: 'フォームの回答 1' }; }
}

// =============================================================
// ログ・エラー処理
// =============================================================

function writeLog(config, entry) {
  if (!config.logEnabled) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SYSTEM.LOG_SHEET);
  if (!sheet) sheet = ensureLogSheet(ss);
  sheet.appendRow([new Date(), entry.ruleName, entry.targetSheet, entry.notifySent, entry.status, entry.detail]);
}

function handleError(err) {
  Logger.log(err && err.stack ? err.stack : err);
  try {
    const config = loadConfig();
    writeLog(config, { ruleName: '', targetSheet: '', notifySent: false, status: 'error', detail: String(err) });
    if (config.errorNotifyEmail) {
      MailApp.sendEmail({
        to: config.errorNotifyEmail,
        subject: '[フォーム仕分け] エラー発生',
        body: String(err) + '\n\n' + (err && err.stack ? err.stack : ''),
      });
    }
  } catch (_) { /* config読み込み前のエラーは握りつぶす */ }
  try { SpreadsheetApp.getUi().alert('エラー: ' + err); } catch (_) { /* トリガー実行時はUIなし */ }
}

// =============================================================
// ユーティリティ
// =============================================================

function isSystemSheet(name) {
  return name === SYSTEM.CONFIG_SHEET || name === SYSTEM.RULES_SHEET || name === SYSTEM.LOG_SHEET
      || name === SYSTEM.NORMALIZE_SHEET || name === SYSTEM.DASHBOARD_SHEET;
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function formatHeader(sheet, numColumns) {
  sheet.getRange(1, 1, 1, numColumns)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

function openLogSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SYSTEM.LOG_SHEET);
  if (sheet) ss.setActiveSheet(sheet);
  else SpreadsheetApp.getUi().alert('「' + SYSTEM.LOG_SHEET + '」シートがありません。先に「設定シートを初期化」を実行してください。');
}

// =============================================================
// トリガー管理
// =============================================================

function setAutoTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
  SpreadsheetApp.getUi().alert('自動トリガーを設定しました。');
}

function removeAutoTrigger() {
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  SpreadsheetApp.getUi().alert('自動トリガーを解除しました（' + removed + '件）。');
}
