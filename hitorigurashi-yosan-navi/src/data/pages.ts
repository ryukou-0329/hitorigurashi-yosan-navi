import { LAST_UPDATED } from '../config/site';

/** 静的に生成する派生ページの金額（円）。MVPでは13ページのみ。 */
export const INCOME_AMOUNTS = [150000, 200000, 250000, 300000, 350000, 400000] as const;
export const RENT_AMOUNTS = [40000, 50000, 60000, 70000, 80000, 90000, 100000] as const;

export interface PageEntry {
  path: string;
  priority: number;
}

export const STATIC_PAGES: PageEntry[] = [
  { path: '/', priority: 1.0 },
  { path: '/living-cost/', priority: 0.8 },
  { path: '/initial-cost/', priority: 0.8 },
  { path: '/income/', priority: 0.7 },
  { path: '/rent/', priority: 0.7 },
  { path: '/guide/', priority: 0.7 },
  { path: '/initial-cost-guide/', priority: 0.7 },
  { path: '/about/', priority: 0.3 },
  { path: '/contact/', priority: 0.3 },
  { path: '/privacy/', priority: 0.3 },
  { path: '/disclosure/', priority: 0.3 },
];

export const ALL_PAGES: PageEntry[] = [
  ...STATIC_PAGES,
  ...INCOME_AMOUNTS.map((a) => ({ path: `/income/${a}/`, priority: 0.6 })),
  ...RENT_AMOUNTS.map((a) => ({ path: `/rent/${a}/`, priority: 0.6 })),
];

export { LAST_UPDATED };
