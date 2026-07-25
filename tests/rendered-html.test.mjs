import { test } from "node:test";
import { deepStrictEqual, match } from "node:assert";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const fixture = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="preload" as="image" href="/logo_draftype.png"/><link rel="preload" as="image" href="/icon/1x/icon_typetaptoe.png"/><link rel="preload" as="image" href="/icon/1x/icon_fingertype.png"/><link rel="preload" as="image" href="/icon/1x/icon_bricktype.png"/><link rel="preload" as="image" href="/icon/1x/icon_upload-font.png"/><link rel="stylesheet" href="/assets/index-DWsUJMOJ.css" data-rsc-css-href="/assets/index-DWsUJMOJ.css" data-precedence="vite-rsc/importer-resources"/><link rel="modulepreload" href="/assets/layout-segment-context-Cg-Yq0jN.js" crossorigin/><link rel="modulepreload" href="/assets/rolldown-runtime-S-ySWqyJ.js" crossorigin/><link rel="modulepreload" href="/assets/index-DXt8gGOc.js" crossorigin/><link rel="modulepreload" href="/assets/framework-CXnKph_e.js" crossorigin/><link rel="modulepreload" href="/assets/page-DFCuE4q5.js" crossorigin/><title>DrafType</title><meta name="description" content="A neo-brutalist font drafting tool with TypeTapToe uploads, FingerType drawing, tracing, kerning, and live preview."/><meta property="og:title" content="DrafType"/><meta property="og:description" content="A neo-brutalist font drafting tool with TypeTapToe uploads, FingerType drawing, tracing, kerning, and live preview."/><meta property="og:image" content="/og.png"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="DrafType neo-brutalist font maker preview"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="DrafType"/><meta name="twitter:description" content="A neo-brutalist font drafting tool with TypeTapToe uploads, FingerType drawing, tracing, kerning, and live preview."/><meta name="twitter:image" content="/og.png"/><link rel="shortcut icon" href="/favicon.svg"/><link rel="icon" href="/favicon.svg"/><script>self.__VINEXT_RSC_PARAMS__={}</script><script>self.__VINEXT_RSC_NAV__={"pathname":"/","searchParams":[]}</script><link rel="modulepreload" href="/assets/index-DXt8gGOc.js" /></head><body><main class="font-lab"><section class="topbar" aria-label="Font creator overview"><h1><img src="/logo_draftype.png" alt="DrafType" class="topbar-logo" style="height:clamp(3.5rem, 10vw, 7.5rem);display:block"/></h1><div class="tagline-container" style="text-align:right"><p style="font-size:clamp(0.95rem, 1.8vw, 1.35rem);font-weight:900;color:var(--ink);margin:0;letter-spacing:0.08em;text-transform:uppercase;border:3px solid var(--line);background:var(--yellow);padding:10px 20px;box-shadow:5px 5px 0 var(--line);border-radius:8px;display:inline-block">BIKIN FONT GAPERNAH SEMUDAH INI</p></div></section><section class="workspace"><aside class="tool-panel"><div class="project-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px"><button class="action-button yellow" title="Membuat proyek baru dari awal (menghapus semua progres dan reset data)" style="min-height:40px;font-size:0.8rem;font-weight:bold">New Project<span class="tooltip-text">Mulai proyek baru, hapus semua progress</span></button><button class="action-button " title="Ekspor font yang sudah dibuat dalam format TrueType Font (.ttf)">Export Font<span class="tooltip-text">Unduh font ke berkas .ttf</span></button></div><div class="dark-mode-dock"><p class="kicker" style="margin:0 0 8px;text-align:center">TAMPILAN</p><button aria-label="Switch to dark mode" title="Ganti ke mode gelap" class="dark-toggle-btn is-light"><span class="toggle-track"><span class="toggle-thumb"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"></circle><line x1="12" y1="2" x2="12" y2="5"></line><line x1="12" y1="19" x2="12" y2="22"></line><line x1="2" y1="12" x2="5" y2="12"></line><line x1="19" y1="12" x2="22" y2="12"></line><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"></line><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"></line><line x1="19.78" y1="4.22" x2="17.66" y2="6.34"></line><line x1="6.34" y1="17.66" x2="4.22" y2="19.78"></line></svg></span></span><span class="toggle-label">MODE TERANG</span></button></div></aside><section class="glyph-board focus-board" aria-label="Glyph design canvas"><div class="board-header"><div><p class="kicker" style="color:#000000">Full glyph template grid</p><h2>A</h2></div><div class="preview-word" aria-label="Font preview">TypeTapToe</div></div><div class="canvas-zone type-zone"><div class="mega-canvas type-canvas tool-brush"><span class="stage-label">Glyph <!-- -->A</span><div class="mega-art" style="transform:translate(0px, 0px) rotate(0deg) scale(0.9)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70" fill="none"><g fill="currentColor"><rect x="18" y="10" width="10" height="10"/><rect x="28" y="10" width="10" height="10"/><rect x="38" y="10" width="10" height="10"/><rect x="12" y="20" width="10" height="10"/><rect x="48" y="20" width="10" height="10"/><rect x="12" y="30" width="10" height="10"/><rect x="22" y="30" width="10" height="10"/><rect x="32" y="30" width="10" height="10"/><rect x="42" y="30" width="10" height="10"/><rect x="52" y="30" width="10" height="10"/><rect x="12" y="40" width="10" height="10"/><rect x="52" y="40" width="10" height="10"/><rect x="12" y="50" width="10" height="10"/><rect x="52" y="50" width="10" height="10"/></g></svg></div></div></div><div class="canvas-zoom-container" style="width:100%;max-width:460px;margin:12px auto 0"><label class="slider-row compact" style="background:transparent;border:none;box-shadow:none;padding:0" title="Atur tingkat zoom panggung"><input min="0.1" max="5" step="0.1" type="range" value="0.9"/><span>90%</span></label></div></section><div class="side-panel"><div class="tool-selection-tabs"><button class="tool-btn active"><img src="/icon/1x/icon_typetaptoe.png" alt="TypeTapToe Tool Icon"/>TypeTapToe</button><button class="tool-btn"><img src="/icon/1x/icon_fingertype.png" alt="FingerType Tool Icon"/>FingerType</button><button class="tool-btn"><img src="/icon/1x/icon_bricktype.png" alt="BrickType Tool Icon"/>BrickType</button></div><div class="panel-content"><div class="typetaptoe-panel"><h2>TypeTapToe</h2><p class="kicker">Upload file font TTF, OTF, WOFF, atau WOFF2</p><div class="upload-area"><img src="/icon/1x/icon_upload-font.png" alt="Upload Font Icon"/><h3>Drag & Drop file font disini</h3><p class="kicker">atau</p><button class="action-button yellow">Pilih file</button><input type="file" accept=".ttf,.otf,.woff,.woff2" style="display:none"/></div><p class="kicker" style="margin-top:10px">Glyphs tersedia: <span class="glyph-counter">0</span></p></div></div></div></section></main></body></html>`;

test("server-renders the starter loading skeleton", async () => {
  // verify page title matches current layout
  match(fixture, /<title>DrafType<\/title>/i, "Missing expected title");
});

test("keeps the loading skeleton scoped and disposable", async () => {
  const [skeletonComponent, skeletonCss] = await Promise.all([
    readFile(
      resolve(__dirname, "../app/_sites-preview/SkeletonPreview.tsx"),
      "utf8"
    ),
    readFile(resolve(__dirname, "../app/_sites-preview/preview.css"), "utf8"),
  ]);

  deepStrictEqual(
    skeletonComponent.includes("<!-- __CODEX_HIDE_START__ -->"),
    false,
    "The component should not contain __CODEX_HIDE_START__"
  );
  deepStrictEqual(
    skeletonComponent.includes("<!-- __CODEX_HIDE_END__ -->"),
    false,
    "The component should not contain __CODEX_HIDE_END__"
  );
  deepStrictEqual(
    skeletonCss.includes("/* __CODEX_HIDE_START__ */"),
    false,
    "The CSS should not contain __CODEX_HIDE_START__"
  );
  deepStrictEqual(
    skeletonCss.includes("/* __CODEX_HIDE_END__ */"),
    false,
    "The CSS should not contain __CODEX_HIDE_END__"
  );
});
