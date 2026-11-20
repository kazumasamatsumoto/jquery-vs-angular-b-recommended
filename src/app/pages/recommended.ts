import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CMS_TEXT, PRODUCTS_A, PRODUCTS_B } from '../data/products';
import {
  CarouselComponent,
  DialogService,
  ImageZoomComponent,
  SpinnerOverlay,
  TabsComponent,
} from '../shared/recommended-parts';

/**
 * パターン B(推奨)版。jQuery を 1 行も使わない。
 * 部品は Composable Storefront の標準部品の作りを真似ている(shared/recommended-parts.ts の表)。
 */
@Component({
  selector: 'app-recommended',
  imports: [CarouselComponent, ImageZoomComponent, TabsComponent, SpinnerOverlay],
  template: `
    <h1>パターン B: Angular 用に選び直した版(推奨)</h1>
    <p class="lead">Composable Storefront の標準部品と同じ作りの部品だけで、同じ 6 つの機能を作っています。</p>

    <section>
      <h2>1. カルーセル <small>cx-carousel 相当</small></h2>
      <p class="row">
        <button type="button" (click)="swap()" data-testid="swap">商品を入れ替える</button>
        <span>データ上の商品: <strong data-testid="data-set">{{ setLabel() }}</strong></span>
      </p>
      <app-carousel [items]="products()" />
    </section>

    <section>
      <h2>2. ポップアップ <small>LaunchDialogService 相当</small></h2>
      <ul class="links">
        @for (p of products().slice(0, 3); track p.code) {
          <li><a [href]="p.image" (click)="$event.preventDefault(); dialog.openImage(p)">{{ p.name }} を大きく見る</a></li>
        }
      </ul>
    </section>

    <section>
      <h2>3. 画像の拡大 <small>image-zoom 相当</small></h2>
      <p>画像の上にマウスを載せると拡大します。</p>
      <app-image-zoom [src]="products()[0].image" />
    </section>

    <section>
      <h2>4. タブ <small>cx-tab 相当</small></h2>
      <app-tabs [tabs]="tabs" />
    </section>

    <section>
      <h2>5. 処理中の表示 <small>cx-spinner 相当</small></h2>
      <!-- <p> の中に <div> を持つ部品を置くと、ブラウザが <p> を自動で閉じてハイドレーションが壊れるので <div> にする -->
      <div class="row">
        <app-spinner-overlay [busy]="busy()">
          <button type="button" (click)="addToCart()" [disabled]="busy()" data-testid="add-to-cart">カートに入れる(2 秒かかる)</button>
        </app-spinner-overlay>
        <span>カートの数: <strong>{{ cartCount() }}</strong></span>
      </div>
    </section>

    <section>
      <h2>6. 日付の入力 <small>cx-date-picker 相当(ブラウザ標準の input type="date")</small></h2>
      <p>CMS から来た同じ文言を、ボタンの文字として出しています。Angular は文字として表示するので、HTML は動きません。</p>
      <p class="row">
        <input type="date" data-testid="date" />
        <button type="button" data-testid="cms-label">{{ cms.datepickerClose }}</button>
      </p>
    </section>
  `,
  styleUrl: './recommended.scss',
})
export class RecommendedPage {
  readonly dialog = inject(DialogService);
  readonly cms = CMS_TEXT;
  readonly products = signal(PRODUCTS_A);
  readonly setLabel = signal('A(カメラ用品)');
  readonly busy = signal(false);
  readonly cartCount = signal(0);
  readonly tabs = [
    { label: '説明', body: 'ミラーレスの入門機です。' },
    { label: '仕様', body: '重さ 390 g / 有効画素数 2,420 万' },
    { label: 'レビュー', body: '★★★★☆ 持ちやすい' },
  ];
  private timeoutId?: ReturnType<typeof setTimeout>;

  constructor() {
    // 画面を離れたら、開いているダイアログと待ち時間を片付ける
    inject(DestroyRef).onDestroy(() => {
      this.dialog.close();
      if (this.timeoutId) clearTimeout(this.timeoutId);
    });
  }

  swap(): void {
    const toB = this.products() === PRODUCTS_A;
    this.products.set(toB ? PRODUCTS_B : PRODUCTS_A);
    this.setLabel.set(toB ? 'B(音響用品)' : 'A(カメラ用品)');
  }

  addToCart(): void {
    this.busy.set(true);
    this.timeoutId = setTimeout(() => {
      this.busy.set(false);
      this.cartCount.update((n) => n + 1);
    }, 2000);
  }
}
