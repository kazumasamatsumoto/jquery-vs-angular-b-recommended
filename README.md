# パターン B: jQuery を使わずに Angular で作り直す(比較ラボ)

SAP Commerce の Accelerator(JSP のストアフロント)で jQuery プラグインが担っていた 6 つの機能を、Composable Storefront(Spartacus)の標準部品と同じ作りの Angular 部品だけで作った版です。jQuery は 1 行も使いません。

Composable Storefront へ移行するとき、今の jQuery プラグインの扱い方は 2 つ考えられます。

- **パターン A**: 今のライブラリを残し、Angular の中でも使う → [jquery-vs-angular-a-legacy](https://github.com/kazumasamatsumoto/jquery-vs-angular-a-legacy)
- **パターン B(このリポジトリ)**: Angular 用に選び直す(標準部品への置き換えを含む)

2 つを並べて同じ操作をした比較結果は、パターン A のリポジトリの README と `results/RESULTS.md` にあります。

## 部品の対応

| 機能 | パターン A で使っていたもの | この版の部品 | 真似している標準部品 |
|---|---|---|---|
| カルーセル | owl.carousel 1.3.3 | `CarouselComponent` | `cx-carousel`(数枚ずつのスライドに分け、前後ボタンで送る) |
| ポップアップ | jquery.colorbox 1.5.14 | `DialogService` | `LaunchDialogService`(ダイアログの起動と後始末) |
| 画像の拡大 | jquery.zoom 1.7.13 | `ImageZoomComponent` | `@spartacus/product/image-zoom` |
| タブ | jQuery UI 1.12.1 tabs | `TabsComponent` | `cx-tab` |
| 処理中の表示 | jquery.blockUI 2.66 | `SpinnerOverlay` | `cx-spinner` と、処理中のボタンの無効化 |
| 日付の入力 | jQuery UI 1.12.1 datepicker | `<input type="date">` | `cx-date-picker`(中身はブラウザ標準の日付入力) |

部品は `src/app/shared/recommended-parts.ts`、ページは `src/app/pages/recommended.ts` です。

どの部品も次の約束を守っています。

- 画面の要素は Angular のテンプレートだけが作る。サーバー(SSR)でも同じ HTML ができる
- `window` や `document` に直接触らない
- 後始末が要るもの(開いたダイアログ、待ち時間)は、画面を離れるときに自動で外れる
- CMS から来た文言は `{{ }}` で文字として出す(HTML として動かさない)

## 動かし方

前提: Node.js 22 以上。

```bash
git clone https://github.com/kazumasamatsumoto/jquery-vs-angular-b-recommended.git
cd jquery-vs-angular-b-recommended
npm install
npm run build
npm run serve:ssr      # http://localhost:4000 (PORT で変更可)
```

`/recommended` が比較対象のページです。画面の右下の**診断パネル**に、window のリスナー数、アプリの外に残った部品、変更検知の回数、XSS が動いたか、が 1 秒ごとに出ます(パターン A と同じ計測です)。

パターン A と並べて自動で比べるときは、2 つのリポジトリを同じフォルダにクローンし、パターン A 側で `npm run compare` を実行します(手順はパターン A の README)。

## 結果の要点(2026-11-20、パターン A 側の `npm run compare` で測定)

| 観点 | この版(B) | パターン A: 無理やり | パターン A: 包む |
|---|---|---|---|
| JS が動く前に見える商品 | 6 / 6 | 0 / 6 | 0 / 6 |
| 画面のずれ CLS | 0.017 | 0.149 | 0.149 |
| 「商品を入れ替える」 | 正しく変わる | 古い商品のまま | 正しく変わる |
| CMS の文言に混ぜた HTML(XSS) | 動かない | 動いた | 動いた |
| 5 往復したあとのアプリの外に残った部品 | 0 | 13 | 1 |
| ビルドの Initial total | 314 KB | 752 KB | 752 KB |

## このラボの限界

- **本物の Composable Storefront(Spartacus)ではありません**。2211 系のライブラリは SAP の非公開レジストリにあるため入れていません。部品は、標準部品の作り(公開されている SAP/spartacus のソース)を真似た小さな版です。
- データは固定の JSON(`src/app/data/products.ts`)で、バックエンド(OCC)は呼びません。
