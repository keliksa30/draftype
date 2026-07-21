// Mock DOM
const { JSDOM } = require("jsdom");
const dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="canvas" width="100" height="100"></canvas></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = { userAgent: 'node.js' };

const paper = require('paper');
paper.setup(document.getElementById('canvas'));

var circle = new paper.Path.Circle(new paper.Point(50, 50), 10);
circle.fillColor = 'black';

var svg1 = paper.project.exportSVG({ asString: true });
console.log("DEFAULT:", svg1);

var svg2 = paper.project.exportSVG({ asString: true, bounds: new paper.Rectangle(0, 0, 100, 100) });
console.log("WITH BOUNDS:", svg2);
