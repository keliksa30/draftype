import opentype from "opentype.js";
import path from "path";

import fs from "fs";

const conversationId = "f5181519-34d1-4961-9443-7deefbef6780";
const otfFilePath = `/Users/rano/.gemini/antigravity-cli/brain/${conversationId}/handwrite.otf`;

try {
  const buffer = fs.readFileSync(otfFilePath);
  const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  console.log("Loaded font successfully!");

  const inspectGlyph = (char) => {
    const glyph = font.charToGlyph(char);
    console.log(`\n--- Glyph '${char}' Commands ---`);
    console.log(`Total commands: ${glyph.path.commands.length}`);
    glyph.path.commands.forEach((cmd, idx) => {
      console.log(`  [${idx}] ${cmd.type} : ${JSON.stringify(cmd)}`);
    });
  };

  inspectGlyph("B");
  inspectGlyph("C");
  inspectGlyph("E");
} catch (err) {
  console.error(err);
}
