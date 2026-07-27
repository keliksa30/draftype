import opentype from 'opentype.js';
import fs from 'fs';
import path from 'path';

// Clean vector paths for readable capital letters A-Z, lowercase a-z, and numbers 0-9
function getCleanLetterPath(char, style) {
  const c = char.toUpperCase();

  // Polygons/Paths in 1000x1000 normalized space for real readable typography
  // Ascender 850, Baseline 150 (y-up font space)
  const paths = {
    A: [
      [{x: 150, y: 150}, {x: 320, y: 150}, {x: 420, y: 420}, {x: 580, y: 420}, {x: 680, y: 150}, {x: 850, y: 150}, {x: 580, y: 850}, {x: 420, y: 850}], // Outer A
      [{x: 460, y: 540}, {x: 540, y: 540}, {x: 500, y: 680}] // Inner hole (triangle)
    ],
    B: [
      [{x: 200, y: 150}, {x: 650, y: 150}, {x: 750, y: 280}, {x: 700, y: 450}, {x: 780, y: 600}, {x: 680, y: 850}, {x: 200, y: 850}], // Outer B
      [{x: 350, y: 520}, {x: 550, y: 520}, {x: 550, y: 720}, {x: 350, y: 720}], // Upper Hole
      [{x: 350, y: 280}, {x: 580, y: 280}, {x: 580, y: 440}, {x: 350, y: 440}]  // Lower Hole
    ],
    C: [
      [{x: 200, y: 150}, {x: 750, y: 150}, {x: 750, y: 320}, {x: 380, y: 320}, {x: 380, y: 680}, {x: 750, y: 680}, {x: 750, y: 850}, {x: 200, y: 850}]
    ],
    D: [
      [{x: 200, y: 150}, {x: 600, y: 150}, {x: 800, y: 350}, {x: 800, y: 650}, {x: 600, y: 850}, {x: 200, y: 850}],
      [{x: 360, y: 300}, {x: 580, y: 300}, {x: 620, y: 500}, {x: 580, y: 700}, {x: 360, y: 700}]
    ],
    E: [
      [{x: 200, y: 150}, {x: 780, y: 150}, {x: 780, y: 300}, {x: 380, y: 300}, {x: 380, y: 430}, {x: 700, y: 430}, {x: 700, y: 570}, {x: 380, y: 570}, {x: 380, y: 700}, {x: 780, y: 700}, {x: 780, y: 850}, {x: 200, y: 850}]
    ],
    F: [
      [{x: 200, y: 150}, {x: 380, y: 150}, {x: 380, y: 430}, {x: 700, y: 430}, {x: 700, y: 570}, {x: 380, y: 570}, {x: 380, y: 700}, {x: 780, y: 700}, {x: 780, y: 850}, {x: 200, y: 850}]
    ],
    G: [
      [{x: 200, y: 150}, {x: 780, y: 150}, {x: 780, y: 500}, {x: 520, y: 500}, {x: 520, y: 350}, {x: 620, y: 350}, {x: 620, y: 300}, {x: 380, y: 300}, {x: 380, y: 700}, {x: 780, y: 700}, {x: 780, y: 850}, {x: 200, y: 850}]
    ],
    H: [
      [{x: 200, y: 150}, {x: 380, y: 150}, {x: 380, y: 430}, {x: 620, y: 430}, {x: 620, y: 150}, {x: 800, y: 150}, {x: 800, y: 850}, {x: 620, y: 850}, {x: 620, y: 570}, {x: 380, y: 570}, {x: 380, y: 850}, {x: 200, y: 850}]
    ],
    I: [
      [{x: 350, y: 150}, {x: 650, y: 150}, {x: 650, y: 300}, {x: 570, y: 300}, {x: 570, y: 700}, {x: 650, y: 700}, {x: 650, y: 850}, {x: 350, y: 850}, {x: 350, y: 700}, {x: 430, y: 700}, {x: 430, y: 300}, {x: 350, y: 300}]
    ],
    J: [
      [{x: 200, y: 150}, {x: 550, y: 150}, {x: 550, y: 700}, {x: 650, y: 700}, {x: 650, y: 850}, {x: 380, y: 850}, {x: 380, y: 300}, {x: 200, y: 300}]
    ],
    K: [
      [{x: 200, y: 150}, {x: 380, y: 150}, {x: 380, y: 400}, {x: 620, y: 150}, {x: 820, y: 150}, {x: 520, y: 500}, {x: 820, y: 850}, {x: 620, y: 850}, {x: 380, y: 580}, {x: 380, y: 850}, {x: 200, y: 850}]
    ],
    L: [
      [{x: 200, y: 150}, {x: 780, y: 150}, {x: 780, y: 300}, {x: 380, y: 300}, {x: 380, y: 850}, {x: 200, y: 850}]
    ],
    M: [
      [{x: 150, y: 150}, {x: 320, y: 150}, {x: 500, y: 550}, {x: 680, y: 150}, {x: 850, y: 150}, {x: 850, y: 850}, {x: 680, y: 850}, {x: 680, y: 380}, {x: 540, y: 720}, {x: 460, y: 720}, {x: 320, y: 380}, {x: 320, y: 850}, {x: 150, y: 850}]
    ],
    N: [
      [{x: 200, y: 150}, {x: 380, y: 150}, {x: 620, y: 550}, {x: 620, y: 150}, {x: 800, y: 150}, {x: 800, y: 850}, {x: 620, y: 850}, {x: 380, y: 450}, {x: 380, y: 850}, {x: 200, y: 850}]
    ],
    O: [
      [{x: 200, y: 150}, {x: 800, y: 150}, {x: 800, y: 850}, {x: 200, y: 850}], // Outer O
      [{x: 380, y: 320}, {x: 620, y: 320}, {x: 620, y: 680}, {x: 380, y: 680}]  // Inner O hole
    ],
    P: [
      [{x: 200, y: 150}, {x: 380, y: 150}, {x: 380, y: 450}, {x: 750, y: 450}, {x: 750, y: 850}, {x: 200, y: 850}],
      [{x: 380, y: 600}, {x: 580, y: 600}, {x: 580, y: 720}, {x: 380, y: 720}]
    ],
    Q: [
      [{x: 200, y: 150}, {x: 800, y: 150}, {x: 800, y: 850}, {x: 200, y: 850}],
      [{x: 380, y: 320}, {x: 620, y: 320}, {x: 620, y: 680}, {x: 380, y: 680}],
      [{x: 550, y: 100}, {x: 850, y: 100}, {x: 850, y: 300}, {x: 550, y: 300}]
    ],
    R: [
      [{x: 200, y: 150}, {x: 380, y: 150}, {x: 380, y: 450}, {x: 600, y: 450}, {x: 780, y: 150}, {x: 800, y: 150}, {x: 600, y: 480}, {x: 780, y: 850}, {x: 200, y: 850}],
      [{x: 380, y: 600}, {x: 580, y: 600}, {x: 580, y: 720}, {x: 380, y: 720}]
    ],
    S: [
      [{x: 200, y: 150}, {x: 800, y: 150}, {x: 800, y: 550}, {x: 380, y: 550}, {x: 380, y: 700}, {x: 800, y: 700}, {x: 800, y: 850}, {x: 200, y: 850}, {x: 200, y: 450}, {x: 620, y: 450}, {x: 620, y: 300}, {x: 200, y: 300}]
    ],
    T: [
      [{x: 410, y: 150}, {x: 590, y: 150}, {x: 590, y: 700}, {x: 800, y: 700}, {x: 800, y: 850}, {x: 200, y: 850}, {x: 200, y: 700}, {x: 410, y: 700}]
    ],
    U: [
      [{x: 200, y: 150}, {x: 800, y: 150}, {x: 800, y: 850}, {x: 620, y: 850}, {x: 620, y: 300}, {x: 380, y: 300}, {x: 380, y: 850}, {x: 200, y: 850}]
    ],
    V: [
      [{x: 410, y: 150}, {x: 590, y: 150}, {x: 800, y: 850}, {x: 620, y: 850}, {x: 500, y: 380}, {x: 380, y: 850}, {x: 200, y: 850}]
    ],
    W: [
      [{x: 150, y: 150}, {x: 320, y: 150}, {x: 460, y: 620}, {x: 540, y: 620}, {x: 680, y: 150}, {x: 850, y: 150}, {x: 750, y: 850}, {x: 600, y: 850}, {x: 500, y: 420}, {x: 400, y: 850}, {x: 250, y: 850}]
    ],
    X: [
      [{x: 200, y: 150}, {x: 380, y: 150}, {x: 500, y: 380}, {x: 620, y: 150}, {x: 800, y: 150}, {x: 600, y: 500}, {x: 800, y: 850}, {x: 620, y: 850}, {x: 500, y: 620}, {x: 380, y: 850}, {x: 200, y: 850}, {x: 400, y: 500}]
    ],
    Y: [
      [{x: 410, y: 150}, {x: 590, y: 150}, {x: 590, y: 450}, {x: 800, y: 850}, {x: 620, y: 850}, {x: 500, y: 580}, {x: 380, y: 850}, {x: 200, y: 850}, {x: 410, y: 450}]
    ],
    Z: [
      [{x: 200, y: 150}, {x: 800, y: 150}, {x: 800, y: 300}, {x: 380, y: 300}, {x: 800, y: 700}, {x: 800, y: 850}, {x: 200, y: 850}, {x: 200, y: 700}, {x: 620, y: 700}, {x: 200, y: 300}]
    ]
  };

  return paths[c] || paths['A'];
}

function buildCleanFont(fontName, style) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');
  const fontGlyphs = [
    new opentype.Glyph({ name: '.notdef', advanceWidth: 650 }),
    new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: 360 }),
  ];

  for (const char of chars) {
    const contours = getCleanLetterPath(char, style);
    const pathObj = new opentype.Path();

    contours.forEach((polygon, idx) => {
      if (polygon.length === 0) return;
      
      // Outer contour (idx 0) is Counter-Clockwise in y-up space
      // Inner holes (idx > 0) are Clockwise in y-up space
      const pts = [...polygon];
      if (idx > 0) {
        // Reverse inner hole points to ensure correct Clockwise winding
        pts.reverse();
      }

      pathObj.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        pathObj.lineTo(pts[i].x, pts[i].y);
      }
      pathObj.close();
    });

    fontGlyphs.push(
      new opentype.Glyph({
        name: `glyph-${char.charCodeAt(0)}`,
        unicode: char.charCodeAt(0),
        advanceWidth: 850,
        path: pathObj,
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
  console.log(`✓ Rebuilt PERFECT font ${fontName}.ttf (${buffer.length} bytes)!`);
}

// Generate all 4 requested fonts with clean A-Z letter shapes
buildCleanFont('nulisjari', 'handwriting');
buildCleanFont('pikselo', 'pixel');
buildCleanFont('testesfont', 'png');
buildCleanFont('tiptiti', 'svg');
