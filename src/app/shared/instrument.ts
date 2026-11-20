/**
 * 診断用の計測。ブラウザでだけ、アプリの起動より前に呼ぶ(main.ts)。
 *
 * 数えるもの
 * - window と document に付いているイベントリスナーの数(ネイティブ)
 * - jQuery が内部で持っている window と document のハンドラ数
 *   (jQuery は同じ種類のイベントを 1 本のネイティブリスナーにまとめるので、ネイティブの数だけでは漏れが見えない)
 * - 動き続けている setInterval の数
 * - アプリの外(body の直下)に残っているプラグインの部品
 * - ルートの変更検知(ngDoCheck)が走った回数
 *
 * ページを行き来して、この数が増え続けるなら「後始末の漏れ」です。
 */
type Listener = EventListenerOrEventListenerObject;

export interface LabSnapshot {
  windowListeners: number;
  documentListeners: number;
  jqueryWindowHandlers: number;
  jqueryDocumentHandlers: number;
  intervals: number;
  leftovers: Record<string, number>;
  domNodes: number;
  changeDetections: number;
  xss: boolean;
}

export interface LabApi {
  changeDetections: number;
  excludedIntervals: Set<number>;
  snapshot(): LabSnapshot;
}

declare global {
  interface Window {
    __lab?: LabApi;
    jQuery?: any;
  }
}

/** プラグインが body の直下に足す部品。アプリ(app-root)の外に残っていれば数える。 */
const LEFTOVER_SELECTORS: Record<string, string> = {
  'colorbox の部品(#colorbox / #cboxOverlay)': '#colorbox, #cboxOverlay',
  'datepicker の部品(#ui-datepicker-div)': '#ui-datepicker-div',
  'blockUI の覆い(.blockUI)': '.blockUI',
};

export function installInstrumentation(): void {
  if (typeof window === 'undefined' || window.__lab) return;

  const registry = new Map<EventTarget, Set<string>>([
    [window, new Set()],
    [document, new Set()],
  ]);
  const ids = new WeakMap<object, number>();
  let nextId = 1;
  const keyOf = (type: string, l: Listener | null, opts?: boolean | AddEventListenerOptions | EventListenerOptions) => {
    if (!l) return '';
    if (!ids.has(l)) ids.set(l, nextId++);
    const capture = typeof opts === 'boolean' ? opts : !!opts?.capture;
    return `${type}|${ids.get(l)}|${capture}`;
  };

  const origAdd = EventTarget.prototype.addEventListener;
  const origRemove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, l: Listener | null, opts?: boolean | AddEventListenerOptions) {
    registry.get(this)?.add(keyOf(type, l, opts));
    return origAdd.call(this, type, l, opts);
  };
  EventTarget.prototype.removeEventListener = function (this: EventTarget, type: string, l: Listener | null, opts?: boolean | EventListenerOptions) {
    registry.get(this)?.delete(keyOf(type, l, opts));
    return origRemove.call(this, type, l, opts);
  };

  const intervals = new Set<number>();
  const origSetInterval = window.setInterval.bind(window);
  const origClearInterval = window.clearInterval.bind(window);
  window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
    const id = origSetInterval(handler, timeout, ...args);
    intervals.add(id);
    return id;
  }) as typeof window.setInterval;
  window.clearInterval = ((id?: number) => {
    if (id !== undefined) intervals.delete(id);
    origClearInterval(id);
  }) as typeof window.clearInterval;

  const countJqueryHandlers = (target: Window | Document) => {
    const $ = window.jQuery;
    if (!$ || !$._data) return 0;
    const events = $._data(target, 'events') || {};
    return Object.values(events).reduce((sum: number, list: any) => sum + (list?.length ?? 0), 0);
  };

  const api: LabApi = {
    changeDetections: 0,
    excludedIntervals: new Set(),
    snapshot() {
      const appRoot = document.querySelector('app-root');
      const leftovers: Record<string, number> = {};
      for (const [label, sel] of Object.entries(LEFTOVER_SELECTORS)) {
        leftovers[label] = Array.from(document.querySelectorAll(sel)).filter((el) => !appRoot?.contains(el)).length;
      }
      return {
        windowListeners: registry.get(window)!.size,
        documentListeners: registry.get(document)!.size,
        jqueryWindowHandlers: countJqueryHandlers(window),
        jqueryDocumentHandlers: countJqueryHandlers(document),
        intervals: [...intervals].filter((id) => !api.excludedIntervals.has(id)).length,
        leftovers,
        domNodes: document.getElementsByTagName('*').length,
        changeDetections: api.changeDetections,
        xss: document.documentElement.dataset['xss'] === 'executed',
      };
    },
  };
  window.__lab = api;
}
