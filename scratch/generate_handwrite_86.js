import fs from "fs";
import path from "path";
import opentype from "opentype.js";
 
// ─── Constants & Types ───
const glyphsList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?&$@#%*+-=/:;.,()[]{}<>";
 
const emptyGlyph = () => ({
  svg: "",
  rotation: 0,
  scale: 82,
  x: 0,
  y: 0,
  kerning: 0,
});

const getGlyphBounds = (svgString) => {
  const fallback = { minX: 0, maxX: 16, gridWidth: 16, gridHeight: 16, isEmpty: true };
  if (!svgString || !svgString.trim()) return fallback;

  const vbMatch = svgString.match(/viewBox=["']0\s+0\s+([\d.]+)\s+([\d.]+)["']/i);
  const gridWidth = vbMatch ? parseFloat(vbMatch[1]) : 16;
  const gridHeight = vbMatch ? parseFloat(vbMatch[2]) : 16;

  let minX = Infinity;
  let maxX = -Infinity;

  for (const m of svgString.matchAll(/<rect[^>]*?>/g)) {
    const rectStr = m[0];
    const xm = rectStr.match(/\bx=["'](-?[\d.]+)["']/);
    const wm = rectStr.match(/\bwidth=["']([\d.]+)["']/);
    if (xm && wm) {
      const x = parseFloat(xm[1]);
      const w = parseFloat(wm[1]);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + w);
    }
  }

  const pathPattern = /<path[^>]*d=["']([^"']+)["'][^>]*>/gi;
  for (const match of svgString.matchAll(pathPattern)) {
    const d = match[1];
    const regex = /([MmLlHhVvQqCcZz])\s*([0-9eE\s,.-]*)/g;
    let cmdMatch;
    let currX = 0;
    let currY = 0;
    
    while ((cmdMatch = regex.exec(d)) !== null) {
      const cmd = cmdMatch[1];
      const argsStr = cmdMatch[2] || "";
      const argMatches = argsStr.match(/-?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);
      const args = argMatches ? argMatches.map(Number) : [];
      
      const cmdUpper = cmd.toUpperCase();
      
      if (cmdUpper === 'M' || cmdUpper === 'L') {
        const isRelative = cmd === 'm' || cmd === 'l';
        for (let i = 0; i < args.length; i += 2) {
          if (i + 1 >= args.length) break;
          let x = args[i];
          let y = args[i+1];
          if (isRelative) {
            x += currX;
            y += currY;
          }
          currX = x;
          currY = y;
          minX = Math.min(minX, currX);
          maxX = Math.max(maxX, currX);
        }
      } else if (cmdUpper === 'H') {
        const isRelative = cmd === 'h';
        for (let i = 0; i < args.length; i++) {
          let x = args[i];
          if (isRelative) x += currX;
          currX = x;
          minX = Math.min(minX, currX);
          maxX = Math.max(maxX, currX);
        }
      } else if (cmdUpper === 'V') {
        const isRelative = cmd === 'v';
        for (let i = 0; i < args.length; i++) {
          let y = args[i];
          if (isRelative) y += currY;
          currY = y;
          minX = Math.min(minX, currX);
          maxX = Math.max(maxX, currX);
        }
      } else if (cmdUpper === 'Q') {
        const isRelative = cmd === 'q';
        for (let i = 0; i < args.length; i += 4) {
          if (i + 3 >= args.length) break;
          let cx = args[i];
          let cy = args[i+1];
          let x = args[i+2];
          let y = args[i+3];
          if (isRelative) {
            cx += currX;
            cy += currY;
            x += currX;
            y += currY;
          }
          minX = Math.min(minX, cx, x);
          maxX = Math.max(maxX, cx, x);
          currX = x;
          currY = y;
        }
      } else if (cmdUpper === 'C') {
        const isRelative = cmd === 'c';
        for (let i = 0; i < args.length; i += 6) {
          if (i + 5 >= args.length) break;
          let cx1 = args[i];
          let cy1 = args[i+1];
          let cx2 = args[i+2];
          let cy2 = args[i+3];
          let x = args[i+4];
          let y = args[i+5];
          if (isRelative) {
            cx1 += currX;
            cy1 += currY;
            cx2 += currX;
            cy2 += currY;
            x += currX;
            y += currY;
          }
          minX = Math.min(minX, cx1, cx2, x);
          maxX = Math.max(maxX, cx1, cx2, x);
          currX = x;
          currY = y;
        }
      }
    }
  }

  if (minX === Infinity || maxX === -Infinity) {
    return fallback;
  }

  return { minX, maxX, gridWidth, gridHeight, isEmpty: false };
};
 
// ─── Handwrite Glyphs Design (using paths with strokes) ───
const rawGlyphs = {
  // Uppercase
  A: `<path d="M 25 80 Q 40 25 50 15 Q 60 25 75 80 M 35 55 Q 50 50 65 55" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  B: `<path d="M 30 15 L 30 80 M 30 15 Q 60 15 50 48 Q 35 48 30 48 M 30 48 Q 65 48 50 80 Q 35 80 30 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  C: `<path d="M 65 25 Q 35 25 35 50 Q 35 75 65 75" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  D: `<path d="M 30 15 L 30 80 M 30 15 Q 68 15 68 48 Q 68 80 30 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  E: `<path d="M 70 20 L 30 20 L 30 80 L 75 80 M 30 50 L 60 50" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  F: `<path d="M 30 80 L 30 15 L 70 15 M 30 45 L 60 45" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  G: `<path d="M 70 25 Q 25 15 25 50 Q 25 85 70 75 L 70 50 L 50 50" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  H: `<path d="M 25 15 L 25 80 M 75 15 L 75 80 M 25 48 L 75 48" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  I: `<path d="M 30 15 L 70 15 M 50 15 L 50 80 M 30 80 L 70 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  J: `<path d="M 40 15 L 80 15 M 60 15 L 60 65 Q 60 85 30 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  K: `<path d="M 30 15 L 30 80 M 75 15 L 30 48 L 75 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  L: `<path d="M 35 15 L 35 80 L 75 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  M: `<path d="M 20 80 L 20 15 L 50 60 L 80 15 L 80 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  N: `<path d="M 25 80 L 25 15 L 75 80 L 75 15" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  O: `<path d="M 50 15 Q 25 15 25 50 Q 25 85 50 85 Q 75 85 75 50 Q 75 15 50 15 Z" fill="currentColor"/>
      <path d="M 50 30 Q 62 30 62 50 Q 62 70 50 70 Q 38 70 38 50 Q 38 30 50 30 Z" fill="#ffffff"/>`,
  P: `<path d="M 30 80 L 30 15 M 30 15 Q 65 15 50 48 Q 35 48 30 48" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  Q: `<path d="M 50 15 Q 25 15 25 50 Q 25 85 50 85 Q 75 85 75 50 Q 75 15 50 15 Z" fill="currentColor"/>
      <path d="M 50 30 Q 62 30 62 50 Q 62 70 50 70 Q 38 70 38 50 Q 38 30 50 30 Z" fill="#ffffff"/>
      <path d="M 55 65 L 80 85" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>`,
  R: `<path d="M 30 80 L 30 15 M 30 15 Q 65 15 50 48 Q 35 48 30 48 M 40 48 L 70 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  S: `<path d="M 65 25 Q 35 15 35 45 Q 35 55 65 55 Q 65 80 30 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  T: `<path d="M 20 18 L 80 18 M 50 18 L 50 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  U: `<path d="M 25 15 L 25 60 Q 25 85 50 85 Q 75 85 75 60 L 75 15" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  V: `<path d="M 20 15 L 50 80 L 80 15" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  W: `<path d="M 15 15 L 30 80 L 50 35 L 70 80 L 85 15" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  X: `<path d="M 25 15 L 75 80 M 75 15 L 25 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  Y: `<path d="M 20 15 L 50 50 L 80 15 M 50 50 L 50 82" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  Z: `<path d="M 25 18 L 75 18 L 25 80 L 75 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
 
  // Lowercase
  a: `<path d="M 65 50 Q 65 35 50 35 Q 35 35 35 50 Q 35 65 50 65 Q 65 65 65 50 Z M 65 35 L 65 65" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  b: `<path d="M 35 15 L 35 65 Q 35 65 50 65 Q 65 65 65 50 Q 65 35 50 35 Q 35 35 35 50" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  c: `<path d="M 60 42 Q 40 35 40 50 Q 40 65 60 58" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  d: `<path d="M 65 15 L 65 65 M 65 50 Q 65 35 50 35 Q 35 35 35 50 Q 35 65 50 65 Q 65 65 65 50" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  e: `<path d="M 35 50 L 65 50 Q 65 35 50 35 Q 35 35 35 50 Q 35 65 55 65" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  f: `<path d="M 55 15 Q 45 15 45 25 L 45 80 M 35 35 L 55 35" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  g: `<path d="M 65 40 Q 65 30 50 30 Q 35 30 35 45 Q 35 60 50 60 Q 65 60 65 40 L 65 80 Q 65 95 40 90" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  h: `<path d="M 35 15 L 35 65 M 35 45 Q 50 35 55 45 L 55 65" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  i: `<path d="M 50 38 L 50 65 M 50 25 L 50 27" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  j: `<path d="M 55 38 L 55 80 Q 55 95 35 90 M 55 25 L 55 27" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  k: `<path d="M 35 15 L 35 65 M 55 35 L 35 50 L 55 65" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  l: `<path d="M 45 15 L 45 65 Q 45 70 52 68" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  m: `<path d="M 30 65 L 30 38 M 30 45 Q 42 35 42 65 M 42 45 Q 55 35 55 65" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  n: `<path d="M 35 65 L 35 38 M 35 45 Q 55 35 55 65" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  o: `<path d="M 50 35 Q 35 35 35 50 Q 35 65 50 65 Q 65 65 65 50 Q 65 35 50 35 Z" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  p: `<path d="M 35 38 L 35 90 M 35 48 Q 50 35 55 45 Q 60 55 50 65 Q 40 70 35 50" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  q: `<path d="M 55 38 L 55 90 M 55 48 Q 40 35 35 45 Q 30 55 40 65 Q 50 70 55 50" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  r: `<path d="M 35 65 L 35 38 M 35 45 Q 50 38 55 40" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  s: `<path d="M 55 40 Q 40 32 38 48 Q 36 60 55 58 Q 58 68 38 70" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  t: `<path d="M 45 25 L 45 65 Q 45 70 52 68 M 35 35 L 55 35" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  u: `<path d="M 35 38 L 35 60 Q 35 65 50 65 Q 65 65 65 60 L 65 38" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  v: `<path d="M 35 38 L 50 65 L 65 38" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  w: `<path d="M 30 38 L 40 65 L 50 45 L 60 65 L 70 38" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  x: `<path d="M 35 38 L 65 65 M 65 38 L 35 65" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  y: `<path d="M 35 38 L 50 60 L 65 38 M 50 60 L 50 82 Q 50 92 35 90" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  z: `<path d="M 35 40 L 60 40 L 35 65 L 60 65" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
 
  // Punctuation and Symbols
  "!": `<path d="M 50 15 L 50 65 M 50 80 L 50 82" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  "?": `<path d="M 35 30 Q 35 15 50 15 Q 65 15 65 35 Q 65 50 50 50 L 50 62 M 50 78 L 50 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  "&": `<path d="M 70 75 Q 40 40 60 25 Q 70 35 50 55 Q 30 75 45 75 Q 60 75 75 55" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  "$": `<path d="M 50 10 L 50 90 M 65 30 Q 35 20 35 45 Q 35 55 65 55 Q 65 80 35 70" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  "@": `<path d="M 50 50 Q 35 50 35 65 Q 35 80 50 80 L 65 80 L 65 65 Q 65 35 50 35 Q 25 35 25 65 Q 25 95 50 95 L 75 95" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  "#": `<path d="M 40 15 L 40 85 M 60 15 L 60 85 M 20 35 L 80 35 M 20 65 L 80 65" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  "%": `<path d="M 25 35 Q 20 35 20 25 Q 20 15 25 15 Q 30 15 30 25 Q 30 35 25 35 M 75 85 Q 70 85 70 75 Q 70 65 75 65 Q 80 65 80 75 Q 80 85 75 85 M 80 15 L 20 85" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  "*": `<path d="M 50 30 L 50 70 M 30 40 L 70 60 M 30 60 L 70 40" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  "+": `<path d="M 50 25 L 50 75 M 25 50 L 75 50" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  "-": `<path d="M 25 50 L 75 50" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  "=": `<path d="M 25 40 L 75 40 M 25 60 L 75 60" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  "/": `<path d="M 25 85 L 75 15" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  ":": `<path d="M 50 35 L 50 37 M 50 65 L 50 67" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  ";": `<path d="M 50 35 L 50 37 M 50 65 L 50 67 Q 50 80 40 85" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  ".": `<path d="M 50 78 L 50 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  ",": `<path d="M 50 78 Q 50 85 40 90" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  "(": `<path d="M 65 15 Q 35 50 65 85" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  ")": `<path d="M 35 15 Q 65 50 35 85" stroke="currentColor" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  "[": `<path d="M 60 15 L 40 15 L 40 85 L 60 85" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  "]": `<path d="M 40 15 L 60 15 L 60 85 L 40 85" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  "{": `<path d="M 60 15 Q 45 15 45 35 Q 45 50 35 50 Q 45 50 45 65 Q 45 85 60 85" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  "}": `<path d="M 40 15 Q 55 15 55 35 Q 55 50 65 50 Q 55 50 55 65 Q 55 85 40 85" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  "<": `<path d="M 70 20 L 30 50 L 70 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  ">": `<path d="M 30 20 L 70 50 L 30 80" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
};
 
// ─── Build GlyphMap with default properties ───
const glyphMap = {};
for (const letter of glyphsList) {
  const innerHtml = rawGlyphs[letter] || "";
  const svg = innerHtml
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">${innerHtml}</svg>`
    : "";
  glyphMap[letter] = {
    ...emptyGlyph(),
    svg,
    scale: 80,
  };
}
 
// Set custom individual spacing (sidebearings) for a handwritten look
glyphMap["I"].kerning = -5;
glyphMap["l"].kerning = -5;
glyphMap["i"].kerning = -5;
glyphMap["t"].kerning = -3;
glyphMap["M"].kerning = 6;
glyphMap["W"].kerning = 6;
glyphMap["m"].kerning = 5;
glyphMap["w"].kerning = 5;
 
// Define custom Pair Kerning kustom (e.g. AV, Ta, Wo)
const kerningPairs = {
  "AV": -12,
  "VA": -12,
  "Ta": -8,
  "To": -8,
  "Te": -8,
  "Wo": -6,
  "We": -6,
  "Yo": -8,
  "Ye": -8,
};
 
// ─── Export Path function ───
const makeExportPath = (opentypeLib, art, letter) => {
  const path = new opentypeLib.Path();
  if (!art.svg) return path;
 
  const viewBox = art.svg.match(/viewBox=["']([^"']+)["']/i)?.[1];
  const viewParts = viewBox?.split(/\s+/).map(Number) ?? [0, 0, 100, 100];
  const [, , viewWidth = 100, viewHeight = 100] = viewParts;
  const scale = (art.scale / 100) * (700 / Math.max(viewWidth, viewHeight, 1));
  const rotate = (art.rotation * Math.PI) / 180;
  const centerX = viewWidth / 2;
  const centerY = viewHeight / 2;
 
  const xShift = art._xShift ?? 0;
  const transform = (x, y) => {
    const rx = x - centerX;
    const ry = y - centerY;
    const tx = rx * Math.cos(rotate) - ry * Math.sin(rotate) + centerX;
    const ty = rx * Math.sin(rotate) + ry * Math.cos(rotate) + centerY;
    return {
      x: 150 + xShift + (tx - viewParts[0]) * scale + art.x * 5,
      y: 790 - (ty - viewParts[1]) * scale - art.y * 5,
    };
  };
 
  const drawCircle = (cx, cy, r, isWhite = false) => {
    const k = r * 0.5522848;
    path.moveTo(cx, cy - r);
    path.bezierCurveTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
    path.bezierCurveTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
    path.bezierCurveTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
    path.bezierCurveTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
    path.close();
  };
 
  const checkIsWhite = (tagStr) => {
    return tagStr.includes('stroke="#ffffff"') || 
           tagStr.includes('stroke="white"') || 
           tagStr.includes('stroke="#fff"') || 
           tagStr.includes('fill="#ffffff"') || 
           tagStr.includes('fill="white"') || 
           tagStr.includes('fill="#fff"');
  };
 
  const pathPattern = /<path[^>]*d=["']([^"']+)["'][^>]*>/gi;
  for (const match of art.svg.matchAll(pathPattern)) {
    const d = match[1];
    const isStrokeOnly = (match[0].includes('fill="none"') || match[0].includes("fill='none'")) && !match[0].includes('fill-rule="evenodd"');
    const swMatch = match[0].match(/stroke-width=["']?(\d*\.?\d+)["']?/);
    const thickness = (isStrokeOnly && swMatch) ? Number(swMatch[1]) * scale : 0;
    const isWhite = checkIsWhite(match[0]);
 
    const contours = [];
    let currentContour = null;
    let currX = 0; let currY = 0;
    let startX = 0; let startY = 0;
    let lastP = { x: 0, y: 0 };
 
    const regex = /([MmLlHhVvQqCcZz])\s*([0-9eE\s,.-]*)/g;
    let cmdMatch;
 
    while ((cmdMatch = regex.exec(d)) !== null) {
      const cmd = cmdMatch[1];
      const argsStr = cmdMatch[2] || "";
      const argMatches = argsStr.match(/-?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);
      const args = argMatches ? argMatches.map(Number) : [];
      
      if (cmd === 'M' || cmd === 'm') {
        const isRel = cmd === 'm';
        for (let i = 0; i < args.length; i += 2) {
          if (i + 1 >= args.length) break;
          let x = args[i]; let y = args[i+1];
          if (isRel) { x += currX; y += currY; }
          currX = x; currY = y;
          const pt = transform(x, y);
          if (i === 0) {
            startX = x; startY = y;
            if (currentContour) contours.push(currentContour);
            currentContour = { startPt: pt, segments: [], closed: false };
          } else {
            if (currentContour) {
              currentContour.segments.push({ type: 'L', start: lastP, end: pt });
            }
          }
          lastP = pt;
        }
      } else if (cmd === 'L' || cmd === 'l') {
        const isRel = cmd === 'l';
        for (let i = 0; i < args.length; i += 2) {
          if (i + 1 >= args.length) break;
          let x = args[i]; let y = args[i+1];
          if (isRel) { x += currX; y += currY; }
          currX = x; currY = y;
          const pt = transform(x, y);
          if (currentContour) {
            currentContour.segments.push({ type: 'L', start: lastP, end: pt });
          }
          lastP = pt;
        }
      } else if (cmd === 'H' || cmd === 'h') {
        const isRel = cmd === 'h';
        for (let i = 0; i < args.length; i++) {
          let x = args[i];
          if (isRel) x += currX;
          currX = x;
          const pt = transform(currX, currY);
          if (currentContour) {
            currentContour.segments.push({ type: 'L', start: lastP, end: pt });
          }
          lastP = pt;
        }
      } else if (cmd === 'V' || cmd === 'v') {
        const isRel = cmd === 'v';
        for (let i = 0; i < args.length; i++) {
          let y = args[i];
          if (isRel) y += currY;
          currY = y;
          const pt = transform(currX, currY);
          if (currentContour) {
            currentContour.segments.push({ type: 'L', start: lastP, end: pt });
          }
          lastP = pt;
        }
      } else if (cmd === 'Q' || cmd === 'q') {
        const isRel = cmd === 'q';
        for (let i = 0; i < args.length; i += 4) {
          if (i + 3 >= args.length) break;
          let cx = args[i]; let cy = args[i+1];
          let x = args[i+2]; let y = args[i+3];
          if (isRel) { cx += currX; cy += currY; x += currX; y += currY; }
          currX = x; currY = y;
          const cpt = transform(cx, cy);
          const pt = transform(x, y);
          if (currentContour) {
            currentContour.segments.push({ type: 'Q', start: lastP, end: pt, c1: cpt });
          }
          lastP = pt;
        }
      } else if (cmd === 'C' || cmd === 'c') {
        const isRel = cmd === 'c';
        for (let i = 0; i < args.length; i += 6) {
          if (i + 5 >= args.length) break;
          let cx1 = args[i]; let cy1 = args[i+1];
          let cx2 = args[i+2]; let cy2 = args[i+3];
          let x = args[i+4]; let y = args[i+5];
          if (isRel) { cx1+=currX; cy1+=currY; cx2+=currX; cy2+=currY; x+=currX; y+=currY; }
          currX = x; currY = y;
          const c1 = transform(cx1, cy1);
          const c2 = transform(cx2, cy2);
          const pt = transform(x, y);
          if (currentContour) {
            currentContour.segments.push({ type: 'C', start: lastP, end: pt, c1, c2 });
          }
          lastP = pt;
        }
      } else if (cmd === 'Z' || cmd === 'z') {
        currX = startX; currY = startY;
        if (currentContour) {
          currentContour.closed = true;
          const startPt = currentContour.startPt;
          if (Math.hypot(lastP.x - startPt.x, lastP.y - startPt.y) > 0.01) {
            currentContour.segments.push({ type: 'L', start: lastP, end: startPt });
          }
          lastP = startPt;
        }
      }
    }
    if (currentContour) contours.push(currentContour);
 
    if (thickness > 0) {
      contours.forEach((contour) => {
        const pts = [];
        pts.push({ x: contour.startPt.x, y: contour.startPt.y });
        contour.segments.forEach((seg) => {
          if (seg.type === 'L') {
            pts.push({ x: seg.end.x, y: seg.end.y });
          } else if (seg.type === 'Q' && seg.c1) {
            for (let step = 1; step <= 8; step++) {
              const t = step / 8;
              const u = 1 - t;
              const nx = u * u * seg.start.x + 2 * u * t * seg.c1.x + t * t * seg.end.x;
              const ny = u * u * seg.start.y + 2 * u * t * seg.c1.y + t * t * seg.end.y;
              pts.push({ x: nx, y: ny });
            }
          } else if (seg.type === 'C' && seg.c1 && seg.c2) {
            for (let step = 1; step <= 8; step++) {
              const t = step / 8;
              const u = 1 - t;
              const nx = u * u * u * seg.start.x + 3 * u * u * t * seg.c1.x + 3 * u * t * t * seg.c2.x + t * t * t * seg.end.x;
              const ny = u * u * u * seg.start.y + 3 * u * u * t * seg.c1.y + 3 * u * t * t * seg.c2.y + t * t * t * seg.end.y;
              pts.push({ x: nx, y: ny });
            }
          }
        });
 
        const filteredPts = [];
        pts.forEach((pt) => {
          if (filteredPts.length === 0) {
            filteredPts.push(pt);
          } else {
            const last = filteredPts[filteredPts.length - 1];
            if (Math.hypot(pt.x - last.x, pt.y - last.y) > 0.05) {
              filteredPts.push(pt);
            }
          }
        });
 
        if (filteredPts.length === 0) return;
        const nPts = filteredPts.length;
        const r = thickness / 2;
 
        if (nPts === 1) {
          drawCircle(filteredPts[0].x, filteredPts[0].y, r, isWhite);
          return;
        }
 
        const normals = [];
        for (let i = 0; i < nPts; i++) {
          let vx = 0; let vy = 0;
          if (i === 0) {
            vx = filteredPts[1].x - filteredPts[0].x;
            vy = filteredPts[1].y - filteredPts[0].y;
          } else if (i === nPts - 1) {
            vx = filteredPts[nPts - 1].x - filteredPts[nPts - 2].x;
            vy = filteredPts[nPts - 1].y - filteredPts[nPts - 2].y;
          } else {
            const dx1 = filteredPts[i].x - filteredPts[i - 1].x;
            const dy1 = filteredPts[i].y - filteredPts[i - 1].y;
            const len1 = Math.hypot(dx1, dy1) || 1;
            const dx2 = filteredPts[i + 1].x - filteredPts[i].x;
            const dy2 = filteredPts[i + 1].y - filteredPts[i].y;
            const len2 = Math.hypot(dx2, dy2) || 1;
            vx = dx1 / len1 + dx2 / len2;
            vy = dy1 / len1 + dy2 / len2;
          }
          const len = Math.hypot(vx, vy);
          if (len < 0.001) {
            normals.push({ x: 0, y: 1 });
          } else {
            normals.push({ x: -vy / len, y: vx / len });
          }
        }
 
        const leftSide = [];
        const rightSide = [];
        for (let i = 0; i < nPts; i++) {
          const pt = filteredPts[i];
          const normal = normals[i];
          leftSide.push({ x: pt.x + normal.x * r, y: pt.y + normal.y * r });
          rightSide.push({ x: pt.x - normal.x * r, y: pt.y - normal.y * r });
        }
 
        if (isWhite) {
          path.moveTo(rightSide[0].x, rightSide[0].y);
          for (let i = 1; i < nPts; i++) path.lineTo(rightSide[i].x, rightSide[i].y);
          
          const endPt = filteredPts[nPts - 1];
          const prevPt = filteredPts[nPts - 2];
          const endVx = endPt.x - prevPt.x;
          const endVy = endPt.y - prevPt.y;
          const endLen = Math.hypot(endVx, endVy) || 1;
          const endAlpha = Math.atan2(endVy, endVx);
          const endStartAngle = endAlpha - Math.PI / 2;
          for (let step = 1; step <= 4; step++) {
            const a = endStartAngle + step * (Math.PI / 4);
            path.lineTo(endPt.x + r * Math.cos(a), endPt.y + r * Math.sin(a));
          }
          for (let i = nPts - 1; i >= 0; i--) path.lineTo(leftSide[i].x, leftSide[i].y);
          
          const startPt = filteredPts[0];
          const nextPt = filteredPts[1];
          const startVx = nextPt.x - startPt.x;
          const startVy = nextPt.y - startPt.y;
          const startLen = Math.hypot(startVx, startVy) || 1;
          const startAlpha = Math.atan2(startVy, startVx);
          const startStartAngle = startAlpha + Math.PI / 2;
          for (let step = 1; step <= 4; step++) {
            const a = startStartAngle + step * (Math.PI / 4);
            path.lineTo(startPt.x + r * Math.cos(a), startPt.y + r * Math.sin(a));
          }
        } else {
          path.moveTo(leftSide[0].x, leftSide[0].y);
          for (let i = 1; i < nPts; i++) path.lineTo(leftSide[i].x, leftSide[i].y);
          
          const endPt = filteredPts[nPts - 1];
          const prevPt = filteredPts[nPts - 2];
          const endVx = endPt.x - prevPt.x;
          const endVy = endPt.y - prevPt.y;
          const endLen = Math.hypot(endVx, endVy) || 1;
          const endAlpha = Math.atan2(endVy, endVx);
          const endStartAngle = endAlpha + Math.PI / 2;
          for (let step = 1; step <= 4; step++) {
            const a = endStartAngle - step * (Math.PI / 4);
            path.lineTo(endPt.x + r * Math.cos(a), endPt.y + r * Math.sin(a));
          }
          for (let i = nPts - 1; i >= 0; i--) path.lineTo(rightSide[i].x, rightSide[i].y);
          
          const startPt = filteredPts[0];
          const nextPt = filteredPts[1];
          const startVx = nextPt.x - startPt.x;
          const startVy = nextPt.y - startPt.y;
          const startLen = Math.hypot(startVx, startVy) || 1;
          const startAlpha = Math.atan2(startVy, startVx);
          const startStartAngle = startAlpha - Math.PI / 2;
          for (let step = 1; step <= 4; step++) {
            const a = startStartAngle - step * (Math.PI / 4);
            path.lineTo(startPt.x + r * Math.cos(a), startPt.y + r * Math.sin(a));
          }
        }
        path.close();
      });
    } else {
      contours.forEach((contour) => {
        if (contour.segments.length === 0) return;
        if (isWhite) {
          const lastPt = contour.segments[contour.segments.length - 1].end;
          path.moveTo(lastPt.x, lastPt.y);
          for (let i = contour.segments.length - 1; i >= 0; i--) {
            const seg = contour.segments[i];
            if (seg.type === 'L') {
              path.lineTo(seg.start.x, seg.start.y);
            } else if (seg.type === 'Q' && seg.c1) {
              if (path.quadraticCurveTo) path.quadraticCurveTo(seg.c1.x, seg.c1.y, seg.start.x, seg.start.y);
              else path.lineTo(seg.start.x, seg.start.y);
            } else if (seg.type === 'C' && seg.c1 && seg.c2) {
              if (path.bezierCurveTo) path.bezierCurveTo(seg.c2.x, seg.c2.y, seg.c1.x, seg.c1.y, seg.start.x, seg.start.y);
              else path.lineTo(seg.start.x, seg.start.y);
            }
          }
          if (contour.closed) path.close();
        } else {
          path.moveTo(contour.startPt.x, contour.startPt.y);
          contour.segments.forEach((seg) => {
            if (seg.type === 'L') {
              path.lineTo(seg.end.x, seg.end.y);
            } else if (seg.type === 'Q' && seg.c1) {
              if (path.quadraticCurveTo) path.quadraticCurveTo(seg.c1.x, seg.c1.y, seg.end.x, seg.end.y);
              else path.lineTo(seg.end.x, seg.end.y);
            } else if (seg.type === 'C' && seg.c1 && seg.c2) {
              if (path.bezierCurveTo) path.bezierCurveTo(seg.c1.x, seg.c1.y, seg.c2.x, seg.c2.y, seg.end.x, seg.end.y);
              else path.lineTo(seg.end.x, seg.end.y);
            }
          });
          if (contour.closed) path.close();
        }
      });
    }
  }
 
  return path;
};
 
// ─── Main Logic ───
async function run() {
  const conversationId = "729cb236-d9a9-43d5-9113-bb25a2ba0a8a";
  const artifactsDir = `/Users/rano/.gemini/antigravity-ide/brain/${conversationId}`;
  
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
 
  // 1. Generate `.draftype` project file payload
  const projectData = {
    fontName: "Tangan Rano Handwrite",
    fontDesigner: "Rano & Antigravity AI",
    fontStyle: "Regular",
    fontVersion: "1.0.0",
    fontLicense: "SIL Open Font License",
    glyphMap,
    activeGlyph: "A",
    brickGrids: {},
    kerningPairs,
    snapToGrid: false,
    gridSnapSize: 2.5,
    penType: "round",
    penAngle: 45,
  };
 
  const projectFilePath = path.join(artifactsDir, "handwrite.draftype");
  fs.writeFileSync(projectFilePath, JSON.stringify(projectData, null, 2));
  console.log(`Saved .draftype project to: ${projectFilePath}`);
 
  // 2. Export to OTF using opentype.js
  const exportedGlyphs = [
    new opentype.Glyph({ name: ".notdef", advanceWidth: 650 }),
    new opentype.Glyph({ name: "space", unicode: 32, advanceWidth: 360 }),
    ...Object.entries(glyphMap).map(([letter, art]) => {
      const bounds = getGlyphBounds(art.svg);
      const glyphScaleFactor = (art.scale / 100) * (700 / Math.max(bounds.gridWidth, bounds.gridHeight, 1));
      
      const desiredLSB = 70; // matching page.tsx
      const naturalLeft = 150 + bounds.minX * glyphScaleFactor;
      const xShiftProportional = desiredLSB - naturalLeft;
      
      const contentWidthOTF = (bounds.maxX - bounds.minX) * glyphScaleFactor;
      const advanceWidth = bounds.isEmpty
        ? 650
        : Math.round(desiredLSB + contentWidthOTF + desiredLSB) + (art.kerning ?? 0) * 8;
      
      const artWithShift = { ...art, _xShift: xShiftProportional };
      
      return new opentype.Glyph({
        name: `glyph-${letter.charCodeAt(0)}`,
        unicode: letter.charCodeAt(0),
        advanceWidth: Math.max(100, advanceWidth),
        path: art.svg ? makeExportPath(opentype, artWithShift, letter) : undefined,
      });
    }),
  ];
 
  const font = new opentype.Font({
    familyName: "Tangan Rano Handwrite",
    styleName: "Regular",
    unitsPerEm: 1000,
    ascender: 850,
    descender: -150,
    designer: "Rano & Antigravity AI",
    version: "1.0.0",
    license: "SIL Open Font License",
    glyphs: exportedGlyphs,
  });
 
  const otfFilePath = path.join(artifactsDir, "handwrite.otf");
  const buffer = font.toArrayBuffer();
  fs.writeFileSync(otfFilePath, Buffer.from(buffer));
  console.log(`Saved compiled OTF to: ${otfFilePath}`);
 
  console.log("\n─── Analysis ───");
  console.log(`Font Name: Tangan Rano Handwrite`);
  console.log(`Glyph Count: ${font.glyphs.length}`);
}
 
run().catch(console.error);
