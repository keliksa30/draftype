import paper from 'paper/dist/paper-core';

export const bakeSvgTransforms = (svgString: string): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return svgString;
  }

  // If paper project is already active, we can bake using the active project directly
  // with insert: false. This is extremely fast and avoids any scope setup/pollution!
  if (paper.project) {
    try {
      const item = paper.project.importSVG(svgString, {
        insert: false,
        expandShapes: true,
        applyMatrix: true
      });
      if (item) {
        const svgElement = item.exportSVG({ asString: false }) as SVGElement;
        let result = "";
        if (svgElement.tagName.toLowerCase() !== 'svg') {
          const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svgNode.setAttribute('viewBox', '0 0 100 100');
          svgNode.setAttribute('width', '100');
          svgNode.setAttribute('height', '100');
          svgNode.appendChild(svgElement);
          result = svgNode.outerHTML;
        } else {
          svgElement.setAttribute('viewBox', '0 0 100 100');
          svgElement.setAttribute('width', '100');
          svgElement.setAttribute('height', '100');
          result = svgElement.outerHTML;
        }
        item.remove();
        return result;
      }
    } catch (err) {
      console.error("Failed to bake SVG using active project, falling back to temp scope", err);
    }
  }
  
  // Fallback: If no active project exists, create a temporary scope and canvas
  const prevScope = paper.PaperScope.activeScope;
  const prevProject = paper.project;
  let canvas: HTMLCanvasElement | null = null;
  let scope: paper.PaperScope | null = null;
  
  try {
    canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    canvas.style.position = 'absolute';
    canvas.style.top = '-9999px';
    canvas.style.left = '-9999px';
    canvas.style.visibility = 'hidden';
    document.body.appendChild(canvas);
    
    scope = new paper.PaperScope();
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
    
    // Clean up scope and project
    scope.project.clear();
    (scope as any).remove();
    
    return result;
  } catch (e) {
    console.error("Failed to bake SVG transforms in temp scope", e);
    return svgString;
  } finally {
    if (canvas && canvas.parentNode) {
      try {
        document.body.removeChild(canvas);
      } catch (err) {}
    }
    if (prevProject) {
      try {
        prevProject.activate();
      } catch (err) {}
    }
    if (prevScope) {
      try {
        prevScope.activate();
      } catch (err) {}
    }
  }
};
