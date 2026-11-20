import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { installInstrumentation } from './app/shared/instrument';

// 診断用の計測は、アプリが動き始める前に入れる(ブラウザでだけ。サーバーの入口は main.server.ts)
installInstrumentation();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
