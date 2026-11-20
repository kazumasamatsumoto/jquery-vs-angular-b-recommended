import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <h1>パターン B: jQuery を使わずに Angular で作り直す</h1>
    <p class="lead">
      SAP Commerce の Accelerator で jQuery プラグインが担っていた 6 つの機能を、Composable Storefront の標準部品と同じ作りの
      Angular 部品だけで作った版です。jQuery プラグインをそのまま組み込んだ版(パターン A)は、別のリポジトリ
      <code>jquery-vs-angular-a-legacy</code> にあります。
    </p>
    <p><a routerLink="/recommended" data-testid="nav-recommended">B: 選び直す(推奨)のページへ</a></p>

    <h2>試すこと</h2>
    <ol>
      <li>ページを<strong>アドレス欄から直接開く</strong>(サーバーで描く SSR が通るか)。</li>
      <li>「商品を入れ替える」を押し、カルーセルの中身がデータどおりに変わるか見る。</li>
      <li>タブの「仕様」を押す。</li>
      <li>CMS から来た文言(HTML を混ぜたもの)が、文字として表示されることを確かめる。</li>
      <li>このページと行き来し、右下の診断パネルの数字が増え続けないことを見る。</li>
    </ol>
  `,
  styleUrl: './recommended.scss',
})
export class HomePage {}
