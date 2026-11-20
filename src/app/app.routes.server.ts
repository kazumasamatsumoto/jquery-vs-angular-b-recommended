import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * どのページも、リクエストのたびにサーバーで描く(Composable Storefront の SSR と同じ)。
 * 事前描画(Prerender)にすると、「無理やり」版でビルド自体が落ちるため使わない。
 */
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Server }];
