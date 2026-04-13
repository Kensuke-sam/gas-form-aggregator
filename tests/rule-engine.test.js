const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRow, evaluateRule, routeRow, makeDedupeKey } = require('../lib/rule-engine.js');

// -----------------------------------------------------------------
// evaluateRule
// -----------------------------------------------------------------

test('equals: 前後スペースを無視して完全一致', () => {
  assert.equal(evaluateRule({ column: 1, operator: 'equals', value: '資料請求' }, ['資料請求 ']), true);
  assert.equal(evaluateRule({ column: 1, operator: 'equals', value: '資料請求' }, [' 資料請求']), true);
  assert.equal(evaluateRule({ column: 1, operator: 'equals', value: '資料請求' }, ['見積もり']), false);
});

test('not_equals: 否定の完全一致', () => {
  assert.equal(evaluateRule({ column: 1, operator: 'not_equals', value: '資料請求' }, ['見積もり']), true);
  assert.equal(evaluateRule({ column: 1, operator: 'not_equals', value: '資料請求' }, ['資料請求']), false);
});

test('contains: 部分一致、空valueはfalse', () => {
  assert.equal(evaluateRule({ column: 1, operator: 'contains', value: '株式会社' }, ['株式会社ABC']), true);
  assert.equal(evaluateRule({ column: 1, operator: 'contains', value: '株式会社' }, ['ABC合同会社']), false);
  assert.equal(evaluateRule({ column: 1, operator: 'contains', value: '' }, ['任意の文字列']), false);
});

test('not_contains: 空valueは常にtrue（＝含まないと見なす）', () => {
  assert.equal(evaluateRule({ column: 1, operator: 'not_contains', value: '@example.com' }, ['user@gmail.com']), true);
  assert.equal(evaluateRule({ column: 1, operator: 'not_contains', value: '@example.com' }, ['user@example.com']), false);
  assert.equal(evaluateRule({ column: 1, operator: 'not_contains', value: '' }, ['何でも']), true);
});

test('starts_with / ends_with', () => {
  assert.equal(evaluateRule({ column: 1, operator: 'starts_with', value: '急' }, ['急ぎで依頼']), true);
  assert.equal(evaluateRule({ column: 1, operator: 'starts_with', value: '急' }, ['お急ぎで']), false);
  assert.equal(evaluateRule({ column: 1, operator: 'ends_with', value: '御中' }, ['ABC株式会社御中']), true);
  assert.equal(evaluateRule({ column: 1, operator: 'ends_with', value: '御中' }, ['御中です']), false);
});

test('regex: 無効な正規表現はfalse', () => {
  assert.equal(evaluateRule({ column: 1, operator: 'regex', value: '^[0-9]{3}$' }, ['123']), true);
  assert.equal(evaluateRule({ column: 1, operator: 'regex', value: '^[0-9]{3}$' }, ['12']), false);
  assert.equal(evaluateRule({ column: 1, operator: 'regex', value: '[' }, ['abc']), false);
});

test('数値比較: gte / lte / gt / lt / eq', () => {
  assert.equal(evaluateRule({ column: 1, operator: 'gte', value: '500000' }, [500000]), true);
  assert.equal(evaluateRule({ column: 1, operator: 'gte', value: '500000' }, [499999]), false);
  assert.equal(evaluateRule({ column: 1, operator: 'lte', value: '100' }, [100]), true);
  assert.equal(evaluateRule({ column: 1, operator: 'gt', value: '0' }, [1]), true);
  assert.equal(evaluateRule({ column: 1, operator: 'gt', value: '0' }, [0]), false);
  assert.equal(evaluateRule({ column: 1, operator: 'lt', value: '0' }, [-1]), true);
  assert.equal(evaluateRule({ column: 1, operator: 'eq', value: '1' }, [1]), true);
  assert.equal(evaluateRule({ column: 1, operator: 'eq', value: '1' }, [2]), false);
});

test('any / default: 常にtrue', () => {
  assert.equal(evaluateRule({ operator: 'any' }, []), true);
  assert.equal(evaluateRule({ operator: 'default' }, []), true);
});

test('未知のoperator: false', () => {
  assert.equal(evaluateRule({ column: 1, operator: 'unknown', value: 'x' }, ['x']), false);
});

test('column不正: false', () => {
  assert.equal(evaluateRule({ column: 0, operator: 'equals', value: 'x' }, ['x']), false);
  assert.equal(evaluateRule({ column: -1, operator: 'equals', value: 'x' }, ['x']), false);
});

test('null / undefined: 空文字扱い', () => {
  assert.equal(evaluateRule({ column: 1, operator: 'equals', value: '' }, [null]), true);
  assert.equal(evaluateRule({ column: 1, operator: 'equals', value: '' }, [undefined]), true);
});

// -----------------------------------------------------------------
// routeRow
// -----------------------------------------------------------------

test('routeRow: 最初にマッチしたルールが採用される', () => {
  const rules = [
    { ruleName: '高額', column: 4, operator: 'gte', value: '500000', targetSheet: '優先対応' },
    { ruleName: '中額', column: 4, operator: 'gte', value: '100000', targetSheet: '通常対応' },
    { ruleName: '低額', column: 4, operator: 'any', targetSheet: '低額対応' },
  ];
  const result = routeRow([null, null, null, 600000], rules, {});
  assert.equal(result.rule.ruleName, '高額');
  assert.equal(result.targetSheet, '優先対応');
});

test('routeRow: どれにもマッチしない場合 defaultTarget へ', () => {
  const rules = [{ ruleName: 'A', column: 1, operator: 'equals', value: 'a', targetSheet: 'Aシート' }];
  const result = routeRow(['z'], rules, { defaultTarget: 'その他' });
  assert.equal(result.rule, null);
  assert.equal(result.targetSheet, 'その他');
});

test('routeRow: defaultTargetもなければnull', () => {
  const rules = [{ ruleName: 'A', column: 1, operator: 'equals', value: 'a', targetSheet: 'Aシート' }];
  const result = routeRow(['z'], rules, {});
  assert.equal(result, null);
});

// -----------------------------------------------------------------
// normalizeRow
// -----------------------------------------------------------------

test('normalizeRow: 指定列の値をマッピングで置換', () => {
  const map = { 3: { '資料要求': '資料請求', '見積り': '見積もり' } };
  assert.deepEqual(
    normalizeRow(['ts', 'a@example.com', '資料要求'], map),
    ['ts', 'a@example.com', '資料請求']
  );
});

test('normalizeRow: マッピングに無い値はそのまま', () => {
  const map = { 3: { '資料要求': '資料請求' } };
  assert.deepEqual(normalizeRow(['ts', 'a@example.com', '採用'], map), ['ts', 'a@example.com', '採用']);
});

test('normalizeRow: 元の配列は変更されない', () => {
  const map = { 1: { 'old': 'new' } };
  const original = ['old', 'x'];
  const result = normalizeRow(original, map);
  assert.equal(original[0], 'old');
  assert.equal(result[0], 'new');
});

// -----------------------------------------------------------------
// makeDedupeKey
// -----------------------------------------------------------------

test('makeDedupeKey: 複数列を||で連結', () => {
  assert.equal(makeDedupeKey(['ts', 'a@example.com', 'x', '100'], [2, 4]), 'a@example.com||100');
});

test('makeDedupeKey: 空配列なら空文字', () => {
  assert.equal(makeDedupeKey(['a'], []), '');
});

test('makeDedupeKey: null/undefinedは空文字', () => {
  assert.equal(makeDedupeKey([null, undefined, 'x'], [1, 2, 3]), '||||x');
});
