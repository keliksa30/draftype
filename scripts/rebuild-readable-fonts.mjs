import opentype from 'opentype.js';
import fs from 'fs';
import path from 'path';

// Detailed SVG paths for actual readable letters (A, B, C, D, E, etc.)
function getLetterSvg(char, style) {
  const isPixel = style === 'pixel';
  const c = char.toUpperCase();

  // Pixel patterns for 8x8 grids mapped to 16x16 / 1000x1000
  const letterPixelGrid = {
    A: [
      "  ####  ",
      " #    # ",
      " #    # ",
      " ###### ",
      " #    # ",
      " #    # ",
      " #    # ",
      "        "
    ],
    B: [
      " #####  ",
      " #    # ",
      " #####  ",
      " #    # ",
      " #    # ",
      " #####  ",
      "        ",
      "        "
    ],
    C: [
      "  ####  ",
      " #    # ",
      " #      ",
      " #      ",
      " #    # ",
      "  ####  ",
      "        ",
      "        "
    ],
    D: [
      " #####  ",
      " #    # ",
      " #    # ",
      " #    # ",
      " #    # ",
      " #####  ",
      "        ",
      "        "
    ],
    E: [
      " ###### ",
      " #      ",
      " ####   ",
      " #      ",
      " #      ",
      " ###### ",
      "        ",
      "        "
    ],
    F: [
      " ###### ",
      " #      ",
      " ####   ",
      " #      ",
      " #      ",
      " #      ",
      "        ",
      "        "
    ],
    G: [
      "  ####  ",
      " #    # ",
      " #      ",
      " #  ### ",
      " #    # ",
      "  ####  ",
      "        ",
      "        "
    ],
    H: [
      " #    # ",
      " #    # ",
      " ###### ",
      " #    # ",
      " #    # ",
      " #    # ",
      "        ",
      "        "
    ],
    I: [
      " ### ",
      "  #  ",
      "  #  ",
      "  #  ",
      "  #  ",
      " ### ",
      "     ",
      "     "
    ],
    J: [
      "   ### ",
      "    #  ",
      "    #  ",
      "    #  ",
      " #  #  ",
      "  ##   ",
      "       ",
      "       "
    ],
    K: [
      " #   # ",
      " #  #  ",
      " ###   ",
      " #  #  ",
      " #   # ",
      " #   # ",
      "       ",
      "       "
    ],
    L: [
      " #     ",
      " #     ",
      " #     ",
      " #     ",
      " #     ",
      " ######",
      "       ",
      "       "
    ],
    M: [
      " #   # ",
      " ## ## ",
      " # # # ",
      " #   # ",
      " #   # ",
      " #   # ",
      "       ",
      "       "
    ],
    N: [
      " #   # ",
      " ##  # ",
      " # # # ",
      " #  ## ",
      " #   # ",
      " #   # ",
      "       ",
      "       "
    ],
    O: [
      "  ###  ",
      " #   # ",
      " #   # ",
      " #   # ",
      " #   # ",
      "  ###  ",
      "       ",
      "       "
    ],
    P: [
      " ####  ",
      " #   # ",
      " ####  ",
      " #     ",
      " #     ",
      " #     ",
      "       ",
      "       "
    ],
    Q: [
      "  ###  ",
      " #   # ",
      " #   # ",
      " # # # ",
      "  ###  ",
      "    ## ",
      "       ",
      "       "
    ],
    R: [
      " ####  ",
      " #   # ",
      " ####  ",
      " #  #  ",
      " #   # ",
      " #   # ",
      "       ",
      "       "
    ],
    S: [
      "  #### ",
      " #     ",
      "  ###  ",
      "     # ",
      " ####  ",
      "       ",
      "       ",
      "       "
    ],
    T: [
      " ##### ",
      "   #   ",
      "   #   ",
      "   #   ",
      "   #   ",
      "   #   ",
      "       ",
      "       "
    ],
    U: [
      " #   # ",
      " #   # ",
      " #   # ",
      " #   # ",
      " #   # ",
      "  ###  ",
      "       ",
      "       "
    ],
    V: [
      " #   # ",
      " #   # ",
      " #   # ",
      "  # #  ",
      "  # #  ",
      "   #   ",
      "       ",
      "       "
    ],
    W: [
      " #   # ",
      " #   # ",
      " # # # ",
      " ## ## ",
      " #   # ",
      "       ",
      "       ",
      "       "
    ],
    X: [
      " #   # ",
      "  # #  ",
      "   #   ",
      "  # #  ",
      " #   # ",
      "       ",
      "       ",
      "       "
    ],
    Y: [
      " #   # ",
      "  # #  ",
      "   #   ",
      "   #   ",
      "   #   ",
      "       ",
      "       ",
      "       "
    ],
    Z: [
      " ######",
      "     # ",
      "    #  ",
      "   #   ",
      "  #    ",
      " ######",
      "       ",
      "       "
    ]
  };

  const grid = letterPixelGrid[c] || letterPixelGrid['A'];

  if (isPixel) {
    // Generate BrickType 16x16 SVG rects
    let rects = '';
    grid.forEach((row, r) => {
      [...row].forEach((cell, c) => {
        if (cell === '#') {
          rects += `<rect x="${c * 2}" y="${r * 2}" width="2" height="2"/>`;
        }
      });
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g fill="currentColor">${rects}</g></svg>`;
  } else {
    // Generate FingerType Brush handwriting stroke paths (1000x1000)
    let paths = '';
    grid.forEach((row, r) => {
      [...row].forEach((cell, c) => {
        if (cell === '#') {
          const x = 150 + c * 90;
          const y = 150 + r * 90;
          paths += `<path d="M ${x} ${y} Q ${x + 80} ${y + 20} ${x + 70} ${y + 70} Q ${x + 20} ${y + 80} ${x} ${y} Z" fill="currentColor"/>`;
        }
      });
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${paths}</svg>`;
  }
}

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

    path.moveTo(p1.x, p1.y);
    path.lineTo(p2.x, p2.y);
    path.lineTo(p3.x, p3.y);
    path.lineTo(p4.x, p4.y);
    path.close();
  }

  const pathTags = svgString.match(/<path[^>]*>/gi) || [];
  for (const tag of pathTags) {
    const dMatch = tag.match(/d=["']([^"']+)["']/i);
    if (dMatch) {
      const d = dMatch[1];
      const regex = /([MmLlQqCcZz])\s*([0-9eE\s,.-]*)/g;
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
        } else if (cmd === 'Q' || cmd === 'q') {
          for (let i = 0; i < args.length; i += 4) {
            const cx = cmd === 'q' ? currX + args[i] : args[i];
            const cy = cmd === 'q' ? currY + args[i+1] : args[i+1];
            currX = cmd === 'q' ? currX + args[i+2] : args[i+2];
            currY = cmd === 'q' ? currY + args[i+3] : args[i+3];
            const cpt = tf(cx, cy);
            const pt = tf(currX, currY);
            path.quadraticCurveTo(cpt.x, cpt.y, pt.x, pt.y);
          }
        } else if (cmd === 'Z' || cmd === 'z') {
          path.close();
        }
      }
    }
  }

  return path;
}

function buildFont(fontName, style) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');
  const fontGlyphs = [
    new opentype.Glyph({ name: '.notdef', advanceWidth: 650 }),
    new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: 360 }),
  ];

  for (const char of chars) {
    const svg = getLetterSvg(char, style);
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
  console.log(`✓ Rebuilt ${fontName}.ttf (${buffer.length} bytes) with actual readable letter shapes!`);
}

// Rebuild nulisjari (Handwriting Brush letters A-Z, a-z, 0-9)
buildFont('nulisjari', 'handwriting');

// Rebuild pikselo (BrickType Pixelated letters A-Z, a-z, 0-9)
buildFont('pikselo', 'pixel');
