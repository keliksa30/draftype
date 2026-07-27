import { test } from "node:test";
import { strictEqual, ok } from "node:assert";
import opentype from "opentype.js";

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

function makeExportPath(art, fallbackGlyph) {
  const path = new opentype.Path();
  const viewBox = art.svg.match(/viewBox=["']([^"']+)["']/i)?.[1];
  const viewParts = viewBox?.split(/\s+/).map(Number) ?? [0, 0, 100, 100];
  const [, , viewWidth = 100, viewHeight = 100] = viewParts;
  const scale = (art.scale / 100) * (700 / Math.max(viewWidth, viewHeight, 1));
  const rotate = ((art.rotation || 0) * Math.PI) / 180;
  const centerX = viewWidth / 2;
  const centerY = viewHeight / 2;
  const xShift = art._xShift ?? 0;

  const tf = (x, y) => transform(x, y, viewParts, scale, rotate, centerX, centerY, xShift, art.x || 0, art.y || 0);

  const rectTags = art.svg.match(/<rect[^>]*>/gi) || [];
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
  return path;
}

test("TypeTapToe & BrickType export font generates valid opentype buffer with non-empty paths", async () => {
  const sampleBrickSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g fill="currentColor"><rect x="4" y="2" width="8" height="12"/><rect x="6" y="6" width="4" height="4" fill="#ffffff"/></g></svg>`;
  
  const glyphA = new opentype.Glyph({
    name: "A",
    unicode: 65,
    advanceWidth: 700,
    path: makeExportPath({ svg: sampleBrickSvg, scale: 100, x: 0, y: 0, rotation: 0 }, "A"),
  });

  const font = new opentype.Font({
    familyName: "DrafType Test Font",
    styleName: "Regular",
    unitsPerEm: 1000,
    ascender: 850,
    descender: -150,
    glyphs: [
      new opentype.Glyph({ name: ".notdef", advanceWidth: 650 }),
      new opentype.Glyph({ name: "space", unicode: 32, advanceWidth: 360 }),
      glyphA,
    ],
  });

  const buffer = font.toArrayBuffer();
  ok(buffer.byteLength > 500, "Font buffer should be valid and greater than 500 bytes");
  
  // Re-parse font to ensure it's valid OTF/TTF
  const parsedFont = opentype.parse(buffer);
  strictEqual(parsedFont.glyphs.length, 3);
  
  const parsedGlyphA = parsedFont.glyphs.get(2);
  ok(parsedGlyphA.path.commands.length > 0, "Glyph A path commands should exist and not be empty");
});
