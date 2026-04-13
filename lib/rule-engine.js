/**
 * ルール判定エンジン（純関数）
 *
 * Code.gs の `evaluateRule` / `routeRow` / `normalizeRow` / `makeDedupeKey` と
 * 同じロジックを、Node.js でテスト可能な形で再実装したもの。
 *
 * ロジックを変更したら両方を必ず更新すること（README の「Code.gs と lib/ の同期」参照）。
 */

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
  if (config && config.defaultTarget) return { rule: null, targetSheet: config.defaultTarget };
  return null;
}

function makeDedupeKey(row, columns) {
  if (!columns || columns.length === 0) return '';
  return columns.map(c => {
    const v = row[c - 1];
    return v === null || v === undefined ? '' : String(v);
  }).join('||');
}

module.exports = { normalizeRow, evaluateRule, routeRow, makeDedupeKey };
