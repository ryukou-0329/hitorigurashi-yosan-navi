# ひとり暮らし予算ナビ

手取り・家賃・貯金・生活スタイルを入力すると、月間生活費・毎月の余剰金・年間余剰金見込み・想定初期費用・初期費用支払い後の貯金・不足額などを目安として表示する、完全静的の無料Webサイトです。

- Astro（静的出力）+ Vanilla TypeScript + 素のCSS（依存は Astro のみ）
- 外部DB・ログイン・サーバー保存なし。入力値はブラウザ内だけで計算（localStorage / Cookie も不使用）
- Cloudflare Pages の無料枠で公開可能

## ローカル起動

```bash
npm install
npm run dev      # http://localhost:4321
```

## ビルド・確認

```bash
npm run build    # dist/ に静的ファイルを出力
npm run preview  # ビルド結果をローカルで確認
npm run check    # Astro / TypeScript の型チェック
npm test         # 計算ロジックのテスト
```

## Cloudflare Pages への公開

1. GitHub にリポジトリを作成して push
2. Cloudflare ダッシュボード → Workers & Pages → Create → Pages → Connect to Git
3. ビルド設定
   - Framework preset: `Astro`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - 環境変数: `SITE_URL` = 公開URL（例 `https://example.com`）、`NODE_VERSION` = `20` 以上
4. デプロイ後、独自ドメインを接続（HTTPS は自動）
5. Google Search Console にプロパティを追加し、`/sitemap.xml` を送信

`SITE_URL` は canonical・OGP・sitemap.xml・robots.txt の絶対URLに使われます。未設定だと仮のURLが入るので、必ず設定してください。

## ディレクトリ構成

```
src/
  config/site.ts          サイト名・説明・免責文
  data/
    sources.ts            出典（名称・URL・確認年月）
    statistics.ts         一次統計の数値（対象集団・統計年・項目・金額つき）
    standards.ts          生活費の標準値（プリセット）と比較用の参考値
    initialCost.ts        初期費用の項目と仲介手数料の参考額の前提
    pages.ts              派生ページの金額（手取り6・家賃7）と sitemap 用一覧
  lib/
    calc.ts               計算ロジック（純粋関数）
    format.ts             150,000円 形式などの整形
    seo.ts                canonical・JSON-LD 生成
  scripts/calculator.ts   フォームのブラウザ側処理
  components/             Calculator, SeoHead, Header, Footer, Breadcrumb,
                          Disclaimer, SourceList, AdSlot(空), AffiliateBox(空)
  layouts/BaseLayout.astro
  pages/                  /, /living-cost/, /initial-cost/, /income/, /income/[amount]/,
                          /rent/, /rent/[amount]/, /guide/, /about/, /privacy/,
                          /disclosure/, 404, sitemap.xml, robots.txt
  styles/global.css
public/                   favicon.svg, ogp.png, _headers
scripts/test-calc.ts      計算ロジックのテスト
```

## 標準値の管理ルール（重要）

- 統計値は `src/data/statistics.ts` に、1件ごとに「対象集団・統計年・項目・金額・掲載表・出典URL・確認年月」を持たせて管理します。
- 一次統計表で確認できない数値は入れず、TODO に残します（推測で仮置きしない）。
- 画面に「平均」と出すときは、対象集団と統計年を必ず併記します（例：2025年・単身世帯の平均）。単身世帯／単身の勤労者世帯／年齢階級別は別の数値として扱います。
- 現在の統計値は、総務省統計局「家計調査報告（家計収支編）2025年平均結果の概要」の **2025年・単身世帯（全体・世帯主の平均年齢58.6歳・勤労者以外を含む）** の消費支出・食料・住居のみです。
- `standards.ts` の `presets` に値を足すと、画面の選択肢に自動で反映されます。
- 仲介手数料は、見積書の金額を入力する方式です。「家賃0.5か月分＋消費税の場合の参考額」は `agentFeeReference()` で計算し、結果欄に別表示しますが、初期費用の合計には加算しません。
- 未入力の項目がある間は「入力済み項目の合計」と表示し、「想定初期費用」は必要項目がすべて入力されたときだけ使います。
- 補助表示（入力上は残額あり／要確認／不足あり）は、入力された数値だけを基準にした当サイト独自の簡易基準で、金融的な安全性を示すものではありません。

## テスト

```bash
npm test   # 計算ロジック・統計データの保持項目・文言ガード（禁止表現が src に残っていないか）
```

## 未実装 / TODO（公開前に必要なもの）

- [ ] `SITE_URL` の設定（独自ドメイン確定後）
- [ ] `/about/` の運営者名・連絡先の記入
- [ ] 統計値を e-Stat の詳細結果表（単身世帯）でも照合する
- [ ] 単身の勤労者世帯・年齢階級別（若年層）の各費目を、e-Stat の表2（男女・年齢階級別 単身世帯・勤労者世帯）で確認して `statistics.ts` に追加（現状は未掲載）
- [ ] スマホ料金・趣味娯楽費・食生活別の値を一次統計で確認して追加
- [ ] 敷金・礼金の月数、保証会社、火災保険、鍵交換、引越し、家具家電の標準額（一次情報を確認できたら追加）
- [ ] 実機（iPhone Safari / Android Chrome）での表示・操作確認、アクセシビリティ確認
- [ ] 広告導入時: `AdSlot` を配置、`/privacy/` `/disclosure/` を実態に合わせて更新

## 今後追加すると良い機能

- 地域別の目安（データ構造は `standards.ts` に地域キーを足せば拡張可能）
- 手取り・家賃の派生ページ拡充（内容が金額ごとに実質的に変わることを確認しながら少しずつ）
- 入力結果のURL共有（サーバー送信なしのクエリ文字列）
- 引越し時期・世帯構成など、条件別のガイド記事

## FAQ構造化データについて

FAQPage の構造化データは、Googleのリッチリザルト対象が主に公的機関・医療機関系のサイトに限られているため、本サイトでは実装していません（ガイドラインが変わった場合に再検討）。
