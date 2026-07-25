import fs from "fs";
import opentype from "opentype.js";
 
async function run() {
  const fileBuffer = fs.readFileSync("./handwrite.otf");
  const font = opentype.parse(new Uint8Array(fileBuffer).buffer);
  console.log(`Loaded handwrite.otf successfully!`);
  console.log(`Glyph count: ${font.glyphs.length}`);
 
  const glyphD = font.charToGlyph("D");
  console.log(`\nGlyph 'D':`);
  console.log(`- Unicode: ${glyphD.unicode}`);
  console.log(`- Advance Width: ${glyphD.advanceWidth}`);
  console.log(`- Path commands count: ${glyphD.path.commands.length}`);
  console.log(`- First 20 commands:`);
  console.log(glyphD.path.commands.slice(0, 20));
 
  const glyphA = font.charToGlyph("A");
  console.log(`\nGlyph 'A':`);
  console.log(`- Unicode: ${glyphA.unicode}`);
  console.log(`- Advance Width: ${glyphA.advanceWidth}`);
  console.log(`- Path commands count: ${glyphA.path.commands.length}`);
  console.log(`- First 20 commands:`);
  console.log(glyphA.path.commands.slice(0, 20));

  const glyphI = font.charToGlyph("i");
  console.log(`\nGlyph 'i':`);
  console.log(`- Advance Width: ${glyphI.advanceWidth}`);

  const glyphL = font.charToGlyph("l");
  console.log(`\nGlyph 'l':`);
  console.log(`- Advance Width: ${glyphL.advanceWidth}`);

  const glyphM = font.charToGlyph("m");
  console.log(`\nGlyph 'm':`);
  console.log(`- Advance Width: ${glyphM.advanceWidth}`);
}
 
run().catch(console.error);
