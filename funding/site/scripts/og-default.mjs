import { chromium } from "@playwright/test";

const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin: 0; width: 1200px; height: 630px; }
    body {
      box-sizing: border-box;
      background: #ECE9E2;
      color: #1D232B;
      font-family: system-ui, "Hiragino Sans", "Yu Gothic UI", "Yu Gothic", Meiryo, sans-serif;
      display: flex;
      align-items: center;
      gap: 72px;
      padding: 0 96px;
    }
    .mark {
      position: relative;
      flex: none;
      width: 220px;
      height: 280px;
      background: #FBFAF7;
      border: 6px solid #1D232B;
    }
    .mark::before {
      content: "";
      position: absolute;
      left: 36px;
      top: 0;
      bottom: 0;
      width: 10px;
      background: #3D55D6;
    }
    h1 { margin: 0 0 20px; font-size: 64px; font-weight: 700; line-height: 1.2; }
    p { margin: 0; font-size: 36px; line-height: 1.4; color: #545C66; }
  </style>
</head>
<body>
  <div class="mark"></div>
  <div>
    <h1>Decision Desk</h1>
    <p>仕事とお金の確かめ方</p>
  </div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: "public/og-default.png", type: "png" });
await browser.close();
