import fs from "fs";
import path from "path";
import opentype from "opentype.js";

// Load existing user project
const projectPath = "/Users/rano/Downloads/nulisaja.draftype";
const rawProject = JSON.parse(fs.readFileSync(projectPath, "utf8"));
const existingGlyphs = rawProject.glyphMap || {};

const glyphsList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?&$@#%*+-=/:;.,()[]{}<>";

// Style from user's font: stroke-width=6, round caps, natural handwriting paths
const SW = `stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

const rawGlyphs = {
  A: `<path d="M 27 80 L 30 72 L 34 62 L 39 52 L 44 42 L 49 33 L 53 26 L 56 22 L 58 20 L 60 21 L 62 24 L 64 30 L 67 38 L 70 48 L 73 58 L 75 67 L 76 74 L 77 80 M 35 58 L 43 55 L 52 52 L 61 50 L 69 49 L 74 49" ${SW}/>`,
  B: `<path d="M 32 20 L 32 80 M 32 20 L 48 20 L 56 22 L 62 26 L 65 31 L 65 37 L 62 43 L 56 47 L 48 49 L 32 49 M 32 49 L 50 50 L 59 53 L 65 58 L 68 63 L 68 70 L 65 75 L 59 79 L 50 81 L 32 81" ${SW}/>`,
  C: `<path d="M 72 32 L 68 27 L 62 23 L 55 21 L 47 20 L 40 21 L 33 24 L 28 29 L 25 35 L 23 42 L 23 50 L 24 57 L 27 63 L 31 69 L 37 74 L 44 78 L 51 80 L 58 80 L 65 78 L 71 74 L 75 69" ${SW}/>`,
  D: `<path d="M 33 20 L 33 81 M 33 20 L 46 20 L 57 22 L 65 27 L 71 33 L 74 41 L 75 50 L 74 59 L 71 67 L 65 73 L 57 78 L 46 81 L 33 81" ${SW}/>`,
  E: `<path d="M 68 20 L 33 20 L 33 81 L 68 81 M 33 50 L 60 50" ${SW}/>`,
  F: `<path d="M 33 81 L 33 20 L 68 20 M 33 50 L 60 50" ${SW}/>`,
  G: `<path d="M 72 32 L 67 27 L 61 23 L 54 21 L 46 21 L 39 23 L 33 27 L 28 33 L 25 40 L 24 48 L 25 56 L 28 63 L 33 69 L 39 74 L 46 78 L 54 80 L 62 80 L 68 78 L 73 74 L 75 68 L 75 51 L 57 51" ${SW}/>`,
  H: `<path d="M 28 20 L 28 81 M 73 20 L 73 81 M 28 50 L 73 50" ${SW}/>`,
  I: `<path d="M 38 20 L 63 20 M 50 20 L 50 81 M 38 81 L 63 81" ${SW}/>`,
  J: `<path d="M 40 20 L 70 20 M 55 20 L 55 67 L 53 73 L 49 78 L 43 81 L 36 81 L 30 78 L 27 73" ${SW}/>`,
  K: `<path d="M 30 20 L 30 81 M 70 20 L 30 50 L 70 81" ${SW}/>`,
  L: `<path d="M 33 20 L 33 81 L 70 81" ${SW}/>`,
  M: `<path d="M 22 80 L 22 21 L 50 62 L 78 21 L 78 80" ${SW}/>`,
  N: `<path d="M 26 80 L 26 21 L 73 80 L 73 21" ${SW}/>`,
  O: `<path d="M 50 20 L 60 21 L 68 25 L 74 31 L 77 38 L 78 46 L 78 54 L 77 62 L 74 69 L 68 75 L 61 79 L 53 81 L 45 81 L 38 79 L 31 75 L 26 69 L 23 62 L 22 54 L 23 46 L 26 38 L 31 31 L 38 25 L 46 21 L 50 20 Z" ${SW}/>`,
  P: `<path d="M 30 81 L 30 20 M 30 20 L 52 20 L 62 23 L 68 28 L 70 35 L 68 43 L 62 48 L 52 50 L 30 50" ${SW}/>`,
  Q: `<path d="M 50 20 L 60 21 L 68 25 L 74 31 L 77 38 L 78 46 L 78 54 L 77 62 L 74 69 L 68 75 L 61 79 L 53 81 L 45 81 L 38 79 L 31 75 L 26 69 L 23 62 L 22 54 L 23 46 L 26 38 L 31 31 L 38 25 L 46 21 L 50 20 Z M 55 67 L 76 86" ${SW}/>`,
  R: `<path d="M 30 81 L 30 20 M 30 20 L 52 20 L 62 23 L 68 28 L 70 35 L 68 43 L 62 48 L 52 50 L 30 50 M 45 50 L 72 81" ${SW}/>`,
  S: `<path d="M 69 28 L 65 23 L 59 20 L 52 19 L 44 20 L 38 23 L 33 28 L 31 34 L 33 40 L 37 44 L 44 48 L 55 51 L 63 55 L 68 60 L 69 66 L 67 72 L 62 77 L 55 80 L 47 81 L 39 80 L 33 77 L 29 73" ${SW}/>`,
  T: `<path d="M 20 20 L 80 20 M 50 20 L 50 81" ${SW}/>`,
  U: `<path d="M 26 20 L 26 62 L 28 70 L 33 76 L 40 80 L 50 81 L 60 80 L 67 76 L 72 70 L 74 62 L 74 20" ${SW}/>`,
  V: `<path d="M 20 20 L 50 81 L 80 20" ${SW}/>`,
  W: `<path d="M 14 20 L 30 81 L 50 38 L 70 81 L 86 20" ${SW}/>`,
  X: `<path d="M 24 20 L 76 81 M 76 20 L 24 81" ${SW}/>`,
  Y: `<path d="M 20 20 L 50 52 L 80 20 M 50 52 L 50 81" ${SW}/>`,
  Z: `<path d="M 23 20 L 77 20 L 23 81 L 77 81" ${SW}/>`,
  a: `<path d="M 65 40 L 65 68 M 65 45 L 62 40 L 57 36 L 51 34 L 44 34 L 38 37 L 34 41 L 32 47 L 32 53 L 34 59 L 38 63 L 44 66 L 51 68 L 57 67 L 62 64 L 65 59" ${SW}/>`,
  b: `<path d="M 33 20 L 33 68 M 33 45 L 36 40 L 41 36 L 47 34 L 54 34 L 60 37 L 65 41 L 67 47 L 67 53 L 65 59 L 60 63 L 54 66 L 47 68 L 41 67 L 36 64 L 33 59" ${SW}/>`,
  c: `<path d="M 65 43 L 61 38 L 55 34 L 49 33 L 43 34 L 37 37 L 33 42 L 31 48 L 31 54 L 33 60 L 37 65 L 43 68 L 49 69 L 55 68 L 61 65 L 65 60" ${SW}/>`,
  d: `<path d="M 67 20 L 67 68 M 67 45 L 64 40 L 59 36 L 53 34 L 46 34 L 40 37 L 35 41 L 33 47 L 33 53 L 35 59 L 40 63 L 46 66 L 53 68 L 59 67 L 64 64 L 67 59" ${SW}/>`,
  e: `<path d="M 31 50 L 67 50 L 66 44 L 63 39 L 58 35 L 52 33 L 45 33 L 39 36 L 34 41 L 32 47 L 32 54 L 34 60 L 39 65 L 45 68 L 53 69 L 59 68 L 64 65 L 68 61" ${SW}/>`,
  f: `<path d="M 65 22 L 61 20 L 56 21 L 52 24 L 50 29 L 50 68 M 38 36 L 62 36" ${SW}/>`,
  g: `<path d="M 65 40 L 65 75 L 63 82 L 58 87 L 51 89 L 43 88 M 65 45 L 62 40 L 57 36 L 51 34 L 44 34 L 38 37 L 34 41 L 32 47 L 32 53 L 34 59 L 38 63 L 44 66 L 51 68 L 57 67 L 62 64 L 65 59" ${SW}/>`,
  h: `<path d="M 33 20 L 33 68 M 33 45 L 37 39 L 43 35 L 50 33 L 56 34 L 61 37 L 65 43 L 65 68" ${SW}/>`,
  i: `<path d="M 50 35 L 50 68 M 50 25 L 50 28" ${SW}/>`,
  j: `<path d="M 55 35 L 55 79 L 53 85 L 49 88 L 44 89 L 38 87 M 55 25 L 55 28" ${SW}/>`,
  k: `<path d="M 33 20 L 33 68 M 63 35 L 33 54 L 64 68" ${SW}/>`,
  l: `<path d="M 50 20 L 50 64 L 52 67 L 55 69" ${SW}/>`,
  m: `<path d="M 27 68 L 27 37 M 27 45 L 31 39 L 37 35 L 44 33 L 50 34 L 55 37 L 57 43 L 57 68 M 57 44 L 61 39 L 67 35 L 73 34 L 73 68" ${SW}/>`,
  n: `<path d="M 32 68 L 32 37 M 32 45 L 36 39 L 42 35 L 49 33 L 55 34 L 61 38 L 65 44 L 65 68" ${SW}/>`,
  o: `<path d="M 49 33 L 55 34 L 61 37 L 66 42 L 68 48 L 68 54 L 66 60 L 61 65 L 55 68 L 49 69 L 43 68 L 37 65 L 32 60 L 30 54 L 30 48 L 32 42 L 37 37 L 43 34 L 49 33 Z" ${SW}/>`,
  p: `<path d="M 33 35 L 33 89 M 33 45 L 36 40 L 41 36 L 47 34 L 54 34 L 60 37 L 65 41 L 67 47 L 67 53 L 65 59 L 60 63 L 54 66 L 47 68 L 41 67 L 36 64 L 33 59" ${SW}/>`,
  q: `<path d="M 67 35 L 67 89 M 67 45 L 64 40 L 59 36 L 53 34 L 46 34 L 40 37 L 35 41 L 33 47 L 33 53 L 35 59 L 40 63 L 46 66 L 53 68 L 59 67 L 64 64 L 67 59" ${SW}/>`,
  r: `<path d="M 33 68 L 33 37 M 33 45 L 37 39 L 43 35 L 49 33 L 55 33" ${SW}/>`,
  s: `<path d="M 63 40 L 59 36 L 53 33 L 47 33 L 41 36 L 38 40 L 40 45 L 45 48 L 54 51 L 60 55 L 63 60 L 60 65 L 54 68 L 47 69 L 40 68 L 35 65" ${SW}/>`,
  t: `<path d="M 50 22 L 50 65 L 52 68 L 56 70 M 37 35 L 63 35" ${SW}/>`,
  u: `<path d="M 33 37 L 33 59 L 35 65 L 40 68 L 47 69 L 54 68 L 59 65 L 63 59 L 65 37 M 65 59 L 65 68" ${SW}/>`,
  v: `<path d="M 32 37 L 50 68 L 68 37" ${SW}/>`,
  w: `<path d="M 26 37 L 38 68 L 50 48 L 62 68 L 74 37" ${SW}/>`,
  x: `<path d="M 33 35 L 67 68 M 67 35 L 33 68" ${SW}/>`,
  y: `<path d="M 33 37 L 50 63 L 67 37 M 50 63 L 48 74 L 44 81 L 38 85 L 32 84" ${SW}/>`,
  z: `<path d="M 33 37 L 67 37 L 33 68 L 67 68" ${SW}/>`,
  "0": `<path d="M 50 20 L 58 21 L 65 25 L 70 31 L 73 38 L 74 46 L 74 54 L 73 62 L 70 69 L 65 75 L 58 79 L 50 81 L 42 79 L 35 75 L 30 69 L 27 62 L 26 54 L 26 46 L 27 38 L 30 31 L 35 25 L 42 21 L 50 20 M 40 30 L 60 70" ${SW}/>`,
  "1": `<path d="M 35 30 L 45 20 L 45 80 M 35 80 L 55 80" ${SW}/>`,
  "2": `<path d="M 28 35 L 30 29 L 34 24 L 40 20 L 47 19 L 54 20 L 60 23 L 64 28 L 66 34 L 65 40 L 62 45 L 56 51 L 48 58 L 38 65 L 29 72 L 24 78 L 23 82 L 70 82" ${SW}/>`,
  "3": `<path d="M 28 22 L 65 22 L 45 48 L 57 49 L 64 53 L 69 58 L 71 65 L 69 72 L 64 77 L 57 80 L 48 81 L 39 80 L 33 77 L 28 73" ${SW}/>`,
  "4": `<path d="M 62 80 L 62 20 L 22 62 L 75 62" ${SW}/>`,
  "5": `<path d="M 68 20 L 30 20 L 26 45 L 33 41 L 41 39 L 50 39 L 58 41 L 65 46 L 68 53 L 67 61 L 63 68 L 56 73 L 48 76 L 39 76 L 32 74 L 27 70" ${SW}/>`,
  "6": `<path d="M 68 28 L 63 22 L 56 20 L 48 20 L 40 23 L 33 29 L 28 37 L 26 46 L 26 55 L 28 64 L 32 71 L 38 76 L 45 79 L 53 80 L 61 79 L 67 75 L 71 69 L 73 62 L 71 55 L 67 50 L 60 46 L 52 44 L 44 44 L 36 46 L 30 50 L 27 56" ${SW}/>`,
  "7": `<path d="M 23 20 L 77 20 L 45 81" ${SW}/>`,
  "8": `<path d="M 50 20 L 58 21 L 65 24 L 69 29 L 70 35 L 68 41 L 63 46 L 55 50 L 47 50 L 39 46 L 32 41 L 30 35 L 31 29 L 35 24 L 41 21 L 50 20 M 55 50 L 64 54 L 70 59 L 72 65 L 70 72 L 65 77 L 58 80 L 50 81 L 42 80 L 35 77 L 30 72 L 28 65 L 30 59 L 36 54 L 47 50" ${SW}/>`,
  "9": `<path d="M 27 72 L 33 78 L 40 81 L 48 81 L 56 79 L 62 75 L 67 68 L 70 60 L 71 51 L 70 42 L 67 35 L 62 29 L 55 24 L 48 21 L 40 21 L 33 24 L 28 29 L 26 35 L 26 42 L 28 49 L 32 55 L 38 59 L 46 62 L 54 63 L 62 61 L 68 57 L 72 51" ${SW}/>`,
  "!": `<path d="M 50 20 L 50 60 M 50 72 L 50 80" ${SW}/>`,
  "?": `<path d="M 30 33 L 32 27 L 37 22 L 44 20 L 52 20 L 59 22 L 64 27 L 66 33 L 65 39 L 61 44 L 55 48 L 50 52 L 50 60 M 50 72 L 50 80" ${SW}/>`,
  "&": `<path d="M 70 75 L 40 40 L 57 25 L 65 35 L 50 55 L 30 75 L 45 78 L 57 75 L 70 66 L 76 55" ${SW}/>`,
  "$": `<path d="M 50 15 L 50 85 M 65 30 L 58 24 L 50 22 L 42 23 L 36 27 L 34 33 L 36 39 L 42 44 L 55 48 L 62 52 L 67 57 L 68 63 L 66 69 L 60 74 L 52 77 L 43 77 L 36 75 L 31 71" ${SW}/>`,
  "@": `<path d="M 55 53 L 52 48 L 47 45 L 42 45 L 38 48 L 36 53 L 36 59 L 38 64 L 42 67 L 47 68 L 52 67 L 56 63 L 57 57 L 57 50 L 55 44 L 51 39 L 45 36 L 38 35 L 31 37 L 25 42 L 22 49 L 21 57 L 23 65 L 27 72 L 33 77 L 41 80 L 50 81 L 60 80 L 68 76 L 74 70 L 77 62 L 77 45" ${SW}/>`,
  "#": `<path d="M 38 18 L 32 82 M 58 18 L 52 82 M 22 38 L 78 38 M 20 62 L 76 62" ${SW}/>`,
  "%": `<path d="M 78 22 L 22 78 M 34 22 L 34 38 L 22 38 L 22 22 L 34 22 M 78 62 L 78 78 L 66 78 L 66 62 L 78 62" ${SW}/>`,
  "*": `<path d="M 50 25 L 50 75 M 26 38 L 74 62 M 74 38 L 26 62" ${SW}/>`,
  "+": `<path d="M 50 22 L 50 78 M 22 50 L 78 50" ${SW}/>`,
  "-": `<path d="M 22 50 L 78 50" ${SW}/>`,
  "=": `<path d="M 22 40 L 78 40 M 22 60 L 78 60" ${SW}/>`,
  "/": `<path d="M 25 85 L 75 15" ${SW}/>`,
  ":": `<path d="M 50 35 L 50 40 M 50 60 L 50 65" ${SW}/>`,
  ";": `<path d="M 50 35 L 50 40 M 50 60 Q 50 70 40 80" ${SW}/>`,
  ".": `<path d="M 50 72 L 50 80" ${SW}/>`,
  ",": `<path d="M 50 72 Q 50 80 42 87" ${SW}/>`,
  "(": `<path d="M 62 18 Q 32 50 62 82" ${SW}/>`,
  ")": `<path d="M 38 18 Q 68 50 38 82" ${SW}/>`,
  "[": `<path d="M 60 18 L 40 18 L 40 82 L 60 82" ${SW}/>`,
  "]": `<path d="M 40 18 L 60 18 L 60 82 L 40 82" ${SW}/>`,
  "{": `<path d="M 62 18 Q 48 18 48 35 Q 48 50 35 50 Q 48 50 48 65 Q 48 82 62 82" ${SW}/>`,
  "}": `<path d="M 38 18 Q 52 18 52 35 Q 52 50 65 50 Q 52 50 52 65 Q 52 82 38 82" ${SW}/>`,
  "<": `<path d="M 72 20 L 28 50 L 72 80" ${SW}/>`,
  ">": `<path d="M 28 20 L 72 50 L 28 80" ${SW}/>`,
};

const getGlyphBounds = (svgString) => {
  const fallback = { minX: 0, maxX: 50, gridWidth: 100, gridHeight: 100, isEmpty: true };
  if (!svgString || !svgString.trim()) return fallback;
  const vbMatch = svgString.match(/viewBox=["']([^"']+)["']/i);
  const vbParts = vbMatch ? vbMatch[1].split(/\s+/).map(Number) : [0, 0, 100, 100];
  const gridWidth = vbParts[2] || 100;
  const gridHeight = vbParts[3] || 100;
  let minX = Infinity; let maxX = -Infinity;
  const pathPattern = /<path[^>]*d=["']([^"']+)["'][^>]*>/gi;
  for (const match of svgString.matchAll(pathPattern)) {
    const d = match[1];
    const regex = /([MmLlHhVvQqCcZz])\s*([0-9eE\s,.-]*)/g;
    let cmdMatch; let currX = 0; let currY = 0;
    while ((cmdMatch = regex.exec(d)) !== null) {
      const cmd = cmdMatch[1];
      const args = (cmdMatch[2].match(/-?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g) || []).map(Number);
      const U = cmd.toUpperCase();
      if (U === 'M' || U === 'L') {
        const rel = cmd === 'm' || cmd === 'l';
        for (let i = 0; i < args.length - 1; i += 2) {
          let x = args[i] + (rel ? currX : 0); let y = args[i+1] + (rel ? currY : 0);
          currX = x; currY = y; minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        }
      } else if (U === 'H') { for (const a of args) { currX = a + (cmd === 'h' ? currX : 0); minX = Math.min(minX, currX); maxX = Math.max(maxX, currX); } }
      else if (U === 'Q') { const rel = cmd === 'q'; for (let i = 0; i < args.length - 3; i += 4) { let cx = args[i]+(rel?currX:0), x = args[i+2]+(rel?currX:0); minX = Math.min(minX,cx,x); maxX = Math.max(maxX,cx,x); currX=x; currY=args[i+3]+(rel?currY:0); } }
      else if (U === 'C') { const rel = cmd === 'c'; for (let i = 0; i < args.length - 5; i += 6) { let c1x=args[i]+(rel?currX:0), c2x=args[i+2]+(rel?currX:0), x=args[i+4]+(rel?currX:0); minX=Math.min(minX,c1x,c2x,x); maxX=Math.max(maxX,c1x,c2x,x); currX=x; currY=args[i+5]+(rel?currY:0); } }
    }
  }
  if (minX === Infinity || maxX === -Infinity) return fallback;
  return { minX, maxX, gridWidth, gridHeight, isEmpty: false };
};

const makeExportPath = (opentypeLib, art) => {
  const path = new opentypeLib.Path();
  if (!art.svg) return path;
  const viewBox = art.svg.match(/viewBox=["']([^"']+)["']/i)?.[1];
  const viewParts = viewBox?.split(/\s+/).map(Number) ?? [0, 0, 100, 100];
  const [, , viewWidth = 100, viewHeight = 100] = viewParts;
  const scale = (art.scale / 100) * (700 / Math.max(viewWidth, viewHeight, 1));
  const rotate = (art.rotation * Math.PI) / 180;
  const centerX = viewWidth / 2; const centerY = viewHeight / 2;
  const xShift = art._xShift ?? 0;
  const tf = (x, y) => {
    const rx = x - centerX; const ry = y - centerY;
    const tx = rx * Math.cos(rotate) - ry * Math.sin(rotate) + centerX;
    const ty = rx * Math.sin(rotate) + ry * Math.cos(rotate) + centerY;
    return { x: 150 + xShift + (tx - viewParts[0]) * scale + art.x * 5, y: 790 - (ty - viewParts[1]) * scale - art.y * 5 };
  };
  const dCircle = (cx, cy, r) => {
    const k = r * 0.5522848;
    path.moveTo(cx, cy - r);
    path.bezierCurveTo(cx+k,cy-r,cx+r,cy-k,cx+r,cy); path.bezierCurveTo(cx+r,cy+k,cx+k,cy+r,cx,cy+r);
    path.bezierCurveTo(cx-k,cy+r,cx-r,cy+k,cx-r,cy); path.bezierCurveTo(cx-r,cy-k,cx-k,cy-r,cx,cy-r);
    path.close();
  };
  for (const match of art.svg.matchAll(/<path[^>]*d=["']([^"']+)["'][^>]*>/gi)) {
    const d = match[1];
    const isStroke = match[0].includes('fill="none"') || match[0].includes("fill='none'");
    const swm = match[0].match(/stroke-width=["']?(\d*\.?\d+)["']?/);
    const thickness = (isStroke && swm) ? Number(swm[1]) * scale : 0;
    const contours = []; let cc = null; let cx2=0,cy2=0,sx=0,sy=0; let lp={x:0,y:0};
    for (const [,cmd,argsRaw] of d.matchAll(/([MmLlHhVvQqCcZz])\s*([0-9eE\s,.-]*)/g)) {
      const args = (argsRaw.match(/-?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g)||[]).map(Number);
      const U = cmd.toUpperCase(); const rel = cmd === cmd.toLowerCase() && U !== 'Z';
      if (U==='M') { for(let i=0;i<args.length-1;i+=2){let x=args[i]+(i&&rel?cx2:0),y=args[i+1]+(i&&rel?cy2:0); if(!i){sx=x;sy=y;if(cc)contours.push(cc);const pt=tf(x,y);cc={startPt:pt,segments:[],closed:false};lp=pt;}else if(cc){const pt=tf(x,y);cc.segments.push({type:'L',start:lp,end:pt});lp=pt;}cx2=x;cy2=args[i+1]+(i&&rel?cy2:0);} }
      else if(U==='L'){for(let i=0;i<args.length-1;i+=2){let x=args[i]+(rel?cx2:0),y=args[i+1]+(rel?cy2:0);cx2=x;cy2=y;const pt=tf(x,y);if(cc)cc.segments.push({type:'L',start:lp,end:pt});lp=pt;}}
      else if(U==='H'){for(const a of args){cx2=a+(rel?cx2:0);const pt=tf(cx2,cy2);if(cc)cc.segments.push({type:'L',start:lp,end:pt});lp=pt;}}
      else if(U==='V'){for(const a of args){cy2=a+(rel?cy2:0);const pt=tf(cx2,cy2);if(cc)cc.segments.push({type:'L',start:lp,end:pt});lp=pt;}}
      else if(U==='Q'){for(let i=0;i<args.length-3;i+=4){let qcx=args[i]+(rel?cx2:0),qcy=args[i+1]+(rel?cy2:0),qx=args[i+2]+(rel?cx2:0),qy=args[i+3]+(rel?cy2:0);cx2=qx;cy2=qy;const c1=tf(qcx,qcy),pt=tf(qx,qy);if(cc)cc.segments.push({type:'Q',start:lp,end:pt,c1});lp=pt;}}
      else if(U==='C'){for(let i=0;i<args.length-5;i+=6){let c1x=args[i]+(rel?cx2:0),c1y=args[i+1]+(rel?cy2:0),c2x=args[i+2]+(rel?cx2:0),c2y=args[i+3]+(rel?cy2:0),ex=args[i+4]+(rel?cx2:0),ey=args[i+5]+(rel?cy2:0);cx2=ex;cy2=ey;const c1=tf(c1x,c1y),c2=tf(c2x,c2y),pt=tf(ex,ey);if(cc)cc.segments.push({type:'C',start:lp,end:pt,c1,c2});lp=pt;}}
      else if(U==='Z'){cx2=sx;cy2=sy;if(cc){cc.closed=true;const sp=cc.startPt;if(Math.hypot(lp.x-sp.x,lp.y-sp.y)>0.01)cc.segments.push({type:'L',start:lp,end:sp});lp=sp;}}
    }
    if(cc)contours.push(cc);
    if(thickness>0){
      contours.forEach(contour=>{
        const pts=[{x:contour.startPt.x,y:contour.startPt.y}];
        contour.segments.forEach(seg=>{
          if(seg.type==='L')pts.push(seg.end);
          else if(seg.type==='Q'&&seg.c1){for(let s=1;s<=8;s++){const t=s/8,u=1-t;pts.push({x:u*u*seg.start.x+2*u*t*seg.c1.x+t*t*seg.end.x,y:u*u*seg.start.y+2*u*t*seg.c1.y+t*t*seg.end.y});}}
          else if(seg.type==='C'&&seg.c1&&seg.c2){for(let s=1;s<=8;s++){const t=s/8,u=1-t;pts.push({x:u*u*u*seg.start.x+3*u*u*t*seg.c1.x+3*u*t*t*seg.c2.x+t*t*t*seg.end.x,y:u*u*u*seg.start.y+3*u*u*t*seg.c1.y+3*u*t*t*seg.c2.y+t*t*t*seg.end.y});}}
        });
        const fp=[];pts.forEach(p=>{if(fp.length===0||Math.hypot(p.x-fp[fp.length-1].x,p.y-fp[fp.length-1].y)>0.05)fp.push(p);});
        if(fp.length===0)return; const nP=fp.length; const r=thickness/2;
        if(nP===1){dCircle(fp[0].x,fp[0].y,r);return;}
        const normals=[];for(let i=0;i<nP;i++){let vx,vy;if(i===0){vx=fp[1].x-fp[0].x;vy=fp[1].y-fp[0].y;}else if(i===nP-1){vx=fp[nP-1].x-fp[nP-2].x;vy=fp[nP-1].y-fp[nP-2].y;}else{const l1=Math.hypot(fp[i].x-fp[i-1].x,fp[i].y-fp[i-1].y)||1;const l2=Math.hypot(fp[i+1].x-fp[i].x,fp[i+1].y-fp[i].y)||1;vx=(fp[i].x-fp[i-1].x)/l1+(fp[i+1].x-fp[i].x)/l2;vy=(fp[i].y-fp[i-1].y)/l1+(fp[i+1].y-fp[i].y)/l2;}const len=Math.hypot(vx,vy);normals.push(len<0.001?{x:0,y:1}:{x:-vy/len,y:vx/len});}
        const L=fp.map((p,i)=>({x:p.x+normals[i].x*r,y:p.y+normals[i].y*r}));
        const R=fp.map((p,i)=>({x:p.x-normals[i].x*r,y:p.y-normals[i].y*r}));
        path.moveTo(L[0].x,L[0].y);for(let i=1;i<nP;i++)path.lineTo(L[i].x,L[i].y);
        // End cap — semicircle at end of stroke (matching generate_handwrite_86.js)
        const ea=Math.atan2(fp[nP-1].y-fp[nP-2].y,fp[nP-1].x-fp[nP-2].x)+Math.PI/2;
        for(let s=1;s<=4;s++){const a=ea-s*(Math.PI/4);path.lineTo(fp[nP-1].x+r*Math.cos(a),fp[nP-1].y+r*Math.sin(a));}
        for(let i=nP-1;i>=0;i--)path.lineTo(R[i].x,R[i].y);
        // Start cap — semicircle at start of stroke
        const sa=Math.atan2(fp[1].y-fp[0].y,fp[1].x-fp[0].x)-Math.PI/2;
        for(let s=1;s<=4;s++){const a=sa+s*(Math.PI/4);path.lineTo(fp[0].x+r*Math.cos(a),fp[0].y+r*Math.sin(a));}
        path.close();
      });
    } else {
      contours.forEach(contour=>{
        if(!contour.segments.length)return;
        path.moveTo(contour.startPt.x,contour.startPt.y);
        contour.segments.forEach(seg=>{
          if(seg.type==='L')path.lineTo(seg.end.x,seg.end.y);
          else if(seg.type==='Q'&&seg.c1)path.quadraticCurveTo(seg.c1.x,seg.c1.y,seg.end.x,seg.end.y);
          else if(seg.type==='C'&&seg.c1&&seg.c2)path.bezierCurveTo(seg.c1.x,seg.c1.y,seg.c2.x,seg.c2.y,seg.end.x,seg.end.y);
        });
        if(contour.closed)path.close();
      });
    }
  }
  return path;
};

async function run() {
  const glyphMap = {};
  for (const letter of glyphsList) {
    const existing = existingGlyphs[letter];
    const hasContent = existing && existing.svg && existing.svg.trim().length > 10;
    if (hasContent) {
      // Normalize user glyph scale to 90 so it matches generated glyphs
      glyphMap[letter] = { ...existing, scale: 90 };
      console.log(`✅ '${letter}' — user glyph preserved (scale normalized to 90)`);
    } else if (rawGlyphs[letter]) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">${rawGlyphs[letter]}</svg>`;
      glyphMap[letter] = { svg, rotation: 0, scale: 90, x: 0, y: 0, kerning: 0 };
      console.log(`✏️  '${letter}' — generated`);
    } else {
      glyphMap[letter] = { svg: "", rotation: 0, scale: 90, x: 0, y: 0, kerning: 0 };
      console.log(`⚠️  '${letter}' — missing`);
    }
  }

  // Save project
  const projectData = {
    fontName: rawProject.fontName || "NulisAja",
    fontDesigner: rawProject.fontDesigner || "",
    fontStyle: "Regular",
    fontVersion: "1.0.0",
    fontLicense: "SIL Open Font License",
    glyphMap,
    activeGlyph: "A",
    brickGrids: {},
    kerningPairs: rawProject.kerningPairs || {},
    snapToGrid: false,
    gridSnapSize: 2.5,
    penType: "round",
    penAngle: 45,
  };
  fs.writeFileSync("/Users/rano/Downloads/nulisaja.draftype", JSON.stringify(projectData, null, 2));
  console.log("\n📁 Saved nulisaja.draftype");

  // Export OTF
  const exportedGlyphs = [
    new opentype.Glyph({ name: ".notdef", advanceWidth: 650 }),
    new opentype.Glyph({ name: "space", unicode: 32, advanceWidth: 380 }),
    ...Object.entries(glyphMap).map(([letter, art]) => {
      const bounds = getGlyphBounds(art.svg);
      const gsf = (art.scale / 100) * (700 / Math.max(bounds.gridWidth, bounds.gridHeight, 1));
      const lsb = 70;
      const xShift = lsb - (150 + bounds.minX * gsf);
      const cw = (bounds.maxX - bounds.minX) * gsf;
      const aw = bounds.isEmpty ? 650 : Math.round(lsb + cw + lsb) + (art.kerning ?? 0) * 8;
      return new opentype.Glyph({
        name: `glyph-${letter.charCodeAt(0)}`,
        unicode: letter.charCodeAt(0),
        advanceWidth: Math.max(100, aw),
        path: art.svg ? makeExportPath(opentype, { ...art, _xShift: xShift }) : undefined,
      });
    }),
  ];

  const font = new opentype.Font({
    familyName: "NulisAja",
    styleName: "Regular",
    unitsPerEm: 1000,
    ascender: 850,
    descender: -200,
    glyphs: exportedGlyphs,
  });

  const buf = font.toArrayBuffer();
  fs.writeFileSync("/Users/rano/Downloads/nulisaja.otf", Buffer.from(buf));
  console.log("🔠 Saved nulisaja.otf\n");

  const userGlyphs = Object.entries(glyphMap).filter(([,v]) => {
    const existing = existingGlyphs[Object.keys(glyphsList)[0]];
    return existing && existing.svg && existing.svg.length > 10;
  });
  console.log(`Total: ${Object.keys(glyphMap).length} glyphs`);
}

run().catch(console.error);
