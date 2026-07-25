import opentype from "opentype.js";
 
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
 
  const transform = (x, y) => {
    const rx = x - centerX;
    const ry = y - centerY;
    const tx = rx * Math.cos(rotate) - ry * Math.sin(rotate) + centerX;
    const ty = rx * Math.sin(rotate) + ry * Math.cos(rotate) + centerY;
    return {
      x: 150 + (tx - viewParts[0]) * scale + art.x * 5,
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
 
  const drawThickSegment = (p1, p2, thickness, isWhite = false) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
    const len = Math.hypot(dx, dy);
    const nx = (dy / len) * (thickness / 2);
    const ny = (-dx / len) * (thickness / 2);
    path.moveTo(p1.x + nx, p1.y + ny);
    path.lineTo(p2.x + nx, p2.y + ny);
    path.lineTo(p2.x - nx, p2.y - ny);
    path.lineTo(p1.x - nx, p1.y - ny);
    path.close();
    drawCircle(p1.x, p1.y, thickness / 2, isWhite);
    drawCircle(p2.x, p2.y, thickness / 2, isWhite);
  };
 
  const checkIsWhite = (tagStr) => {
    return tagStr.includes('stroke="#ffffff"') || tagStr.includes('stroke="white"');
  };
 
  // Parse paths in SVG
  const pathPattern = /<path[^>]*d=["']([^"']+)["'][^>]*>/gi;
  for (const match of art.svg.matchAll(pathPattern)) {
    const d = match[1];
    const isStrokeOnly = (match[0].includes('fill="none"') || match[0].includes("fill='none'"));
    const swMatch = match[0].match(/stroke-width=["']?(\d*\.?\d+)["']?/);
    const thickness = (isStrokeOnly && swMatch) ? Number(swMatch[1]) * scale : 0;
    const isWhite = checkIsWhite(match[0]);
 
    console.log(`Path: isStrokeOnly=${isStrokeOnly}, thickness=${thickness}`);
 
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
        console.log(`Contour segments: ${contour.segments.length}`);
        contour.segments.forEach((seg) => {
          if (seg.type === 'L') {
            drawThickSegment(seg.start, seg.end, thickness, isWhite);
          } else if (seg.type === 'Q' && seg.c1) {
            let prev = seg.start;
            for (let t = 0.1; t <= 1; t += 0.1) {
              const u = 1 - t;
              const nx = u * u * seg.start.x + 2 * u * t * seg.c1.x + t * t * seg.end.x;
              const ny = u * u * seg.start.y + 2 * u * t * seg.c1.y + t * t * seg.end.y;
              const nextP = { x: nx, y: ny };
              drawThickSegment(prev, nextP, thickness, isWhite);
              prev = nextP;
            }
          }
        });
      });
    }
  }
 
  return path;
};
 
const art = {
  svg: `<svg viewBox="0 0 100 100"><path d="M 65 50 Q 65 35 50 35 Q 35 35 35 50 Q 35 65 50 65 Q 65 65 65 50 Z M 65 35 L 65 65" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  rotation: 0,
  scale: 80,
  x: 0,
  y: 0,
  kerning: 0,
};
 
const p = makeExportPath(opentype, art, "a");
console.log(`Generated path commands count: ${p.commands.length}`);
if (p.commands.length > 0) {
  console.log("First 15 commands:");
  console.log(p.commands.slice(0, 15));
}
