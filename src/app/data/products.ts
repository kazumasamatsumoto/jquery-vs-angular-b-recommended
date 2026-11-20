/** 3 つのページが共通で使う商品データ。OCC から返ってくる商品一覧の代わり。 */
export interface Product {
  code: string;
  name: string;
  price: string;
  image: string;
}

const make = (code: string, name: string, price: string): Product => ({
  code,
  name,
  price,
  image: `/img/${code}.svg`,
});

export const PRODUCTS_A: Product[] = [
  make('A01', 'カメラ', '¥128,000'),
  make('A02', 'レンズ', '¥64,000'),
  make('A03', '三脚', '¥12,800'),
  make('A04', 'ストロボ', '¥23,000'),
  make('A05', 'バッグ', '¥9,800'),
  make('A06', 'メモリーカード', '¥4,200'),
];

export const PRODUCTS_B: Product[] = [
  make('B01', 'ヘッドホン', '¥32,000'),
  make('B02', 'スピーカー', '¥45,000'),
  make('B03', 'マイク', '¥18,000'),
  make('B04', 'アンプ', '¥56,000'),
  make('B05', 'ケーブル', '¥2,400'),
  make('B06', 'スタンド', '¥6,800'),
];

/**
 * CMS(や JSP のメッセージ)から来る画面の文言のつもり。
 * 編集者が誤って、または攻撃者が HTML を混ぜた場合を想定している。
 * jQuery UI 1.12.1 の datepicker は closeText を HTML としてそのまま埋め込む(CVE-2021-41183)。
 * onerror が動くと <html data-xss="executed"> が付き、診断パネルが赤くなる。
 * 実際の攻撃のかわりに、目印の属性を付けるだけにしている。
 */
export const CMS_TEXT = {
  datepickerClose: '閉じる<img src="x" onerror="document.documentElement.dataset.xss=\'executed\'">',
};
