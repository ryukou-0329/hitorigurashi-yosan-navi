import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { agentFeeReference, calculate, type CalcInput } from '../src/lib/calc';
import { manYen, monthsLabel, parseNumber, yen } from '../src/lib/format';
import { KAKEI, STATISTICS, statBasis } from '../src/data/statistics';
import { LIVING_CATEGORIES } from '../src/data/standards';

// ---------- format ----------
assert.equal(yen(150000), '150,000円');
assert.equal(yen(-12000), '-12,000円');
assert.equal(manYen(150000), '15万円');
assert.equal(monthsLabel(14), '約1年2か月');
assert.equal(monthsLabel(5), '約5か月');
assert.equal(parseNumber('１５０，０００'), 150000);
assert.equal(parseNumber(''), null);

// ---------- 仲介手数料の参考額（家賃0.5か月分＋消費税10%） ----------
assert.equal(agentFeeReference(70000), 38500);
assert.equal(agentFeeReference(65432), 35988); // 35987.6 を四捨五入

// ---------- 一次統計データの保持項目 ----------
for (const s of STATISTICS) {
  for (const key of ['id', 'group', 'groupShort', 'item', 'table', 'sourceName', 'sourceUrl', 'checkedAt'] as const) {
    assert.ok(s[key] && s[key].length > 0, `${s.id}: ${key} is empty`);
  }
  assert.ok(Number.isInteger(s.year) && s.year >= 2000, `${s.id}: year`);
  assert.ok(Number.isInteger(s.amountYen) && s.amountYen > 0, `${s.id}: amountYen`);
  assert.ok(s.sourceUrl.startsWith('https://www.stat.go.jp/'), `${s.id}: sourceUrl`);
  assert.match(s.checkedAt, /^\d{4}-\d{2}$/, `${s.id}: checkedAt`);
}
assert.equal(KAKEI.consumption.amountYen, 173042);
assert.equal(KAKEI.food.amountYen, 49321);
assert.equal(KAKEI.housing.amountYen, 21667);
assert.equal(KAKEI.utilities.amountYen, 13333);
assert.equal(statBasis(KAKEI.food), '2025年・単身世帯の食料の月平均');
const food = LIVING_CATEGORIES.find((c) => c.id === 'food');
assert.equal(food?.presets[0]?.amount, KAKEI.food.amountYen);
assert.ok(food?.presets[0]?.label.includes('2025年・単身世帯'));

// ---------- 計算 ----------
const base: CalcInput = {
  takeHome: 200000,
  rent: 70000,
  savings: 300000,
  living: [
    { id: 'food', label: '食費', amount: 45000, benchmark: { amount: KAKEI.food.amountYen, label: '統計値' } },
    { id: 'utilities', label: '水道光熱費', amount: null },
    { id: 'phone', label: 'スマホ料金', amount: 3000 },
    { id: 'commute', label: '通勤交通費', amount: 0 },
    { id: 'hobby', label: '趣味・娯楽費', amount: 20000 },
    { id: 'subs', label: 'サブスク費', amount: 2000 },
  ],
  initial: {
    depositMonths: 1,
    keyMoneyMonths: 1,
    agent: 40000,
    guarantee: 35000,
    fire: 15000,
    keyExchange: 15000,
    moving: 50000,
    furniture: 100000,
    other: null,
  },
};

const r = calculate(base);
assert.equal(r.monthlyCost, 70000 + 45000 + 3000 + 0 + 20000 + 2000);
assert.deepEqual(r.missingLiving, ['水道光熱費']);
assert.equal(r.livingComplete, false);
assert.equal(r.monthlySurplus, 200000 - r.monthlyCost);
assert.equal(r.yearlySurplus, r.monthlySurplus * 12);
// 初期費用は入力値の合計: 70,000 + 70,000 + 40,000 + 35,000 + 15,000 + 15,000 + 50,000 + 100,000
assert.equal(r.initialTotal, 395000);
assert.equal(r.initialComplete, true);
assert.equal(r.shortfall, 95000);
assert.equal(r.savingsAfter, -95000);
assert.equal(r.monthsToCover, Math.ceil(95000 / r.monthlySurplus));
assert.equal(r.status, 'short');

// 仲介手数料が未入力: 参考額は別表示のみで、合計に含めない／未入力扱い
const noAgent = calculate({ ...base, initial: { ...base.initial, agent: null } });
assert.equal(noAgent.initialTotal, 355000);
assert.equal(noAgent.initialComplete, false);
assert.ok(noAgent.missingInitial.includes('仲介手数料'));
assert.equal(noAgent.agentReference, 38500);
const agentLine = noAgent.initialLines.find((l) => l.id === 'agent');
assert.equal(agentLine?.amount, null);
assert.equal(agentLine?.reference, 38500);

// 入力が少ない状態: 合計は入力済み分だけで、未完了として扱う
const sparse = calculate({
  ...base,
  initial: {
    depositMonths: null, keyMoneyMonths: null, agent: null, guarantee: null,
    fire: null, keyExchange: null, moving: null, furniture: null, other: null,
  },
});
assert.equal(sparse.initialTotal, 0);
assert.equal(sparse.initialComplete, false);
assert.equal(sparse.missingInitial.length, 8); // その他は任意
assert.equal(sparse.status, 'check'); // 不足なし・未入力あり -> 要確認

// 貯金が十分・未入力なし -> ok（入力上は残額あり）
const rich = calculate({
  ...base,
  savings: 2000000,
  living: base.living.map((l) => (l.amount === null ? { ...l, amount: 8000 } : l)),
});
assert.equal(rich.status, 'ok');
assert.equal(rich.livingComplete, true);
assert.equal(rich.monthsToCover, 0);

// 未入力があり不足なし -> check
assert.equal(calculate({ ...base, savings: 2000000 }).status, 'check');

// 貯金未入力 -> 貯金に依存する値は null
const noSave = calculate({ ...base, savings: null });
assert.equal(noSave.status, null);
assert.equal(noSave.shortfall, null);

// 赤字 -> 貯まらない
const deficit = calculate({ ...base, takeHome: 100000 });
assert.equal(deficit.cannotCover, true);
assert.equal(deficit.monthsToCover, null);

// 手取り・家賃が未入力 -> not ready
assert.equal(calculate({ ...base, takeHome: null }).ready, false);

// ---------- 文言ガード（src 全体） ----------
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const banned: [RegExp, string][] = [
  [/agentFeeCap/, '旧関数名 agentFeeCap'],
  [/上限/, '「上限」（仲介手数料を上限と断定する表現）'],
  [/余裕あり/, '「余裕あり」'],
  [/45,?800/, '旧食費データ 45,800'],
  [/191,?500/, '旧データ 191,500'],
  [/30,?300/, '旧データ 30,300'],
  [/179,?200/, '旧データ 179,200'],
  [/34歳以下/, '「34歳以下」（一次統計で未確認）'],
  [/一人暮らしの平均/, '対象集団のない「一人暮らしの平均」'],
];
for (const f of walk('src').filter((x) => /\.(ts|astro|css)$/.test(x))) {
  const text = readFileSync(f, 'utf-8');
  for (const [re, label] of banned) {
    assert.ok(!re.test(text), `${f}: 使用禁止の表現が残っています: ${label}`);
  }
}

console.log('tests passed');
