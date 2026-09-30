import { SITE_NAME } from '../config/site';

export interface Crumb {
  name: string;
  path: string;
}

export function absUrl(path: string, site: URL | undefined): string {
  return new URL(path, site ?? 'https://hitorigurashi-navi.pages.dev').toString();
}

export function breadcrumbLd(items: Crumb[], site: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absUrl(c.path, site),
    })),
  };
}

export function webAppLd(opts: { name: string; description: string; path: string }, site: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: opts.name,
    description: opts.description,
    url: absUrl(opts.path, site),
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any (Web browser)',
    inLanguage: 'ja',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };
}
