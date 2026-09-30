/**
 * 計算ロジック（純粋関数）。DOMにもデータ定義にも依存しません。
 * すべてブラウザ内で実行され、入力値は送信・保存されません。
 */
import { AGENT_FEE_REFERENCE_RULE, INITIAL_ITEMS } from '../data/initialCost';
import type { LivingId } from '../data/standards';

export interface LivingInput {
  id: LivingId;
  label: string;
  amount: number | null;
  /** 比較用の基準値（あれば） */
  benchmark?: { amount: number; label: string };
}

export interface InitialInput {
  depositMonths: number | null;
  keyMoneyMonths: number | null;
  /** 仲介手数料（見積書の実際の金額） */
  agent: number | null;
  guarantee: number | null;
  fire: number | null;
  keyExchange: number | null;
  moving: number | null;
  furniture: number | null;
  other: number | null;
}

export interface CalcInput {
  takeHome: number | null;
  rent: number | null;
  savings: number | null;
  living: LivingInput[];
  initial: InitialInput;
}

export interface Line {
  id: string;
  label: string;
  /** ユーザーが入力した金額。未入力なら null（合計には含めない） */
  amount: number | null;
  /** 参考額（合計には含めない）。仲介手数料のみ */
  reference?: number;
}

export type Status = 'ok' | 'check' | 'short';

export interface Tip {
  id: string;
  title: string;
  detail: string;
}

export interface CalcResult {
  ready: boolean;
  livingLines: Line[];
  /** 入力済み項目の生活費合計（家賃を含む） */
  monthlyCost: number;
  missingLiving: string[];
  livingComplete: boolean;
  monthlySurplus: number;
  yearlySurplus: number;
  rentShare: number | null;
  initialLines: Line[];
  /** 入力済み項目の初期費用合計（参考額は含まない） */
  initialTotal: number;
  missingInitial: string[];
  /** 必須項目がすべて入力されているか。true のときだけ「想定初期費用」と呼べる */
  initialComplete: boolean;
  /** 仲介手数料の参考額（家賃0.5か月分＋消費税の場合）。合計には含めない */
  agentReference: number | null;
  savingsAfter: number | null;
  shortfall: number | null;
  /** 不足額を現在の余剰金ペースで貯めるまでの月数。不足なし=0、貯まらない=null */
  monthsToCover: number | null;
  cannotCover: boolean;
  status: Status | null;
  statusReason: string;
  tips: Tip[];
}

/**
 * 仲介手数料の「参考額」（円）＝家賃×0.5か月分＋消費税。
 * 契約・承諾状況などによって実際の金額は異なるため、確定額・確定した限度額としては扱わない。
 */
export function agentFeeReference(rent: number): number {
  const pct = Math.round(AGENT_FEE_REFERENCE_RULE.monthsExTax * (100 + AGENT_FEE_REFERENCE_RULE.taxRatePercent));
  return Math.round((rent * pct) / 100);
}

const fmt = (n: number) => `${Math.round(n).toLocaleString('ja-JP')}円`;

export function calculate(input: CalcInput): CalcResult {
  const { takeHome, rent, savings, living, initial } = input;
  const ready = takeHome !== null && rent !== null;
  const rentV = rent ?? 0;
  const takeHomeV = takeHome ?? 0;

  // --- 毎月の生活費 ---
  const livingLines: Line[] = [
    { id: 'rent', label: '家賃', amount: rent },
    ...living.map((l) => ({ id: l.id, label: l.label, amount: l.amount })),
  ];
  const monthlyCost = livingLines.reduce((s, l) => s + (l.amount ?? 0), 0);
  const missingLiving = living.filter((l) => l.amount === null).map((l) => l.label);
  const livingComplete = missingLiving.length === 0;
  const monthlySurplus = takeHomeV - monthlyCost;
  const yearlySurplus = monthlySurplus * 12;
  const rentShare = takeHome && takeHome > 0 && rent !== null ? rent / takeHome : null;

  // --- 初期費用（すべてユーザー入力。参考額は合計に含めない） ---
  const agentReference = rent === null ? null : agentFeeReference(rentV);
  const monthsAmount = (m: number | null) => (m === null || rent === null ? null : Math.round(rentV * m));
  const initialLines: Line[] = INITIAL_ITEMS.map((it): Line => {
    switch (it.id) {
      case 'deposit':
        return { id: it.id, label: it.label, amount: monthsAmount(initial.depositMonths) };
      case 'keyMoney':
        return { id: it.id, label: it.label, amount: monthsAmount(initial.keyMoneyMonths) };
      case 'agent':
        return agentReference === null
          ? { id: it.id, label: it.label, amount: initial.agent }
          : { id: it.id, label: it.label, amount: initial.agent, reference: agentReference };
      case 'guarantee':
        return { id: it.id, label: it.label, amount: initial.guarantee };
      case 'fire':
        return { id: it.id, label: it.label, amount: initial.fire };
      case 'keyExchange':
        return { id: it.id, label: it.label, amount: initial.keyExchange };
      case 'moving':
        return { id: it.id, label: it.label, amount: initial.moving };
      case 'furniture':
        return { id: it.id, label: it.label, amount: initial.furniture };
      case 'other':
        return { id: it.id, label: it.label, amount: initial.other };
    }
  });
  const initialTotal = initialLines.reduce((s, l) => s + (l.amount ?? 0), 0);
  // 「その他」は任意項目なので未入力でも未入力扱いにしない
  const missingInitial = initialLines.filter((l) => l.amount === null && l.id !== 'other').map((l) => l.label);
  const initialComplete = missingInitial.length === 0;

  // --- 貯金との関係 ---
  const savingsAfter = ready && savings !== null ? savings - initialTotal : null;
  const shortfall = ready && savings !== null ? Math.max(0, initialTotal - savings) : null;
  let monthsToCover: number | null = null;
  let cannotCover = false;
  if (shortfall !== null) {
    if (shortfall === 0) monthsToCover = 0;
    else if (monthlySurplus > 0) monthsToCover = Math.ceil(shortfall / monthlySurplus);
    else cannotCover = true;
  }

  // --- 補助表示（入力された数値だけを基準にした事実ベースの目安。判定ではない） ---
  let status: Status | null = null;
  let statusReason = '';
  if (ready && savings !== null) {
    if (shortfall !== null && shortfall > 0) {
      status = 'short';
      statusReason = initialComplete
        ? '入力した初期費用の合計が、入力した現在の貯金を上回っています。'
        : '入力済みの項目の合計だけで、入力した現在の貯金を上回っています（未入力の項目は含まれていません）。';
    } else if (!initialComplete || !livingComplete) {
      status = 'check';
      statusReason = '未入力の項目があるため、合計は不完全です。項目を入力すると、より実態に近い表示になります。';
    } else if (monthlySurplus < 0) {
      status = 'check';
      statusReason = '入力した内容では、毎月の支出が手取りを上回っています。';
    } else if (savingsAfter !== null && savingsAfter >= monthlyCost) {
      status = 'ok';
      statusReason = '入力した内容では、初期費用の支払い後も、貯金が月間生活費1か月分以上残っています。';
    } else {
      status = 'check';
      statusReason = '入力した内容では、初期費用の支払い後の貯金が、月間生活費1か月分に届きません。';
    }
  }

  const tips = ready ? buildTips(input, livingLines, monthlyCost, monthlySurplus, rentShare) : [];

  return {
    ready,
    livingLines,
    monthlyCost,
    missingLiving,
    livingComplete,
    monthlySurplus,
    yearlySurplus,
    rentShare,
    initialLines,
    initialTotal,
    missingInitial,
    initialComplete,
    agentReference,
    savingsAfter,
    shortfall,
    monthsToCover,
    cannotCover,
    status,
    statusReason,
    tips,
  };
}

function buildTips(
  input: CalcInput,
  livingLines: Line[],
  monthlyCost: number,
  monthlySurplus: number,
  rentShare: number | null,
): Tip[] {
  const tips: Tip[] = [];

  if (monthlySurplus < 0) {
    tips.push({
      id: 'deficit',
      title: '毎月の支出が手取りを上回っています',
      detail: `毎月${fmt(-monthlySurplus)}の不足です（年間${fmt(-monthlySurplus * 12)}）。家賃・固定費の見直しを優先して検討してみてください。`,
    });
  }

  // 支出の大きい項目（家賃を含む）
  const ranked = livingLines
    .filter((l) => l.amount !== null && l.amount > 0)
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
    .slice(0, 3);
  if (ranked.length > 0 && monthlyCost > 0) {
    const text = ranked
      .map((l) => `${l.label} ${fmt(l.amount ?? 0)}（入力済み合計の${Math.round(((l.amount ?? 0) / monthlyCost) * 100)}%）`)
      .join('、');
    tips.push({
      id: 'largest',
      title: '支出が大きい項目',
      detail: `${text}。金額の大きい項目ほど、見直したときの効果が出やすくなります。`,
    });
  }

  if (rentShare !== null) {
    tips.push({
      id: 'rent-share',
      title: '家賃が手取りに占める割合',
      detail: `家賃は手取りの約${Math.round(rentShare * 100)}%です。割合の良し悪しは収入や生活スタイルで変わるため、他の支出とのバランスで判断してください。`,
    });
  }

  // 統計値との比較（一次統計で確認済みの基準値があるものだけ。対象集団はラベルに明示）
  for (const l of input.living) {
    if (l.benchmark && l.amount !== null && l.amount > l.benchmark.amount) {
      tips.push({
        id: `bench-${l.id}`,
        title: `${l.label}が統計値を上回っています`,
        detail: `${l.benchmark.label}より${fmt(l.amount - l.benchmark.amount)}多い計算です（年間${fmt((l.amount - l.benchmark.amount) * 12)}）。統計値は対象集団の平均で、ご自身の適正額を示すものではありません。`,
      });
    }
  }

  // サブスク・スマホなど、見直しやすい固定費
  for (const id of ['subs', 'phone'] as const) {
    const l = input.living.find((x) => x.id === id);
    if (l && l.amount !== null && l.amount > 0) {
      tips.push({
        id: `review-${id}`,
        title: `${l.label}の見直し`,
        detail: `${l.label}は${fmt(l.amount)}（年間${fmt(l.amount * 12)}）です。利用状況や契約内容を確認してみましょう。`,
      });
    }
  }

  // 家賃を1万円下げた場合（算数のみ。敷金・礼金は入力された月数だけ反映）
  if (input.rent !== null && input.rent >= 10000) {
    const months = (input.initial.depositMonths ?? 0) + (input.initial.keyMoneyMonths ?? 0);
    const initialPart =
      months > 0
        ? `敷金・礼金が家賃の月数で決まる場合、入力した月数（合計${months}か月分）で約${fmt(months * 10000)}下がります。`
        : '敷金・礼金の月数を入力すると、初期費用への影響も計算できます。';
    tips.push({
      id: 'rent-down',
      title: '家賃を1万円下げた場合',
      detail: `毎月+10,000円、年間+120,000円。${initialPart}`,
    });
  }

  return tips;
}
