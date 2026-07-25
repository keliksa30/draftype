import paper from 'paper/dist/paper-core';

export const bakeSvgTransforms = (svgString: string): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !paper.project) {
    return svgString;
  }
  
  try {
    // Import using the active project but do not insert into the active layer
    const item = paper.project.importSVG(svgString, { 
      insert: false,
      expandShapes: true,
      applyMatrix: true 
    });
    
    if (!item) return svgString;
    
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
    
    item.remove(); // Clean up item
    return result;
  } catch (e) {
    console.error("Failed to bake SVG transforms", e);
    return svgString;
  }
};
