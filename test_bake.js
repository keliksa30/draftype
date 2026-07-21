const paper = require('paper');
// Mock DOM
const { JSDOM } = require("jsdom");
const dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="canvas" width="100" height="100"></canvas></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = { userAgent: 'node.js' };

paper.setup(document.getElementById('canvas'));

const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path d="M 0 0 L 1000 1000" stroke="black"/></svg>`;
const group = paper.project.importSVG(rawSvg, { insert: true, expandShapes: true });

// Scale it down
group.scale(0.1, new paper.Point(0,0));

// Export
const baked = paper.project.exportSVG({ asString: true });
console.log(baked);
