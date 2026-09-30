/**
 * 一次統計の数値。1件ごとに「対象集団・統計年・項目・金額・出典URL・確認年月」を保持します。
 *
 * ルール:
 *  - 一次統計表で確認できた数値だけを入れる。確認できない数値は入れず TODO に残す。
 *  - 対象集団を混同しない（単身世帯 / 単身の勤労者世帯 / 若年層向けの集計 などは別の数値）。
 *  - 画面に「平均」と出すときは、必ず statBasis() などで対象集団と統計年を併記する。
 *
 * TODO（一次統計表で未確認のため未掲載）:
 *  - 単身の勤労者世帯の各費目、年齢階級別（若年層など）の各費目
 *    → e-Stat「家計調査 家計収支編 単身世帯 詳細結果表 年次 2025年」の表2（男女・年齢階級別 単身世帯・勤労者世帯）等で確認して追加する。
 *  - 光熱・水道、教養娯楽など、画面のプリセットに使いたい費目（単身世帯の値は概要PDFに掲載あり。使う場合はここに追加する）。
 */

export interface Statistic {
  id: string;
  /** 対象集団（正式な記述） */
  group: string;
  /** 画面表示用の短い対象集団名 */
  groupShort: string;
  /** 統計年 */
  year: number;
  /** 項目 */
  item: string;
  /** 金額（円）。1世帯当たり1か月平均 */
  amountYen: number;
  /** 掲載されている表 */
  table: string;
  sourceName: string;
  sourceUrl: string;
  /** 確認年月 (YYYY-MM) */
  checkedAt: string;
  note?: string;
}

const SINGLE_2025_BASE = {
  group: '単身世帯（全体。世帯主の平均年齢58.6歳。勤労者以外の世帯を含む）',
  groupShort: '単身世帯',
  year: 2025,
  table: '概要 表Ⅱ－１－２（単身世帯・1世帯当たり1か月平均）',
  sourceName: '総務省統計局「家計調査報告（家計収支編）2025年（令和7年）平均結果の概要」',
  sourceUrl: 'https://www.stat.go.jp/data/kakei/2025np/pdf/summary.pdf',
  checkedAt: '2026-09',
} as const;

const BREAKDOWN_NOTE = '消費支出の内訳の各費目は、他の世帯への贈答品やサービスの支出を含む（概要の注記）。';

export const STATISTICS: Statistic[] = [
  { ...SINGLE_2025_BASE, id: 'single-2025-consumption', item: '消費支出', amountYen: 173042 },
  { ...SINGLE_2025_BASE, id: 'single-2025-food', item: '食料', amountYen: 49321, note: BREAKDOWN_NOTE },
  { ...SINGLE_2025_BASE, id: 'single-2025-housing', item: '住居', amountYen: 21667, note: BREAKDOWN_NOTE },
  { ...SINGLE_2025_BASE, id: 'single-2025-utilities', item: '光熱・水道', amountYen: 13333, note: BREAKDOWN_NOTE },
];

function find(id: string): Statistic {
  const s = STATISTICS.find((x) => x.id === id);
  if (!s) throw new Error(`statistic not found: ${id}`);
  return s;
}

/** 画面・ページで使う統計値（すべて 2025年・単身世帯） */
export const KAKEI = {
  consumption: find('single-2025-consumption'),
  food: find('single-2025-food'),
  housing: find('single-2025-housing'),
  utilities: find('single-2025-utilities'),
} as const;

/** 「2025年・単身世帯の食料の月平均」のように、対象集団・統計年・項目を明示した表現 */
export function statBasis(s: Statistic): string {
  return `${s.year}年・${s.groupShort}の${s.item}の月平均`;
}
