import { GlyphArt, DrawPoint, MagicAction } from "./types";
import { ReactNode } from "react";

export const glyphs: string[] = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."0123456789",
  ..."!?&$@#%*+-=/:;.,()[]{}<>"
];

export interface FingerTool {
  id: "move" | "node" | "hand" | "brush" | "pen" | "eraser" | "fill" | "line" | "rect" | "ellipse";
  label: string;
  hint: string;
}

export const fingerTools: FingerTool[] = [
  {
    id: "move",
    label: "Pindah",
    hint: "Pindahkan gambar di dalam kotak glyph",
  },
  {
    id: "node",
    label: "Titik",
    hint: "Pilih dan geser titik/node pada gambar",
  },
  {
    id: "hand",
    label: "Geser",
    hint: "Geser area kanvas",
  },
  {
    id: "brush",
    label: "Kuas",
    hint: "Gambar coretan bebas",
  },
  {
    id: "pen",
    label: "Pena",
    hint: "Klik atau seret untuk membuat titik kurva",
  },
  {
    id: "line",
    label: "Garis",
    hint: "Tarik garis lurus dari satu titik ke titik lain",
  },
  {
    id: "rect",
    label: "Kotak",
    hint: "Buat bentuk kotak persegi panjang",
  },
  {
    id: "ellipse",
    label: "Elips",
    hint: "Buat bentuk lingkaran atau elips",
  },
  {
    id: "eraser",
    label: "Penghapus",
    hint: "Hapus titik-titik terdekat",
  },
  {
    id: "fill",
    label: "Isi",
    hint: "Warnai bentuk saat ini dengan warna hitam",
  },
];

export const emptyGlyph = (): GlyphArt => ({
  svg: "",
  rotation: 0,
  scale: 120,
  x: 0,
  y: 0,
  kerning: 0,
});

export const makePixelSvg = (cells: string[], viewBox: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox} ${viewBox}" fill="none"><g fill="currentColor">${cells.join(
    ""
  )}</g></svg>`;

export const makeImageSvg = (dataUrl: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><image href="${dataUrl}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/></svg>`;

export const samplePixelGlyph: string = makePixelSvg(
  [
    '<rect x="18" y="10" width="10" height="10"/>',
    '<rect x="28" y="10" width="10" height="10"/>',
    '<rect x="38" y="10" width="10" height="10"/>',
    '<rect x="12" y="20" width="10" height="10"/>',
    '<rect x="48" y="20" width="10" height="10"/>',
    '<rect x="12" y="30" width="10" height="10"/>',
    '<rect x="22" y="30" width="10" height="10"/>',
    '<rect x="32" y="30" width="10" height="10"/>',
    '<rect x="42" y="30" width="10" height="10"/>',
    '<rect x="52" y="30" width="10" height="10"/>',
    '<rect x="12" y="40" width="10" height="10"/>',
    '<rect x="52" y="40" width="10" height="10"/>',
    '<rect x="12" y="50" width="10" height="10"/>',
    '<rect x="52" y="50" width="10" height="10"/>',
  ],
  70
);

export const cleanSvg = (source: string): string =>
  source
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");

export const smoothPoints = (points: DrawPoint[], strength: number): DrawPoint[] => {
  if (strength <= 0 || points.length < 3) return points;
  const passes = Math.max(1, Math.round(strength / 18));
  let current = points;
  for (let pass = 0; pass < passes; pass += 1) {
    current = current.map((point, index) => {
      if (point.move || index === 0 || index === current.length - 1) return point;
      const prev = current[index - 1];
      const next = current[index + 1];
      if (next.move) return point;
      const amount = Math.min(0.82, strength / 100);
      return {
        ...point,
        x: Math.round((point.x * (1 - amount) + ((prev.x + next.x) / 2) * amount) * 100) / 100,
        y: Math.round((point.y * (1 - amount) + ((prev.y + next.y) / 2) * amount) * 100) / 100,
      };
    });
  }
  return current;
};

export const pathFromPoints = (points: DrawPoint[]): string =>
  points
    .map((point) => {
      if (point.move) return `M${point.x} ${point.y}`;
      if (point.curve && point.cx !== undefined && point.cy !== undefined) {
        return `Q${point.cx} ${point.cy} ${point.x} ${point.y}`;
      }
      return `L${point.x} ${point.y}`;
    })
    .join(" ");

export const pointsFromPath = (pathStr: string): DrawPoint[] => {
  const points: DrawPoint[] = [];
  const tokenRegex = /([MQLCCSsTTtAAaZzHhVv])|(-?[0-9.]+(?:[eE][-+]?[0-9]+)?)/g;
  const tokens: string[] = [];
  let match;
  while ((match = tokenRegex.exec(pathStr)) !== null) {
    tokens.push(match[0]);
  }

  let currX = 0;
  let currY = 0;
  let startX = 0;
  let startY = 0;
  let lastCmd = "";

  let i = 0;
  while (i < tokens.length) {
    let cmd = tokens[i];
    const args: number[] = [];
    
    if (/^[A-Za-z]$/.test(cmd)) {
      lastCmd = cmd;
      i++;
      while (i < tokens.length && !/^[A-Za-z]$/.test(tokens[i])) {
        args.push(Number(tokens[i]));
        i++;
      }
    } else {
      cmd = lastCmd;
      if (!cmd) {
        i++;
        continue;
      }
      while (i < tokens.length && !/^[A-Za-z]$/.test(tokens[i])) {
        args.push(Number(tokens[i]));
        i++;
      }
    }

    if (cmd === 'M' || cmd === 'm') {
      const isRelative = cmd === 'm';
      for (let k = 0; k < args.length; k += 2) {
        if (k + 1 >= args.length) break;
        let x = args[k];
        let y = args[k+1];
        if (isRelative) {
          x += currX;
          y += currY;
        }
        currX = x;
        currY = y;
        if (k === 0) {
          startX = x;
          startY = y;
          points.push({ x, y, move: true });
        } else {
          points.push({ x, y, move: false });
        }
      }
      if (cmd === 'm') lastCmd = 'l';
      else if (cmd === 'M') lastCmd = 'L';
    } else if (cmd === 'L' || cmd === 'l') {
      const isRelative = cmd === 'l';
      for (let k = 0; k < args.length; k += 2) {
        if (k + 1 >= args.length) break;
        let x = args[k];
        let y = args[k+1];
        if (isRelative) {
          x += currX;
          y += currY;
        }
        currX = x;
        currY = y;
        points.push({ x, y, move: false });
      }
    } else if (cmd === 'H' || cmd === 'h') {
      const isRelative = cmd === 'h';
      for (let k = 0; k < args.length; k++) {
        let x = args[k];
        if (isRelative) x += currX;
        currX = x;
        points.push({ x, y: currY, move: false });
      }
    } else if (cmd === 'V' || cmd === 'v') {
      const isRelative = cmd === 'v';
      for (let k = 0; k < args.length; k++) {
        let y = args[k];
        if (isRelative) y += currY;
        currY = y;
        points.push({ x: currX, y, move: false });
      }
    } else if (cmd === 'Q' || cmd === 'q') {
      const isRelative = cmd === 'q';
      for (let k = 0; k < args.length; k += 4) {
        if (k + 3 >= args.length) break;
        let cx = args[k];
        let cy = args[k+1];
        let x = args[k+2];
        let y = args[k+3];
        if (isRelative) {
          cx += currX;
          cy += currY;
          x += currX;
          y += currY;
        }
        currX = x;
        currY = y;
        points.push({ x, y, cx, cy, curve: true, move: false });
      }
    } else if (cmd === 'C' || cmd === 'c') {
      const isRelative = cmd === 'c';
      for (let k = 0; k < args.length; k += 6) {
        if (k + 5 >= args.length) break;
        let cx = args[k+2];
        let cy = args[k+3];
        let x = args[k+4];
        let y = args[k+5];
        if (isRelative) {
          cx += currX;
          cy += currY;
          x += currX;
          y += currY;
        }
        currX = x;
        currY = y;
        points.push({ x, y, cx, cy, curve: true, move: false });
      }
    } else if (cmd === 'S' || cmd === 's') {
      const isRelative = cmd === 's';
      for (let k = 0; k < args.length; k += 4) {
        if (k + 3 >= args.length) break;
        let cx = args[k];
        let cy = args[k+1];
        let x = args[k+2];
        let y = args[k+3];
        if (isRelative) {
          cx += currX;
          cy += currY;
          x += currX;
          y += currY;
        }
        currX = x;
        currY = y;
        points.push({ x, y, cx, cy, curve: true, move: false });
      }
    } else if (cmd === 'T' || cmd === 't') {
      const isRelative = cmd === 't';
      for (let k = 0; k < args.length; k += 2) {
        if (k + 1 >= args.length) break;
        let x = args[k];
        let y = args[k+1];
        if (isRelative) {
          x += currX;
          y += currY;
        }
        currX = x;
        currY = y;
        points.push({ x, y, curve: true, move: false });
      }
    } else if (cmd === 'A' || cmd === 'a') {
      const isRelative = cmd === 'a';
      for (let k = 0; k < args.length; k += 7) {
        if (k + 6 >= args.length) break;
        let x = args[k+5];
        let y = args[k+6];
        if (isRelative) {
          x += currX;
          y += currY;
        }
        currX = x;
        currY = y;
        points.push({ x, y, move: false });
      }
    } else if (cmd === 'Z' || cmd === 'z') {
      currX = startX;
      currY = startY;
      points.push({ x: startX, y: startY, move: false });
    }
  }
  return points;
};

interface TransformMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

const multiplyMatrices = (m1: TransformMatrix, m2: TransformMatrix): TransformMatrix => {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  };
};

const getElementTransformMatrix = (el: Element): TransformMatrix => {
  let currentMatrix: TransformMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const transformAttr = el.getAttribute("transform");
  if (!transformAttr) return currentMatrix;

  const regex = /(translate|scale|rotate|matrix)\s*\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(transformAttr)) !== null) {
    const type = match[1];
    const args = match[2].trim().split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
    let stepMatrix: TransformMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

    if (type === "translate") {
      const tx = args[0] || 0;
      const ty = args[1] || 0;
      stepMatrix.e = tx;
      stepMatrix.f = ty;
    } else if (type === "scale") {
      const sx = args[0] ?? 1;
      const sy = args[1] ?? sx;
      stepMatrix.a = sx;
      stepMatrix.d = sy;
    } else if (type === "rotate") {
      const angle = ((args[0] || 0) * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      stepMatrix.a = cos;
      stepMatrix.b = sin;
      stepMatrix.c = -sin;
      stepMatrix.d = cos;
      if (args.length >= 3) {
        const cx = args[1];
        const cy = args[2];
        const t1: TransformMatrix = { a: 1, b: 0, c: 0, d: 1, e: -cx, f: -cy };
        const t2: TransformMatrix = { a: 1, b: 0, c: 0, d: 1, e: cx, f: cy };
        stepMatrix = multiplyMatrices(t2, multiplyMatrices(stepMatrix, t1));
      }
    } else if (type === "matrix") {
      if (args.length >= 6) {
        stepMatrix.a = args[0];
        stepMatrix.b = args[1];
        stepMatrix.c = args[2];
        stepMatrix.d = args[3];
        stepMatrix.e = args[4];
        stepMatrix.f = args[5];
      }
    }
    currentMatrix = multiplyMatrices(currentMatrix, stepMatrix);
  }
  return currentMatrix;
};

const getCumulativeMatrix = (pathEl: Element): TransformMatrix => {
  let matrix: TransformMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  let current: Element | null = pathEl;
  while (current && current.tagName.toLowerCase() !== "svg") {
    const elMatrix = getElementTransformMatrix(current);
    matrix = multiplyMatrices(elMatrix, matrix);
    current = current.parentElement;
  }
  return matrix;
};

export const pointsFromSvg = (svgString: string): DrawPoint[] => {
  if (typeof window === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgEl = doc.querySelector("svg");
  if (!svgEl) return [];

  const viewBoxAttr = svgEl.getAttribute("viewBox");
  let scaleX = 1;
  let scaleY = 1;
  if (viewBoxAttr) {
    const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
    if (parts.length >= 4) {
      const w = parts[2];
      const h = parts[3];
      if (w > 0 && h > 0) {
        scaleX = 100 / w;
        scaleY = 100 / h;
      }
    }
  }

  const points: DrawPoint[] = [];

  const rects = doc.querySelectorAll("rect");
  rects.forEach((rect) => {
    if (
      rect.classList.contains("draw-bg") ||
      (rect.getAttribute("width") === "100" && rect.getAttribute("height") === "100")
    ) {
      return;
    }
    const matrix = getCumulativeMatrix(rect);
    const x0 = parseFloat(rect.getAttribute("x") || "0");
    const y0 = parseFloat(rect.getAttribute("y") || "0");
    const rw = parseFloat(rect.getAttribute("width") || "0");
    const rh = parseFloat(rect.getAttribute("height") || "0");

    const tx = (px: number, py: number) => ({
      x: (matrix.a * px + matrix.c * py + matrix.e) * scaleX,
      y: (matrix.b * px + matrix.d * py + matrix.f) * scaleY,
    });

    const p1 = tx(x0, y0);
    const p2 = tx(x0 + rw, y0);
    const p3 = tx(x0 + rw, y0 + rh);
    const p4 = tx(x0, y0 + rh);

    points.push({ ...p1, move: true });
    points.push({ ...p2, move: false });
    points.push({ ...p3, move: false });
    points.push({ ...p4, move: false });
    points.push({ ...p1, move: false });
  });

  const paths = doc.querySelectorAll("path");
  paths.forEach((path) => {
    const d = path.getAttribute("d");
    if (d) {
      const parsedPathPoints = pointsFromPath(d);
      const matrix = getCumulativeMatrix(path);

      parsedPathPoints.forEach((pt) => {
        const rawX = pt.x;
        const rawY = pt.y;
        pt.x = matrix.a * rawX + matrix.c * rawY + matrix.e;
        pt.y = matrix.b * rawX + matrix.d * rawY + matrix.f;

        if (pt.cx !== undefined && pt.cy !== undefined) {
          const rawCx = pt.cx;
          const rawCy = pt.cy;
          pt.cx = matrix.a * rawCx + matrix.c * rawCy + matrix.e;
          pt.cy = matrix.b * rawCx + matrix.d * rawCy + matrix.f;
        }

        pt.x *= scaleX;
        pt.y *= scaleY;
        if (pt.cx !== undefined) pt.cx *= scaleX;
        if (pt.cy !== undefined) pt.cy *= scaleY;
      });
      points.push(...parsedPathPoints);
    }
  });

  return points;
};

// ─── Bounding box extraction (works on SSR via regex) ────────────────────────

export interface GlyphBounds {
  minX: number;
  maxX: number;
  gridWidth: number;
  gridHeight: number;
  isEmpty: boolean;
}

export const getGlyphBounds = (svgString: string | undefined): GlyphBounds => {
  const fallback: GlyphBounds = { minX: 0, maxX: 16, gridWidth: 16, gridHeight: 16, isEmpty: true };
  if (!svgString || !svgString.trim()) return fallback;

  const vbMatch = svgString.match(/viewBox=["']0\s+0\s+([\d.]+)\s+([\d.]+)["']/i);
  const gridWidth = vbMatch ? parseFloat(vbMatch[1]) : 16;
  const gridHeight = vbMatch ? parseFloat(vbMatch[2]) : 16;

  // 1. Client-side browser calculation using native getBBox() for 100% accuracy
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.visibility = "hidden";
      container.style.width = "0";
      container.style.height = "0";
      container.style.overflow = "hidden";
      container.innerHTML = svgString.trim();
      
      const svgEl = container.querySelector("svg");
      if (svgEl) {
        document.body.appendChild(container);
        
        const elements = svgEl.querySelectorAll("rect, path, ellipse, circle, polygon, polyline");
        let minX = Infinity;
        let maxX = -Infinity;
        let hasContent = false;
        
        elements.forEach((el) => {
          const fill = el.getAttribute("fill")?.toLowerCase();
          const stroke = el.getAttribute("stroke")?.toLowerCase();
          const style = el.getAttribute("style")?.toLowerCase() || "";
          
          // Skip white/transparent elements
          const isWhite = fill === "#ffffff" || fill === "white" || fill === "#fff" || fill === "#ffffff" ||
                          stroke === "#ffffff" || stroke === "white" || stroke === "#fff" ||
                          style.includes("fill:#ffffff") || style.includes("fill:white") ||
                          style.includes("stroke:#ffffff") || style.includes("stroke:white");
                          
          const isTransparent = fill === "none" && (stroke === "none" || !stroke);
          
          if (!isWhite && !isTransparent && typeof (el as any).getBBox === "function") {
            const bbox = (el as any).getBBox();
            if (bbox.width > 0 || bbox.height > 0) {
              const strokeWidthAttr = el.getAttribute("stroke-width");
              const strokeWidth = strokeWidthAttr ? parseFloat(strokeWidthAttr) : 0;
              const halfStroke = strokeWidth / 2;
              
              // Apply Cumulative Transform Matrix (CTM) to get coordinates in SVG viewport space
              const ctm = (el as any).getCTM();
              let elMinX = bbox.x - halfStroke;
              let elMaxX = bbox.x + bbox.width + halfStroke;
              
              if (ctm && typeof svgEl.createSVGPoint === "function") {
                const pt1 = svgEl.createSVGPoint();
                pt1.x = bbox.x - halfStroke;
                pt1.y = bbox.y;
                const t1 = pt1.matrixTransform(ctm);
                
                const pt2 = svgEl.createSVGPoint();
                pt2.x = bbox.x + bbox.width + halfStroke;
                pt2.y = bbox.y;
                const t2 = pt2.matrixTransform(ctm);
                
                const pt3 = svgEl.createSVGPoint();
                pt3.x = bbox.x - halfStroke;
                pt3.y = bbox.y + bbox.height;
                const t3 = pt3.matrixTransform(ctm);
                
                const pt4 = svgEl.createSVGPoint();
                pt4.x = bbox.x + bbox.width + halfStroke;
                pt4.y = bbox.y + bbox.height;
                const t4 = pt4.matrixTransform(ctm);
                
                elMinX = Math.min(t1.x, t2.x, t3.x, t4.x);
                elMaxX = Math.max(t1.x, t2.x, t3.x, t4.x);
              }
              
              minX = Math.min(minX, elMinX);
              maxX = Math.max(maxX, elMaxX);
              hasContent = true;
            }
          }
        });
        
        document.body.removeChild(container);
        
        if (hasContent) {
          return { minX, maxX, gridWidth, gridHeight, isEmpty: false };
        }
      }
    } catch (e) {
      console.error("Browser getBBox failed, falling back to regex parser:", e);
    }
  }

  // 2. SSR Fallback (Regex-based parser)
  let minX = Infinity;
  let maxX = -Infinity;

  // Process rect-based glyphs (for pixel bricks)
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

  // Process path-based glyphs (for freehand/handwriting curves)
  const pathPattern = /<path[^>]*d=["']([^"']+)["'][^>]*>/gi;
  for (const match of svgString.matchAll(pathPattern)) {
    const pathTag = match[0];
    const d = match[1];
    
    // Extract stroke width
    const strokeMatch = pathTag.match(/stroke-?width=["']([\d.]+)["']/i);
    const strokeWidth = strokeMatch ? parseFloat(strokeMatch[1]) : 0;
    const halfStroke = strokeWidth / 2;

    const regex = /([MmLlHhVvQqCcZz])\s*([0-9eE\s,.-]*)/g;
    let cmdMatch;
    let currX = 0;
    let currY = 0;
    let pathMinX = Infinity;
    let pathMaxX = -Infinity;
    
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
          pathMinX = Math.min(pathMinX, currX);
          pathMaxX = Math.max(pathMaxX, currX);
        }
      } else if (cmdUpper === 'H') {
        const isRelative = cmd === 'h';
        for (let i = 0; i < args.length; i++) {
          let x = args[i];
          if (isRelative) x += currX;
          currX = x;
          pathMinX = Math.min(pathMinX, currX);
          pathMaxX = Math.max(pathMaxX, currX);
        }
      } else if (cmdUpper === 'V') {
        const isRelative = cmd === 'v';
        for (let i = 0; i < args.length; i++) {
          let y = args[i];
          if (isRelative) y += currY;
          currY = y;
          pathMinX = Math.min(pathMinX, currX);
          pathMaxX = Math.max(pathMaxX, currX);
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
          pathMinX = Math.min(pathMinX, cx, x);
          pathMaxX = Math.max(pathMaxX, cx, x);
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
          pathMinX = Math.min(pathMinX, cx1, cx2, x);
          pathMaxX = Math.max(pathMaxX, cx1, cx2, x);
          currX = x;
          currY = y;
        }
      }
    }

    if (pathMinX !== Infinity && pathMaxX !== -Infinity) {
      minX = Math.min(minX, pathMinX - halfStroke);
      maxX = Math.max(maxX, pathMaxX + halfStroke);
    }
  }

  if (minX === Infinity || maxX === -Infinity) {
    return fallback;
  }

  return { minX, maxX, gridWidth, gridHeight, isEmpty: false };
};

export const computeGlyphAdvance = (
  art: GlyphArt,
  exportSpacingMode: "proportional" | "monospace",
): { advanceWidth: number; xShift: number } => {
  const bounds = getGlyphBounds(art.svg);
  const unitsPerGrid = 1000 / (bounds.gridWidth || 16);
  const glyphScaleFactor = (art.scale / 100) * (700 / Math.max(bounds.gridWidth, bounds.gridHeight, 1));
  const desiredLSB = 70; // 70 units out of 1000 EM (7% of EM) for balanced spacing

  if (exportSpacingMode === "monospace") {
    return {
      advanceWidth: Math.round(unitsPerGrid * bounds.gridWidth),
      xShift: 0,
    };
  }

  const contentWidthOTF = (bounds.maxX - bounds.minX) * glyphScaleFactor;
  const advanceWidth = bounds.isEmpty
    ? 650
    : Math.round(desiredLSB + contentWidthOTF + desiredLSB) + (art.kerning ?? 0) * 8;

  const naturalLeft = 150 + bounds.minX * glyphScaleFactor;
  const xShiftProportional = desiredLSB - naturalLeft;

  return {
    advanceWidth,
    xShift: xShiftProportional,
  };
};

export const cropSvgToAdvance = (
  svgString: string | undefined,
  sidebearingPercent = 0.06,
): { svg: string; widthRatio: number } => {
  const fallback = { svg: svgString ?? "", widthRatio: 0.65 };
  if (!svgString) return fallback;

  const bounds = getGlyphBounds(svgString);
  if (bounds.isEmpty) return fallback;

  const sidebearing = sidebearingPercent * bounds.gridWidth;
  const viewMinX = bounds.minX - sidebearing;
  const viewWidth = (bounds.maxX - bounds.minX) + sidebearing * 2;

  const croppedSvg = svgString.replace(
    /viewBox=["'][^"']*["']/,
    `viewBox="${viewMinX.toFixed(2)} 0 ${viewWidth.toFixed(2)} ${bounds.gridHeight}"`,
  );

  const widthRatio = viewWidth / bounds.gridHeight;

  return { svg: croppedSvg, widthRatio };
};

// ─── Legacy helper kept for font export ──────────────────────────────────────

export const getGlyphWidth = (svgString: string | undefined, defaultWidth = 65): number => {
  const bounds = getGlyphBounds(svgString);
  if (bounds.isEmpty) return defaultWidth;
  const sidebearing = 1;
  const contentPlusGap = bounds.maxX - bounds.minX + sidebearing * 2;
  // Normalise to [0,100] range (as fraction of gridWidth)
  const ratio = Math.min(1, Math.max(0.25, contentPlusGap / bounds.gridWidth));
  return ratio * 100;
};



const kerningForGlyph = (glyph: string): number => {
  if ("ilI1!|.".includes(glyph)) return -6;
  if (":;,".includes(glyph)) return -4;
  if ("fjr".includes(glyph)) return -3;
  if ("AVYTW".includes(glyph)) return -3;
  if ("PF".includes(glyph)) return -2;
  if ("OQCGDocg".includes(glyph)) return -1;
  if ("MW@#%&".includes(glyph)) return 6;
  return 0;
};

export const applyAutoKerning = (map: Record<string, GlyphArt>): Record<string, GlyphArt> => {
  const next = { ...map };
  Object.keys(next).forEach((glyph) => {
    const item = next[glyph];
    if (!item?.svg) return;
    next[glyph] = { ...item, kerning: kerningForGlyph(glyph) };
  });
  return next;
};

const neatForGlyph = (glyph: string, art: GlyphArt): GlyphArt => {
  // Detect pixel-art BrickType SVGs by checking for square viewBox (e.g. 8x8, 16x16, 32x32)
  const viewBoxMatch = art.svg?.match(/viewBox=["']0 0 (\d+) (\d+)["']/i);
  if (viewBoxMatch) {
    const vbW = parseInt(viewBoxMatch[1]);
    const vbH = parseInt(viewBoxMatch[2]);
    // Square viewBox smaller than 100 indicates pixel-art — use uniform scale for all characters
    if (vbW === vbH && vbW < 100) {
      return {
        ...art,
        scale: 120,
        x: 0,
        y: 0,
        rotation: 0,
      };
    }
  }

  const isUpper = glyph >= "A" && glyph <= "Z";
  const isDigit = glyph >= "0" && glyph <= "9";
  const isLower = glyph >= "a" && glyph <= "z";
  const isAscender = "bdfhklt".includes(glyph);
  const isDescender = "gjpqy".includes(glyph);
  const isFlat = "acemnorsuvwxz".includes(glyph);
  const isSlim = "ilI1!|.:;()[]{}".includes(glyph);
  const isWide = "MW@#%&".includes(glyph);
  let scale = 120;
  let x = 0;
  let y = 0;
  if (isUpper || isDigit) {
    scale = isSlim ? 116 : isWide ? 130 : 124;
    x = isSlim ? -3 : isWide ? 1 : 0;
    y = 0;
  } else if (isLower) {
    if (isAscender) {
      scale = isSlim ? 116 : 122;
      x = isSlim ? -3 : 0;
      y = 1;
    } else if (isDescender) {
      scale = 114;
      x = glyph === "j" ? -4 : 0;
      y = 9;
    } else if (isFlat) {
      scale = 105;
      x = 0;
      y = 7;
    }
  } else {
    scale = isSlim ? 110 : 118;
    x = isSlim ? -2 : 0;
    y = 0;
  }
  return {
    ...art,
    scale,
    x,
    y,
    rotation: 0,
  };
};

export const applyAutoNeatMap = (map: Record<string, GlyphArt>): Record<string, GlyphArt> => {
  const next = { ...map };
  glyphs.forEach((glyph) => {
    const item = next[glyph];
    if (!item?.svg) return;
    next[glyph] = neatForGlyph(glyph, item);
  });
  return applyAutoKerning(next);
};

export const getToolIcon = (id: string): ReactNode => {
  const svgProps = {
    viewBox: "0 0 24 24",
    width: "20",
    height: "20",
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (id) {
    case "move":
      return (
        <svg {...svgProps} stroke="#3b82f6">
          <polyline points="5 9 2 12 5 15" />
          <polyline points="9 5 12 2 15 5" />
          <polyline points="15 19 12 22 9 19" />
          <polyline points="19 9 22 12 19 15" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="12" y1="2" x2="12" y2="22" />
        </svg>
      );
    case "node":
      return (
        <svg {...svgProps} stroke="#8b5cf6">
          <path d="M12 5l-8 8l8 8l8-8z" />
          <circle cx="12" cy="5" r="2" fill="#8b5cf6" />
          <circle cx="4" cy="13" r="2" fill="#fff" />
          <circle cx="20" cy="13" r="2" fill="#fff" />
          <circle cx="12" cy="21" r="2" fill="#fff" />
        </svg>
      );
    case "hand":
      return (
        <svg {...svgProps} stroke="#ea580c">
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      );
    case "brush":
      return (
        <svg {...svgProps} stroke="#ec4899">
          <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
          <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
        </svg>
      );
    case "pen":
      return (
        <svg {...svgProps} stroke="#0d9488">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      );
    case "eraser":
      return (
        <svg {...svgProps} stroke="#e11d48">
          <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
          <path d="M22 21H7" />
          <path d="m5 11 9 9" />
        </svg>
      );
    case "fill":
      return (
        <svg {...svgProps} stroke="#7c3aed">
          <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
          <path d="m5 2 5 5" />
          <path d="M2 13h15" />
          <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
        </svg>
      );
    case "line":
      return (
        <svg {...svgProps} stroke="#059669">
          <line x1="5" y1="19" x2="19" y2="5" />
          <circle cx="5" cy="19" r="2" fill="#fff" />
          <circle cx="19" cy="5" r="2" fill="#fff" />
        </svg>
      );
    case "rect":
      return (
        <svg {...svgProps} stroke="#d97706">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
    case "ellipse":
      return (
        <svg {...svgProps} stroke="#2563eb">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    default:
      return null;
  }
};

export const loadSvgToBrickGrid = (svgString: string, size: number): Promise<boolean[][]> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(Array(size).fill(null).map(() => Array(size).fill(false)));
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(Array(size).fill(null).map(() => Array(size).fill(false)));
      return;
    }
    const img = new Image();
    const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const imgData = ctx.getImageData(0, 0, size, size).data;
      const cells = Array(size).fill(null).map(() => Array(size).fill(false));
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          const idx = (r * size + c) * 4;
          const alpha = imgData[idx + 3];
          const darkness = 255 - (imgData[idx] + imgData[idx + 1] + imgData[idx + 2]) / 3;
          if (alpha > 40 && darkness > 30) cells[r][c] = true;
        }
      }
      resolve(cells);
    };
    img.onerror = () => {
      resolve(Array(size).fill(null).map(() => Array(size).fill(false)));
    };
    img.src = svgUrl;
  });
};

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/* eslint-disable react/display-name */
export const makeMagicContent = (magicLoading: MagicAction | null) => {
  return (action: MagicAction, label: string) =>
    magicLoading === action ? (
      <>
        <span className="loader" aria-hidden="true" />
        <span>{label}</span>
      </>
    ) : (
      label
    );
};

export const getCalligraphyPath = (points: DrawPoint[], width: number, angleDegrees: number): string => {
  if (points.length === 0) return "";
  const angleRad = (angleDegrees * Math.PI) / 180;
  const dx = (width / 2) * Math.cos(angleRad);
  const dy = (width / 2) * Math.sin(angleRad);

  const strokes: DrawPoint[][] = [];
  let currentStroke: DrawPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.move) {
      if (currentStroke.length > 0) strokes.push(currentStroke);
      currentStroke = [p];
    } else {
      currentStroke.push(p);
    }
  }
  if (currentStroke.length > 0) strokes.push(currentStroke);

  let d = "";
  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    if (stroke.length === 1) {
      const p = stroke[0];
      const x1 = p.x - dx;
      const y1 = p.y - dy;
      const x2 = p.x + dx;
      const y2 = p.y + dy;
      d += ` M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
      continue;
    }

    const rPoints: { x: number; y: number }[] = [];
    const lPoints: { x: number; y: number }[] = [];

    for (let i = 0; i < stroke.length; i++) {
      const p = stroke[i];
      rPoints.push({ x: p.x + dx, y: p.y + dy });
      lPoints.push({ x: p.x - dx, y: p.y - dy });
    }

    d += ` M ${rPoints[0].x.toFixed(2)} ${rPoints[0].y.toFixed(2)}`;
    for (let i = 1; i < rPoints.length; i++) {
      d += ` L ${rPoints[i].x.toFixed(2)} ${rPoints[i].y.toFixed(2)}`;
    }
    for (let i = lPoints.length - 1; i >= 0; i--) {
      d += ` L ${lPoints[i].x.toFixed(2)} ${lPoints[i].y.toFixed(2)}`;
    }
    d += " Z";
  }

  return d;
};

export const getPointedPath = (points: DrawPoint[], width: number): string => {
  if (points.length === 0) return "";

  const strokes: DrawPoint[][] = [];
  let currentStroke: DrawPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.move) {
      if (currentStroke.length > 0) strokes.push(currentStroke);
      currentStroke = [p];
    } else {
      currentStroke.push(p);
    }
  }
  if (currentStroke.length > 0) strokes.push(currentStroke);

  let d = "";
  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    const N = stroke.length;
    if (N === 1) {
      const p = stroke[0];
      d += ` M ${p.x.toFixed(2)} ${p.y.toFixed(2)} Z`;
      continue;
    }

    const rPoints: { x: number; y: number }[] = [];
    const lPoints: { x: number; y: number }[] = [];

    for (let i = 0; i < N; i++) {
      const p = stroke[i];
      let vx = 0;
      let vy = 0;
      if (i === 0) {
        vx = stroke[1].x - p.x;
        vy = stroke[1].y - p.y;
      } else if (i === N - 1) {
        vx = p.x - stroke[N - 2].x;
        vy = p.y - stroke[N - 2].y;
      } else {
        vx = stroke[i + 1].x - stroke[i - 1].x;
        vy = stroke[i + 1].y - stroke[i - 1].y;
      }

      const len = Math.hypot(vx, vy);
      const ux = len > 0.001 ? vx / len : 1;
      const uy = len > 0.001 ? vy / len : 0;

      const nx = -uy;
      const ny = ux;

      let t = width;
      const taperRange = Math.min(10, Math.floor(N * 0.25));
      if (taperRange > 0) {
        if (i < taperRange) {
          t = width * (i / taperRange);
        } else if (i > N - 1 - taperRange) {
          t = width * ((N - 1 - i) / taperRange);
        }
      }

      const halfT = t / 2;
      rPoints.push({ x: p.x + halfT * nx, y: p.y + halfT * ny });
      lPoints.push({ x: p.x - halfT * nx, y: p.y - halfT * ny });
    }

    d += ` M ${rPoints[0].x.toFixed(2)} ${rPoints[0].y.toFixed(2)}`;
    for (let i = 1; i < rPoints.length; i++) {
      d += ` L ${rPoints[i].x.toFixed(2)} ${rPoints[i].y.toFixed(2)}`;
    }
    for (let i = lPoints.length - 1; i >= 0; i--) {
      d += ` L ${lPoints[i].x.toFixed(2)} ${lPoints[i].y.toFixed(2)}`;
    }
    d += " Z";
  }

  return d;
};

