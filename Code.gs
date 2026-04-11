/**
 * Googleフォーム回答 → スプレッドシート自動整理ツール
 */
const CONFIG = {
  SOURCE_SHEET_NAME: 'フォームの回答 1',
  CATEGORY_COLUMN: 3,
  HEADER_ROW: 1,
};

function sortAllResponses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const source = ss.getSheetByName(CONFIG.SOURCE_SHEET_NAME);
  if (!source) { SpreadsheetApp.getUi().alert('シートが見つかりません'); return; }
  const data = source.getDataRange().getValues();
  if (data.length <= CONFIG.HEADER_ROW) { Logger.log('データがありません'); return; }
  const headers = data[CONFIG.HEADER_ROW - 1];
  const rows = data.slice(CONFIG.HEADER_ROW);
  const grouped = {};
  rows.forEach(row => {
    const category = String(row[CONFIG.CATEGORY_COLUMN - 1]).trim();
    if (!category) return;
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(row);
  });
  Object.keys(grouped).forEach(category => {
    const sheet = getOrCreateSheet(ss, category);
    if (sheet.getLastRow() === 0) { sheet.appendRow(headers); formatHeader(sheet, headers.length); }
    if (sheet.getLastRow() > 1) { sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent(); }
    sheet.getRange(2, 1, grouped[category].length, headers.length).setValues(grouped[category]);
    Logger.log('[' + category + '] → ' + grouped[category].length + ' 件完了');
  });
}

function onFormSubmit(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const row = e.values;
  const category = String(row[CONFIG.CATEGORY_COLUMN - 1]).trim();
  if (!category) return;
  const source = ss.getSheetByName(CONFIG.SOURCE_SHEET_NAME);
  const headers = source.getRange(1, 1, 1, source.getLastColumn()).getValues()[0];
  const sheet = getOrCreateSheet(ss, category);
  if (sheet.getLastRow() === 0) { sheet.appendRow(headers); formatHeader(sheet, headers.length); }
  sheet.appendRow(row);
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); }
  return sheet;
}

function formatHeader(sheet, numColumns) {
  sheet.getRange(1, 1, 1, numColumns).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff').setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

function setAutoTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onFormSubmit().create();
  SpreadsheetApp.getUi().alert('トリガー設定完了！');
}

function removeAutoTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t); });
}
