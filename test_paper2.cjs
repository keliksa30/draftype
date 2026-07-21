const paper = require('paper');
paper.setup(new paper.Size(400, 400));
paper.view.zoom = 2;
paper.view.center = new paper.Point(50, 50);

const path = new paper.Path({
  segments: [[20, 20], [80, 80]],
  strokeColor: 'black'
});

console.log("DEFAULT EXPORT:");
console.log(paper.project.exportSVG({ asString: true }));

console.log("\nBOUNDS CONTENT:");
console.log(paper.project.exportSVG({ asString: true, bounds: 'content' }));

console.log("\nBOUNDS RECT:");
console.log(paper.project.exportSVG({ asString: true, bounds: new paper.Rectangle(0, 0, 100, 100) }));
