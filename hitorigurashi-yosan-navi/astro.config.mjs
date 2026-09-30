import { defineConfig } from 'astro/config';

// 本番URLは Cloudflare Pages の環境変数 SITE_URL で指定します（例: https://example.com）。
// canonical / OGP / sitemap.xml / robots.txt の絶対URLに使われます。
// TODO: 独自ドメイン確定後に SITE_URL を設定してください。
const site = process.env.SITE_URL || 'https://hitorigurashi-navi.pages.dev';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  devToolbar: { enabled: false },
});
