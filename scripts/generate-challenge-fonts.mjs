import opentype from 'opentype.js';
import fs from 'fs';
import path from 'path';

const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');

function transform(x, y, viewParts, scale, rotate, centerX, centerY, xShift, artX, artY) {
  const rx = x - centerX;
  const ry = y - centerY;
  const tx = rx * Math.cos(rotate) - ry * Math.sin(rotate) + centerX;
  const ty = rx * Math.sin(rotate) + ry * Math.cos(rotate) + centerY;
  return {
    x: 150 + xShift + (tx - viewParts[0]) * scale + artX * 5,
    y: 790 - (ty - viewParts[1]) * scale - artY * 5,
  };
}

function makeExportPath(svgString) {
  const path = new opentype.Path();
  const viewBox = svgString.match(/viewBox=["']([^"']+)["']/i)?.[1];
  const viewParts = viewBox?.split(/\s+/).map(Number) ?? [0, 0, 100, 100];
  const [, , viewWidth = 100, viewHeight = 100] = viewParts;
  const scale = 700 / Math.max(viewWidth, viewHeight, 1);
  const centerX = viewWidth / 2;
  const centerY = viewHeight / 2;

  const tf = (x, y) => transform(x, y, viewParts, scale, 0, centerX, centerY, 0, 0, 0);

  const rectTags = svgString.match(/<rect[^>]*>/gi) || [];
  for (const tag of rectTags) {
    const xMatch = tag.match(/x=["']?(-?\d*\.?\d+)["']?/i);
    const yMatch = tag.match(/y=["']?(-?\d*\.?\d+)["']?/i);
    const wMatch = tag.match(/width=["']?(\d*\.?\d+)["']?/i);
    const hMatch = tag.match(/height=["']?(\d*\.?\d+)["']?/i);

    const x = xMatch ? Number(xMatch[1]) : 0;
    const y = yMatch ? Number(yMatch[1]) : 0;
    const width = wMatch ? Number(wMatch[1]) : 0;
    const height = hMatch ? Number(hMatch[1]) : 0;

    const p1 = tf(x, y);
    const p2 = tf(x + width, y);
    const p3 = tf(x + width, y + height);
    const p4 = tf(x, y + height);

    const isWhite = tag.includes('fill="#ffffff"') || tag.includes('fill="white"');
    if (isWhite) {
      path.moveTo(p1.x, p1.y); path.lineTo(p4.x, p4.y); path.lineTo(p3.x, p3.y); path.lineTo(p2.x, p2.y); path.close();
    } else {
      path.moveTo(p1.x, p1.y); path.lineTo(p2.x, p2.y); path.lineTo(p3.x, p3.y); path.lineTo(p4.x, p4.y); path.close();
    }
  }

  const pathTags = svgString.match(/<path[^>]*>/gi) || [];
  for (const tag of pathTags) {
    const dMatch = tag.match(/d=["']([^"']+)["']/i);
    if (dMatch) {
      const d = dMatch[1];
      const regex = /([MmLlZz])\s*([0-9eE\s,.-]*)/g;
      let m;
      let currX = 0, currY = 0;
      while ((m = regex.exec(d)) !== null) {
        const cmd = m[1];
        const argsStr = m[2] || '';
        const args = (argsStr.match(/-?[0-9]*\.?[0-9]+/g) || []).map(Number);

        if (cmd === 'M' || cmd === 'm') {
          for (let i = 0; i < args.length; i += 2) {
            currX = cmd === 'm' ? currX + args[i] : args[i];
            currY = cmd === 'm' ? currY + args[i+1] : args[i+1];
            const pt = tf(currX, currY);
            if (i === 0) path.moveTo(pt.x, pt.y);
            else path.lineTo(pt.x, pt.y);
          }
        } else if (cmd === 'L' || cmd === 'l') {
          for (let i = 0; i < args.length; i += 2) {
            currX = cmd === 'l' ? currX + args[i] : args[i];
            currY = cmd === 'l' ? currY + args[i+1] : args[i+1];
            const pt = tf(currX, currY);
            path.lineTo(pt.x, pt.y);
          }
        } else if (cmd === 'Z' || cmd === 'z') {
          path.close();
        }
      }
    }
  }

  return path;
}

function createTestFont(fontName, svgGenerator) {
  const fontGlyphs = [
    new opentype.Glyph({ name: '.notdef', advanceWidth: 650 }),
    new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: 360 }),
  ];

  for (const char of glyphs) {
    const svg = svgGenerator(char);
    const pathObj = makeExportPath(svg);

    fontGlyphs.push(
      new opentype.Glyph({
        name: `glyph-${char.charCodeAt(0)}`,
        unicode: char.charCodeAt(0),
        advanceWidth: 700,
        path: pathObj.commands.length > 0 ? pathObj : undefined,
      })
    );
  }

  const font = new opentype.Font({
    familyName: fontName,
    styleName: 'Regular',
    unitsPerEm: 1000,
    ascender: 850,
    descender: -150,
    glyphs: fontGlyphs,
  });

  const buffer = Buffer.from(font.toArrayBuffer());
  const filePath = path.join(process.cwd(), 'public', `${fontName}.ttf`);
  fs.writeFileSync(filePath, buffer);
  console.log(`✓ Exported ${fontName}.ttf (${buffer.length} bytes) to public/${fontName}.ttf`);
}

// 1. nulisjari (FingerType handwriting)
createTestFont('nulisjari', (char) => {
  const code = char.charCodeAt(0);
  const x = 200 + (code % 5) * 50;
  const y = 200 + (code % 3) * 80;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path d="M ${x} ${y} L ${x + 250} ${y + 350} L ${x + 100} ${y + 500} Z" fill="currentColor"/></svg>`;
});

// 2. pikselo (BrickType pixelated)
createTestFont('pikselo', (char) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g fill="currentColor"><rect x="2" y="2" width="12" height="12"/><rect x="5" y="5" width="6" height="6" fill="#ffffff"/></g></svg>`;
});

// 3. testesfont (TypeTapToe PNG trace)
createTestFont('testesfont', (char) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70"/></svg>`;
});

// 4. tiptiti (TypeTapToe SVG import)
createTestFont('tiptiti', (char) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 10 10 L 90 10 L 50 90 Z" fill="currentColor"/></svg>`;
});
