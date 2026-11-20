import { Routes } from '@angular/router';
import { HomePage } from './pages/home';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'トップ' },
  { path: 'recommended', loadComponent: () => import('./pages/recommended').then((m) => m.RecommendedPage), title: 'B: 選び直す' },
];
