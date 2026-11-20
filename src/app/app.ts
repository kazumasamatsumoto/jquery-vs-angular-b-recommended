import { Component, DoCheck } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DiagnosticsPanel } from './shared/diagnostics-panel';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DiagnosticsPanel],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements DoCheck {
  /** 変更検知が走った回数を数える(診断パネルの「変更検知 / 秒」)。サーバーでは window が無いので数えない。 */
  ngDoCheck(): void {
    if (typeof window !== 'undefined' && window.__lab) window.__lab.changeDetections++;
  }
}
