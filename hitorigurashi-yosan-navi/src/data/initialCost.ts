/**
 * 初期費用の項目定義。
 *
 * すべての項目は「ユーザーが入力した実際の想定費用」として合計します。
 * 仲介手数料の「参考額」（家賃0.5か月分＋消費税の場合）は、入力の目安として別に表示するだけで、
 * 合計には自動加算しません（契約・承諾状況などによって実際の金額は異なるため）。
 */
import { SOURCES, type Source } from './sources';

export type InitialId =
  | 'deposit'
  | 'keyMoney'
  | 'agent'
  | 'guarantee'
  | 'fire'
  | 'keyExchange'
  | 'moving'
  | 'furniture'
  | 'other';

export interface InitialItem {
  id: InitialId;
  label: string;
  kind: 'months' | 'yen';
  hint: string;
  todo?: string;
}

export const INITIAL_ITEMS: InitialItem[] = [
  { id: 'deposit', label: '敷金', kind: 'months', hint: '家賃の何か月分か（契約書・募集図面で確認）', todo: '標準的な月数は出典未確認。' },
  { id: 'keyMoney', label: '礼金', kind: 'months', hint: '家賃の何か月分か（0の物件もあります）', todo: '標準的な月数は出典未確認。' },
  {
    id: 'agent',
    label: '仲介手数料',
    kind: 'yen',
    hint: '見積書の金額。未入力の間は、参考額（家賃0.5か月分＋消費税の場合）を結果欄に別表示します',
  },
  { id: 'guarantee', label: '保証会社の初回費用', kind: 'yen', hint: '見積書の金額', todo: '標準額は出典未確認。' },
  { id: 'fire', label: '火災保険料', kind: 'yen', hint: '見積書の金額（年数分）', todo: '標準額は出典未確認。' },
  { id: 'keyExchange', label: '鍵交換費用', kind: 'yen', hint: '見積書の金額', todo: '標準額は出典未確認。' },
  { id: 'moving', label: '引越し費用', kind: 'yen', hint: '業者の見積額', todo: '標準額は出典未確認。' },
  { id: 'furniture', label: '家具・家電の購入費', kind: 'yen', hint: '買いそろえる予定の合計', todo: '標準額は出典未確認。' },
  { id: 'other', label: 'その他（前家賃など）', kind: 'yen', hint: '日割り家賃・翌月分の前家賃など、見積書にあるその他の費用' },
];

/** 仲介手数料の参考額の前提（家賃の0.5か月分＋消費税）。確定額ではありません。 */
export const AGENT_FEE_REFERENCE_RULE = {
  /** 家賃に対する月数（税抜） */
  monthsExTax: 0.5,
  /** 消費税率（%） */
  taxRatePercent: 10,
  source: SOURCES.takkenKokuji as Source,
} as const;

/** 仲介手数料の参考額に付ける注意書き */
export const AGENT_FEE_NOTE =
  '契約・承諾状況などによって実際の仲介手数料は異なるため、見積書・契約内容を確認してください。';
