import * as paper from 'paper/dist/paper-core';

export const bakeSvgTransforms = (svgString: string): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return svgString;
  }
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    
    // Check if we need to setup a new scope or use an existing one
    // Using a new scope prevents interference with other canvases
    const scope = new paper.PaperScope();
    scope.setup(canvas);
    
    // Import with applyMatrix: true bakes all transforms directly into the path coordinates
    scope.project.importSVG(svgString, { 
      insert: true,
      expandShapes: true,
      applyMatrix: true 
    });
    
    const svgNode = scope.project.exportSVG({ asString: false }) as SVGElement;
    svgNode.setAttribute('viewBox', '0 0 100 100');
    svgNode.setAttribute('width', '100');
    svgNode.setAttribute('height', '100');
    
    const result = svgNode.outerHTML;
    (scope as any).remove(); // Clean up scope
    
    return result;
  } catch (e) {
    console.error("Failed to bake SVG transforms", e);
    return svgString;
  }
};
