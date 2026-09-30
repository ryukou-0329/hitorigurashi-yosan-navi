/**
 * 毎月の生活費の標準値（プリセット）。
 *
 * ルール:
 *  - 数値は statistics.ts の一次統計（対象集団・統計年・項目つき）から引くものだけ。推測で仮置きしない。
 *  - 確認できていない項目は presets を空にして todo に「何を確認すべきか」を書く。
 *  - presets が空の項目は、画面では金額の直接入力欄だけが表示される。
 *  - presets に値を追加すると、画面に選択肢が自動で表示される（コード変更不要）。
 */
import { yen } from '../lib/format';
import { KAKEI, statBasis, type Statistic } from './statistics';

export type LivingId = 'food' | 'utilities' | 'phone' | 'commute' | 'hobby' | 'subs';

export interface Preset {
  id: string;
  label: string;
  /** 1か月あたりの金額（円） */
  amount: number;
  /** 根拠となる一次統計 */
  stat: Statistic;
}

export interface LivingCategory {
  id: LivingId;
  label: string;
  /** 入力欄の補足 */
  hint: string;
  presets: Preset[];
  /** 比較に使う基準値（改善候補の表示用）。一次統計で確認済みのものだけ。 */
  benchmark?: { amount: number; label: string; stat: Statistic };
  /** 未整備の理由と、確認すべき出典 */
  todo?: string;
}

export const LIVING_CATEGORIES: LivingCategory[] = [
  {
    id: 'food',
    label: '食費',
    hint: '外食・コンビニ・飲み物を含む1か月の目安',
    presets: [
      {
        id: 'single-average',
        label: `${KAKEI.food.year}年・${KAKEI.food.groupShort}の平均（${yen(KAKEI.food.amountYen)}）`,
        amount: KAKEI.food.amountYen,
        stat: KAKEI.food,
      },
    ],
    benchmark: {
      amount: KAKEI.food.amountYen,
      label: `${statBasis(KAKEI.food)}（${yen(KAKEI.food.amountYen)}）`,
      stat: KAKEI.food,
    },
    todo: '20代・勤労者に絞った値や、自炊中心／外食多めなど食生活別の値は一次統計表で未確認のため未設定。e-Stat 家計調査（単身世帯）の詳細結果表で確認して追加する。',
  },
  {
    id: 'utilities',
    label: '水道光熱費',
    hint: '電気・ガス・水道の合計（使う量が多いほど高くなります）',
    presets: [
      {
        id: 'single-average',
        label: `${KAKEI.utilities.year}年・${KAKEI.utilities.groupShort}の平均（${yen(KAKEI.utilities.amountYen)}）`,
        amount: KAKEI.utilities.amountYen,
        stat: KAKEI.utilities,
      },
    ],
    benchmark: {
      amount: KAKEI.utilities.amountYen,
      label: `${statBasis(KAKEI.utilities)}（${yen(KAKEI.utilities.amountYen)}）`,
      stat: KAKEI.utilities,
    },
    todo: '使用傾向別（少なめ／標準／多め）の値は一次統計表で未確認のため未設定。',
  },
  {
    id: 'phone',
    label: 'スマホ料金',
    hint: '端末代の分割払いを含む月額',
    presets: [],
    todo: 'スマホ料金の値は一次統計表で未確認のため未設定。総務省の通信料金調査、または家計調査の移動電話通信料を確認して追加する。',
  },
  {
    id: 'commute',
    label: '通勤交通費',
    hint: '自己負担分の月額（会社が全額支給なら0円）',
    presets: [],
  },
  {
    id: 'hobby',
    label: '趣味・娯楽費',
    hint: '外出・ゲーム・推し活・旅行などの月平均',
    presets: [],
    todo: '趣味・娯楽費の値は一次統計表で未確認のため未設定。家計調査（単身世帯）の教養娯楽を確認して追加する。',
  },
  {
    id: 'subs',
    label: 'サブスク費',
    hint: '動画・音楽・アプリ等の月額合計',
    presets: [],
  },
];
