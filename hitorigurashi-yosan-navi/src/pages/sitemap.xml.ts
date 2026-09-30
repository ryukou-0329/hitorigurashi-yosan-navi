import type { APIRoute } from 'astro';
import { ALL_PAGES, LAST_UPDATED } from '../data/pages';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://hitorigurashi-navi.pages.dev');
  const urls = ALL_PAGES.map(
    (p) =>
      `  <url>\n    <loc>${new URL(p.path, base).toString()}</loc>\n    <lastmod>${LAST_UPDATED}</lastmod>\n    <priority>${p.priority.toFixed(1)}</priority>\n  </url>`,
  ).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
