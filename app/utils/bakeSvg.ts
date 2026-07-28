import paper from 'paper/dist/paper-core';

/**
 * Bake all SVG transforms into path coordinates using an isolated PaperScope.
 * 
 * CRITICAL DESIGN:
 * - Always creates its own temporary, isolated scope
 * - Saves a DIRECT REFERENCE to the active project BEFORE creating the temp scope
 * - Restores the saved project reference AFTER cleanup
 * - Preserves original viewBox dimensions from input SVG
 */
export const bakeSvgTransforms = (svgString: string): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return svgString;
  }
  if (!svgString || !svgString.trim()) return svgString;

  // Extract the viewBox from the input SVG to preserve dimensions
  const vbMatch = svgString.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  let vb = "0 0 1000 1000";
  let vbW = "1000", vbH = "1000";
  if (vbMatch) {
    vb = `${vbMatch[1]} ${vbMatch[2]} ${vbMatch[3]} ${vbMatch[4]}`;
    vbW = vbMatch[3];
    vbH = vbMatch[4];
  }

  // Save a DIRECT REFERENCE to the currently active project.
  const savedProject = paper.project ?? null;

  let canvas: HTMLCanvasElement | null = null;

  try {
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(parseFloat(vbW)));
    canvas.height = Math.max(1, Math.round(parseFloat(vbH)));
    canvas.style.cssText = 'position:absolute;top:-9999px;left:-9999px;visibility:hidden;pointer-events:none';
    document.body.appendChild(canvas);

    // Create isolated scope
    const scope = new paper.PaperScope();
    scope.setup(canvas);
    
    // FORCE exact resolution bypassing any CSS sizing interference
    scope.project.view.viewSize = new paper.Size(parseFloat(vbW), parseFloat(vbH));

    scope.project.importSVG(svgString, {
      insert: true,
      expandShapes: true,
      applyMatrix: true
    });

    const svgNode = scope.project.exportSVG({ 
      asString: false,
      bounds: new scope.Rectangle(0, 0, parseFloat(vbW), parseFloat(vbH))
    }) as SVGElement;
    svgNode.setAttribute('viewBox', vb);
    svgNode.setAttribute('width', vbW);
    svgNode.setAttribute('height', vbH);

    const result = svgNode.outerHTML;

    // Clean up: clear and remove the temporary project+scope
    scope.project.clear();
    scope.project.remove();

    return result;
  } catch (e) {
    console.error("bakeSvgTransforms failed:", e);
    return svgString;
  } finally {
    // Remove canvas from DOM
    if (canvas && canvas.parentNode) {
      try { canvas.parentNode.removeChild(canvas); } catch (_) {}
    }
    
    if (savedProject) {
      try { savedProject.activate(); } catch (_) {}
    }
  }
};
