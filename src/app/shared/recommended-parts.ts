/**
 * パターン B(推奨)の部品。Composable Storefront の標準部品と同じ考え方で、Angular だけで書いている。
 * 本物の Spartacus は SAP の非公開レジストリ(RBSC)にあり、ここでは入れられないため、作りを真似た小さな版。
 *
 * | この部品            | 真似している標準部品                           |
 * |---------------------|------------------------------------------------|
 * | CarouselComponent   | cx-carousel(数枚ずつのスライドに分け、前後ボタンで送る) |
 * | DialogService       | LaunchDialogService(ダイアログの起動と後始末)  |
 * | ImageZoomComponent  | @spartacus/product/image-zoom                   |
 * | TabsComponent       | cx-tab                                          |
 * | SpinnerOverlay      | cx-spinner + 処理中のボタン無効化               |
 * | (input type=date) | cx-date-picker(中身はブラウザ標準の日付入力)   |
 *
 * どれも、画面の要素は Angular のテンプレートだけが作る。サーバー(SSR)でも同じ HTML ができる。
 * window や document には触らない。後始末が要るものは DestroyRef で自動的に外れる。
 */
import {
  ApplicationRef,
  Component,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  computed,
  createComponent,
  inject,
  input,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { Product } from '../data/products';

/* ---------- カルーセル(cx-carousel 相当) ---------- */
@Component({
  selector: 'app-carousel',
  template: `
    <div class="panel" data-testid="carousel">
      <button type="button" class="nav" (click)="prev()" [disabled]="active() === 0" aria-label="前へ">‹</button>
      <div class="viewport">
        <div class="track" [style.transform]="'translateX(-' + active() * 100 + '%)'">
          @for (slide of slides(); track $index) {
            <div class="slide" [attr.aria-hidden]="$index !== active()">
              @for (p of slide; track p.code) {
                <div class="card" data-testid="carousel-item">
                  <img [src]="p.image" width="160" height="160" alt="" />
                  <p class="name">{{ p.name }}</p>
                  <p class="price">{{ p.price }}</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
      <button type="button" class="nav" (click)="next()" [disabled]="active() >= slides().length - 1" aria-label="次へ">›</button>
    </div>
    <p class="dots">
      @for (slide of slides(); track $index) {
        <button type="button" [class.on]="$index === active()" (click)="active.set($index)" [attr.aria-label]="($index + 1) + ' 枚目'"></button>
      }
    </p>
  `,
  styles: `
    .panel { display: flex; align-items: center; gap: 8px; }
    .viewport { overflow: hidden; flex: 1; }
    .track { display: flex; transition: transform .3s; }
    .slide { flex: 0 0 100%; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .card { padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center; background: #fff; }
    .card img { width: 100%; height: auto; display: block; }
    .name { margin: 6px 0 0; font-weight: bold; }
    .price { margin: 2px 0 0; color: #475569; }
    .nav { font-size: 24px; width: 36px; height: 36px; border-radius: 50%; border: 1px solid #94a3b8; background: #fff; cursor: pointer; }
    .nav:disabled { opacity: .3; cursor: default; }
    .dots { display: flex; gap: 6px; justify-content: center; }
    .dots button { width: 10px; height: 10px; border-radius: 50%; border: 0; background: #cbd5e1; padding: 0; cursor: pointer; }
    .dots button.on { background: #334155; }
  `,
})
export class CarouselComponent {
  readonly items = input.required<Product[]>();
  readonly size = input(4);
  readonly active = signal(0);
  /** cx-carousel と同じく、items を size 件ずつのスライドに分ける。items が変われば自動で作り直される。 */
  readonly slides = computed(() => {
    const out: Product[][] = [];
    const list = this.items();
    for (let i = 0; i < list.length; i += this.size()) out.push(list.slice(i, i + this.size()));
    return out;
  });
  prev() {
    this.active.update((n) => Math.max(0, n - 1));
  }
  next() {
    this.active.update((n) => Math.min(this.slides().length - 1, n + 1));
  }
}

/* ---------- ダイアログ(LaunchDialogService 相当) ---------- */
@Component({
  selector: 'app-image-dialog',
  template: `
    <div class="backdrop" (click)="close()" data-testid="dialog">
      <figure (click)="$event.stopPropagation()">
        <img [src]="product().image" width="560" height="560" [alt]="product().name" />
        <figcaption>{{ product().name }} <button type="button" (click)="close()">閉じる</button></figcaption>
      </figure>
    </div>
  `,
  styles: `
    .backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, .7); display: grid; place-items: center; z-index: 1500; }
    figure { margin: 0; background: #fff; padding: 12px; border-radius: 8px; max-width: 90vw; }
    img { max-width: 80vw; max-height: 70vh; width: auto; height: auto; display: block; }
    figcaption { display: flex; justify-content: space-between; margin-top: 8px; align-items: center; }
  `,
})
export class ImageDialogComponent {
  readonly product = input.required<Product>();
  close: () => void = () => {};
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly env = inject(EnvironmentInjector);
  private readonly doc = inject(DOCUMENT);
  private current?: ComponentRef<ImageDialogComponent>;

  /** ダイアログを 1 つだけ開く。閉じると、作った部品も DOM も必ず片付ける。 */
  openImage(product: Product): void {
    this.close();
    const ref = createComponent(ImageDialogComponent, { environmentInjector: this.env });
    ref.setInput('product', product);
    ref.instance.close = () => this.close();
    this.appRef.attachView(ref.hostView);
    this.doc.body.appendChild(ref.location.nativeElement);
    this.current = ref;
  }

  close(): void {
    if (!this.current) return;
    this.appRef.detachView(this.current.hostView);
    this.current.destroy();
    this.current = undefined;
  }
}

/* ---------- 画像の拡大(image-zoom 相当) ---------- */
@Component({
  selector: 'app-image-zoom',
  template: `
    <div class="zoom" (pointermove)="move($event)" (pointerenter)="on.set(true)" (pointerleave)="on.set(false)">
      <img [src]="src()" width="320" height="320" alt="" />
      @if (on()) {
        <img class="big" [src]="src()" alt="" [style.transform-origin]="origin()" />
      }
    </div>
  `,
  styles: `
    .zoom { position: relative; width: 320px; height: 320px; overflow: hidden; display: inline-block; }
    img { display: block; }
    .big { position: absolute; inset: 0; width: 100%; height: 100%; transform: scale(2.5); pointer-events: none; }
  `,
})
export class ImageZoomComponent {
  readonly src = input.required<string>();
  readonly on = signal(false);
  readonly origin = signal('50% 50%');
  move(e: PointerEvent) {
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.origin.set(`${((e.clientX - box.left) / box.width) * 100}% ${((e.clientY - box.top) / box.height) * 100}%`);
  }
}

/* ---------- タブ(cx-tab 相当) ---------- */
@Component({
  selector: 'app-tabs',
  template: `
    <div role="tablist" class="list">
      @for (t of labels(); track $index) {
        <button type="button" role="tab" [attr.aria-selected]="$index === active()" [class.on]="$index === active()"
          (click)="active.set($index)" [attr.data-testid]="'tab-' + $index">{{ t }}</button>
      }
    </div>
    <div role="tabpanel" class="panel" data-testid="tab-panel">
      @for (t of labels(); track $index) {
        @if ($index === active()) {
          {{ bodies()[$index] }}
        }
      }
    </div>
  `,
  styles: `
    .list { display: flex; gap: 4px; border-bottom: 1px solid #cbd5e1; }
    .list button { padding: 6px 14px; border: 1px solid #cbd5e1; border-bottom: 0; background: #f1f5f9; border-radius: 6px 6px 0 0; cursor: pointer; }
    .list button.on { background: #fff; font-weight: bold; }
    .panel { padding: 12px; border: 1px solid #cbd5e1; border-top: 0; }
  `,
})
export class TabsComponent {
  /** 見出しと本文を配列で受け取る(CMS のタブ部品が子部品の一覧を受け取るのと同じ形)。 */
  readonly tabs = input.required<{ label: string; body: string }[]>();
  readonly labels = computed(() => this.tabs().map((t) => t.label));
  readonly bodies = computed(() => this.tabs().map((t) => t.body));
  readonly active = signal(0);
}

/* ---------- 処理中の表示(cx-spinner 相当) ---------- */
@Component({
  selector: 'app-spinner-overlay',
  template: `
    <div class="wrap">
      <ng-content />
      @if (busy()) {
        <div class="cover" data-testid="spinner"><span class="spin"></span>処理中…</div>
      }
    </div>
  `,
  styles: `
    .wrap { position: relative; display: inline-block; }
    .cover { position: absolute; inset: -4px; background: rgba(255, 255, 255, .8); display: flex; align-items: center; justify-content: center; gap: 8px; }
    .spin { width: 16px; height: 16px; border: 3px solid #cbd5e1; border-top-color: #334155; border-radius: 50%; animation: s .8s linear infinite; }
    @keyframes s { to { transform: rotate(360deg); } }
  `,
})
export class SpinnerOverlay {
  readonly busy = input(false);
}
