import { test } from "node:test";
import { strictEqual, ok } from "node:assert";
import opentype from "opentype.js";

test("TypeTapToe & BrickType export font generates valid opentype buffer with non-empty paths", async () => {
  const path = new opentype.Path();
  path.moveTo(150, 750);
  path.lineTo(650, 750);
  path.lineTo(650, 150);
  path.lineTo(150, 150);
  path.close();

  const glyphA = new opentype.Glyph({
    name: "A",
    unicode: 65,
    advanceWidth: 700,
    path: path,
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
  
  const parsedFont = opentype.parse(buffer);
  strictEqual(parsedFont.glyphs.length, 3);
  
  const parsedGlyphA = parsedFont.glyphs.get(2);
  ok(parsedGlyphA.path.commands.length > 0, "Glyph A path commands should exist and not be empty");
});

test("Exported glyph path contains Bezier curve commands ('C')", async () => {
  const path = new opentype.Path();
  path.moveTo(100, 200);
  path.curveTo(100, 800, 400, 900, 500, 900);
  path.curveTo(600, 900, 900, 800, 900, 200);
  path.close();

  const glyphG = new opentype.Glyph({
    name: "g",
    unicode: 103,
    advanceWidth: 700,
    path: path,
  });

  const font = new opentype.Font({
    familyName: "DrafType Curve Font",
    styleName: "Regular",
    unitsPerEm: 1000,
    ascender: 850,
    descender: -150,
    glyphs: [
      new opentype.Glyph({ name: ".notdef", advanceWidth: 650 }),
      new opentype.Glyph({ name: "space", unicode: 32, advanceWidth: 360 }),
      glyphG,
    ],
  });

  const buffer = font.toArrayBuffer();
  ok(buffer.byteLength > 500, "Font buffer should be valid");

  const parsedFont = opentype.parse(buffer);
  const parsedGlyphG = parsedFont.glyphs.get(2);
  
  const curveCmds = parsedGlyphG.path.commands.filter(c => c.type === 'C');
  ok(curveCmds.length >= 2, "Glyph g should contain cubic Bezier curve commands ('C') in exported font");
});
