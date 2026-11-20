import { Component, NgZone, OnDestroy, afterNextRender, inject, signal } from '@angular/core';
import type { LabSnapshot } from './instrument';

/** 画面の右下に出す診断パネル。1 秒ごとに計測値を読み直す。 */
@Component({
  selector: 'app-diagnostics-panel',
  template: `
    <aside class="diag" [class.alert]="snap()?.xss" data-testid="diagnostics">
      <h2>診断パネル <small>(1 秒ごとに更新)</small></h2>
      @if (snap(); as s) {
        <dl>
          <dt>window のリスナー</dt><dd data-testid="windowListeners">{{ s.windowListeners }}</dd>
          <dt>document のリスナー</dt><dd>{{ s.documentListeners }}</dd>
          <dt>jQuery 内部のハンドラ(window)</dt><dd data-testid="jqueryWindowHandlers">{{ s.jqueryWindowHandlers }}</dd>
          <dt>jQuery 内部のハンドラ(document)</dt><dd data-testid="jqueryDocumentHandlers">{{ s.jqueryDocumentHandlers }}</dd>
          <dt>動いている setInterval</dt><dd data-testid="intervals">{{ s.intervals }}</dd>
          @for (l of leftoverList(s); track l.label) {
            <dt>アプリの外に残った {{ l.label }}</dt><dd>{{ l.count }}</dd>
          }
          <dt>DOM の要素数</dt><dd>{{ s.domNodes }}</dd>
          <dt>変更検知 / 秒</dt><dd data-testid="cdPerSecond">{{ cdPerSecond() }}</dd>
          <dt>XSS</dt><dd data-testid="xss">{{ s.xss ? '実行された' : 'なし' }}</dd>
        </dl>
      } @else {
        <p>サーバーで描いた時点では計測できません(ブラウザで動き始めると表示されます)。</p>
      }
    </aside>
  `,
  styles: `
    .diag { position: fixed; right: 12px; bottom: 12px; width: 300px; max-height: 70vh; overflow: auto;
      background: #0f172a; color: #e2e8f0; font-size: 12px; border-radius: 8px; padding: 10px 12px; z-index: 2000; opacity: .95; }
    .diag.alert { background: #7f1d1d; }
    h2 { font-size: 13px; margin: 0 0 6px; }
    small { font-weight: normal; color: #94a3b8; }
    dl { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; margin: 0; }
    dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
  `,
})
export class DiagnosticsPanel implements OnDestroy {
  readonly snap = signal<LabSnapshot | null>(null);
  readonly cdPerSecond = signal(0);
  private timer?: number;
  private lastCd = 0;
  private readonly zone = inject(NgZone);

  constructor() {
    afterNextRender(() => {
      const lab = window.__lab;
      if (!lab) return;
      // パネル自身のタイマーは Angular の外で動かし、計測の対象からも外す
      this.zone.runOutsideAngular(() => {
        this.timer = window.setInterval(() => {
          const s = lab.snapshot();
          this.cdPerSecond.set(s.changeDetections - this.lastCd);
          this.lastCd = s.changeDetections;
          this.snap.set(s);
        }, 1000);
        lab.excludedIntervals.add(this.timer);
      });
    });
  }

  leftoverList(s: LabSnapshot) {
    return Object.entries(s.leftovers).map(([label, count]) => ({ label, count }));
  }

  ngOnDestroy(): void {
    if (this.timer) window.clearInterval(this.timer);
  }
}
