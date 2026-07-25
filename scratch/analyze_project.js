import fs from 'fs';

const data = JSON.parse(fs.readFileSync('/Users/rano/Downloads/pexelrt.draftype', 'utf8'));

console.log('Font Name:', data.fontName);
console.log('Designer:', data.fontDesigner);
console.log('Style:', data.fontStyle);

const designed = [];
const missing = [];

for (const [char, info] of Object.entries(data.glyphMap)) {
  if (info.svg && info.svg.trim() !== '') {
    designed.push(char);
  } else {
    missing.push(char);
  }
}

console.log('Designed characters (' + designed.length + '):', designed.join(', '));
console.log('Missing characters (' + missing.length + '):', missing.join(', '));
