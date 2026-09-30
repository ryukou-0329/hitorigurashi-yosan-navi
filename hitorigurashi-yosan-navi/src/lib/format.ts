/** 150000 -> "150,000円"（負数は "-12,000円"） */
export function yen(n: number): string {
  const v = Math.round(n);
  const s = Math.abs(v).toLocaleString('ja-JP');
  return `${v < 0 ? '-' : ''}${s}円`;
}

/** 150000 -> "15万円"（万円単位で割り切れる場合）、それ以外は yen() */
export function manYen(n: number): string {
  return n % 10000 === 0 ? `${n / 10000}万円` : yen(n);
}

/** 月数 -> "約1年2か月" / "約5か月" */
export function monthsLabel(m: number): string {
  const y = Math.floor(m / 12);
  const r = m % 12;
  if (y === 0) return `約${m}か月`;
  return r === 0 ? `約${y}年` : `約${y}年${r}か月`;
}

/** 全角数字・カンマ等を含む入力を数値に。空なら null */
export function parseNumber(raw: string): number | null {
  const half = raw
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[．。]/g, '.')
    .replace(/[^\d.]/g, '');
  if (half === '' || half === '.') return null;
  const n = Number(half);
  return Number.isFinite(n) ? n : null;
}
