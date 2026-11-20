// 商品画像のダミー(SVG)を public/img に作る。外部の画像サービスに頼らず、オフラインで動かすため。
// 使い方: node scripts/make-images.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const items = [
  ['A01', 'カメラ', '#2563eb'], ['A02', 'レンズ', '#7c3aed'], ['A03', '三脚', '#db2777'],
  ['A04', 'ストロボ', '#ea580c'], ['A05', 'バッグ', '#16a34a'], ['A06', 'メモリーカード', '#0891b2'],
  ['B01', 'ヘッドホン', '#4f46e5'], ['B02', 'スピーカー', '#be123c'], ['B03', 'マイク', '#ca8a04'],
  ['B04', 'アンプ', '#0d9488'], ['B05', 'ケーブル', '#9333ea'], ['B06', 'スタンド', '#475569'],
];

mkdirSync('public/img', { recursive: true });
for (const [code, label, color] of items) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="${color}"/>
  <g fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2">
    ${Array.from({ length: 19 }, (_, i) => `<line x1="${(i + 1) * 40}" y1="0" x2="${(i + 1) * 40}" y2="800"/><line x1="0" y1="${(i + 1) * 40}" x2="800" y2="${(i + 1) * 40}"/>`).join('')}
  </g>
  <text x="400" y="380" font-family="sans-serif" font-size="120" fill="#ffffff" text-anchor="middle">${code}</text>
  <text x="400" y="500" font-family="sans-serif" font-size="64" fill="#ffffff" text-anchor="middle">${label}</text>
</svg>
`;
  writeFileSync(`public/img/${code}.svg`, svg);
}
console.log(`wrote ${items.length} images to public/img`);
