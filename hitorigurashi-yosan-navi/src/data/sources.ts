/**
 * 出典の管理。標準値・法令値はここで定義した出典に紐づけます。
 * checkedAt は「確認した年月」(YYYY-MM)。
 */
export interface Source {
  id: string;
  name: string;
  url: string;
  checkedAt: string;
  note?: string;
}

export const SOURCES = {
  kakeiSummary2025: {
    id: 'kakei-summary-2025',
    name: '総務省統計局「家計調査報告（家計収支編）2025年（令和7年）平均結果の概要」',
    url: 'https://www.stat.go.jp/data/kakei/2025np/pdf/summary.pdf',
    checkedAt: '2026-09',
    note:
      '単身世帯（全体・世帯主の平均年齢58.6歳）の消費支出・食料・住居の月平均額は、この概要PDFの表Ⅱ－１－２で確認（数値は src/data/statistics.ts）。TODO: e-Stat の詳細結果表（単身世帯）でも照合する。',
  },
  takkenKokuji: {
    id: 'takken-kokuji-1552',
    name: '国土交通省「不動産取引に関するお知らせ（賃貸借取引の仲介手数料の上限額）」',
    url: 'https://www.mlit.go.jp/totikensangyo/const/1_6_bf_000013.html',
    checkedAt: '2026-09',
    note:
      '2026年9月確認。賃貸借取引では、依頼者双方から受領できる仲介手数料の合計は賃料1か月分×1.1以内。居住用建物では、媒介依頼時に当該依頼者の承諾を得ている場合を除き、依頼者一方からは賃料1か月分×0.55以内。サイト上の0.55倍はこの原則ケースの参考額としてのみ表示し、初期費用合計には自動加算しない。',
  },
} as const satisfies Record<string, Source>;
