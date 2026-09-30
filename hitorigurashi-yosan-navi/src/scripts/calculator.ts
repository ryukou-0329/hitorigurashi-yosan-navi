/**
 * 診断フォームのブラウザ側処理。入力値はここ（ブラウザ内）だけで計算し、
 * 送信・保存（localStorage / Cookie 等）は一切行いません。
 */
import { calculate, type CalcInput, type Line, type LivingInput } from '../lib/calc';
import { LIVING_CATEGORIES } from '../data/standards';
import { monthsLabel, parseNumber, yen } from '../lib/format';

const form = document.getElementById('calc-form');
if (form instanceof HTMLFormElement) init(form);

function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}
function out(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-out="${name}"]`);
}
function setText(name: string, text: string): void {
  const el = out(name);
  if (el) el.textContent = text;
}
function setHidden(name: string, hidden: boolean): void {
  const el = out(name);
  if (el) el.hidden = hidden;
}
function readNum(id: string): number | null {
  const el = byId<HTMLInputElement>(id);
  return el ? parseNumber(el.value) : null;
}

function readInput(): CalcInput {
  const living: LivingInput[] = LIVING_CATEGORIES.map((c) => {
    const sel = byId<HTMLSelectElement>(`sel-${c.id}`);
    let amount: number | null;
    if (sel && sel.value !== 'manual') {
      amount = c.presets.find((p) => p.id === sel.value)?.amount ?? null;
    } else {
      const v = readNum(`amt-${c.id}`);
      amount = v === null ? null : Math.round(v);
    }
    const input: LivingInput = { id: c.id, label: c.label, amount };
    if (c.benchmark) input.benchmark = { amount: c.benchmark.amount, label: c.benchmark.label };
    return input;
  });
  const yenOrNull = (id: string) => {
    const v = readNum(id);
    return v === null ? null : Math.round(v);
  };
  return {
    takeHome: yenOrNull('takeHome'),
    rent: yenOrNull('rent'),
    savings: yenOrNull('savings'),
    living,
    initial: {
      depositMonths: readNum('ini-deposit'),
      keyMoneyMonths: readNum('ini-keyMoney'),
      agent: yenOrNull('ini-agent'),
      guarantee: yenOrNull('ini-guarantee'),
      fire: yenOrNull('ini-fire'),
      keyExchange: yenOrNull('ini-keyExchange'),
      moving: yenOrNull('ini-moving'),
      furniture: yenOrNull('ini-furniture'),
      other: yenOrNull('ini-other'),
    },
  };
}

function renderBars(listName: string, lines: Line[], total: number): void {
  const ul = out(listName);
  if (!ul) return;
  ul.replaceChildren();
  for (const l of lines) {
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'row';
    const label = document.createElement('span');
    label.textContent = l.label;
    const amount = document.createElement('span');
    if (l.amount === null) {
      amount.className = 'pending';
      amount.textContent = l.reference !== undefined ? `未入力（参考額 ${yen(l.reference)}・合計に含まず）` : '未入力';
      row.append(label, amount);
      li.append(row);
    } else {
      amount.className = 'amount';
      amount.textContent = yen(l.amount);
      row.append(label, amount);
      const track = document.createElement('div');
      track.className = 'track';
      const fill = document.createElement('span');
      fill.className = 'fill';
      const pct = total > 0 ? Math.max(0, Math.min(100, (l.amount / total) * 100)) : 0;
      fill.style.width = `${pct}%`;
      track.append(fill);
      li.append(row, track);
    }
    ul.append(li);
  }
}

function setNegative(name: string, negative: boolean): void {
  out(name)?.classList.toggle('is-negative', negative);
}

let srTimer: number | undefined;

function render(): void {
  const r = calculate(readInput());
  const quickbar = out('quickbar');

  if (!r.ready) {
    setHidden('placeholder', false);
    setHidden('wrap', true);
    if (quickbar) quickbar.hidden = true;
    document.body.classList.remove('has-quickbar');
    return;
  }
  setHidden('placeholder', true);
  setHidden('wrap', false);

  // 生活費
  const partial = !r.livingComplete;
  const partialNote = '未入力の項目を含まないため、実際より多く表示されている可能性があります';
  setText('monthlyLabel', partial ? '入力済み項目の生活費合計' : '月間生活費');
  setText('monthlyCost', yen(r.monthlyCost));
  setText('monthlyCostNote', partial ? '未入力の項目は含まれていません' : '家賃＋生活費の合計');
  setText('surplusLabel', partial ? '毎月残る金額（入力済み項目のみ）' : '毎月残る金額');
  setText('monthlySurplus', yen(r.monthlySurplus));
  setNegative('surplusCard', r.monthlySurplus < 0);
  const shareNote = r.rentShare !== null ? `家賃は手取りの約${Math.round(r.rentShare * 100)}%` : '';
  setText('surplusNote', partial ? `${partialNote}。${shareNote}` : shareNote);
  setText('yearlyLabel', partial ? '年間の余剰金見込み（入力済み項目のみ）' : '年間の余剰金見込み');
  setText('yearlyNote', partial ? partialNote : '毎月残る金額×12か月');
  setText('yearlySurplus', yen(r.yearlySurplus));
  setNegative('yearlyCard', r.yearlySurplus < 0);
  const lm = out('livingMissing');
  if (lm) {
    lm.hidden = r.missingLiving.length === 0;
    lm.textContent = `未入力：${r.missingLiving.join('、')}。入力するまで合計には含まれません。`;
  }
  renderBars('livingBreakdown', r.livingLines, r.monthlyCost);

  // 初期費用（フォームに初期費用欄がある場合のみ）
  if (out('initialTotal')) {
    // 必要項目がすべて入力されたときだけ「想定初期費用」と呼ぶ
    const done = r.initialComplete;
    setText('initialLabel', done ? '想定初期費用' : '入力済み項目の合計');
    setText('afterLabel', done ? '初期費用の支払い後の貯金' : '入力済み項目の支払い後の貯金');
    setText('shortLabel', done ? '初期費用に対する不足額' : '入力済み項目に対する不足額');
    setText('initialTotal', yen(r.initialTotal));
    setText('initialNote', done ? '入力した各項目の合計' : '未入力の項目は含まれていません（実際の初期費用はこれより多い可能性があります）');
    const im = out('initialMissing');
    if (im) {
      im.hidden = r.missingInitial.length === 0;
      im.textContent = `未入力：${r.missingInitial.join('、')}。標準額は準備中のため、見積書などの金額を入力すると想定初期費用に反映されます。`;
    }
    renderBars('initialBreakdown', r.initialLines, r.initialTotal);

    const hasSavings = r.savingsAfter !== null;
    setText('savingsAfter', hasSavings ? yen(r.savingsAfter ?? 0) : '–');
    setNegative('afterCard', hasSavings && (r.savingsAfter ?? 0) < 0);
    setText('afterNote', hasSavings ? '現在の貯金 − 想定初期費用' : '「現在の貯金」を入力すると表示されます');
    setText('shortfall', hasSavings ? yen(r.shortfall ?? 0) : '–');
    setNegative('shortCard', hasSavings && (r.shortfall ?? 0) > 0);
    let shortNote = '';
    if (hasSavings) {
      if (r.monthsToCover === 0) shortNote = '不足はありません';
      else if (r.monthsToCover !== null) shortNote = `毎月残る金額のペースなら${monthsLabel(r.monthsToCover)}で貯まる計算`;
      else if (r.cannotCover) shortNote = '毎月残る金額がないため、このペースでは貯まりません';
    }
    setText('shortNote', shortNote);

    const line = out('statusLine');
    if (line) line.hidden = r.status === null;
    const badge = out('statusBadge');
    if (badge && r.status) {
      badge.dataset.level = r.status;
      badge.textContent = r.status === 'ok' ? '入力上は残額あり' : r.status === 'check' ? '要確認' : '不足あり';
    }
    setText('statusReason', r.statusReason);
  }

  // ヒント
  const tipsUl = out('tips');
  if (tipsUl) {
    tipsUl.replaceChildren();
    for (const t of r.tips) {
      const li = document.createElement('li');
      const s = document.createElement('strong');
      s.textContent = t.title;
      const d = document.createElement('span');
      d.textContent = t.detail;
      li.append(s, d);
      tipsUl.append(li);
    }
  }

  // クイックバー
  setText('quickLabel', partial ? '毎月残る金額（入力済み分）' : '毎月残る金額');
  setText('quickSurplus', yen(r.monthlySurplus));
  if (quickbar) {
    quickbar.hidden = false;
    document.body.classList.add('has-quickbar');
  }

  // スクリーンリーダー向け要約（入力が落ち着いてから更新）
  window.clearTimeout(srTimer);
  srTimer = window.setTimeout(() => {
    setText('srSummary', `月間生活費は${yen(r.monthlyCost)}、毎月残る金額は${yen(r.monthlySurplus)}です。`);
  }, 700);
}

function init(f: HTMLFormElement): void {
  // プリセット選択 → 「金額を入力する」のときだけ入力欄を表示
  for (const c of LIVING_CATEGORIES) {
    const sel = byId<HTMLSelectElement>(`sel-${c.id}`);
    const wrap = byId(`wrap-${c.id}`);
    if (sel && wrap) {
      const sync = () => {
        wrap.hidden = sel.value !== 'manual';
      };
      sel.addEventListener('change', () => {
        sync();
        render();
      });
      sync();
    }
  }

  f.addEventListener('input', render);

  // 金額欄: フォーカスを外したらカンマ区切りに整形
  f.addEventListener(
    'blur',
    (e) => {
      const el = e.target;
      if (el instanceof HTMLInputElement && el.dataset.kind === 'yen') {
        const v = parseNumber(el.value);
        el.value = v === null ? '' : Math.round(v).toLocaleString('ja-JP');
      }
    },
    true,
  );

  // 結果が画面内にあるときはクイックバーを隠す
  const results = byId('results');
  const quickbar = out('quickbar');
  if (results && quickbar && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        if (entry) quickbar.classList.toggle('is-covered', entry.intersectionRatio > 0.35);
      },
      { threshold: [0, 0.35, 1] },
    ).observe(results);
  }

  render();
}
