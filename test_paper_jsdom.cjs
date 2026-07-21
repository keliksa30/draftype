const { JSDOM } = require("jsdom");
const dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="canvas" width="100" height="100"></canvas></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

const paper = require('paper');
paper.setup(document.getElementById('canvas'));
var circle = new paper.Path.Circle(new paper.Point(50, 50), 20);
circle.fillColor = 'black';
paper.view.zoom = 2;
paper.view.center = new paper.Point(50, 50);

var svgRect = paper.project.exportSVG({ asString: true, bounds: new paper.Rectangle(0, 0, 100, 100) });
console.log(svgRect);
