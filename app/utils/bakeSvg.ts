import paper from 'paper/dist/paper-core';

/**
 * Bake all SVG transforms into path coordinates using an isolated PaperScope.
 * This function NEVER touches the global paper.project — it always creates
 * its own temporary scope so it cannot crash any active canvas view.
 * 
 * It carefully saves and restores any previously active scope/project.
 */
export const bakeSvgTransforms = (svgString: string): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return svgString;
  }
  if (!svgString || !svgString.trim()) return svgString;

  // Extract the viewBox from the input SVG to preserve dimensions
  const vbMatch = svgString.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  let vb = "0 0 100 100";
  let vbW = "100", vbH = "100";
  if (vbMatch) {
    vb = `${vbMatch[1]} ${vbMatch[2]} ${vbMatch[3]} ${vbMatch[4]}`;
    vbW = vbMatch[3];
    vbH = vbMatch[4];
  }

  // Save the currently active scope and project BEFORE we do anything
  const savedProject = paper.project;
  const savedScope = (paper as any).PaperScope?.activeScope ?? null;

  let canvas: HTMLCanvasElement | null = null;
  let scope: paper.PaperScope | null = null;

  try {
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, parseFloat(vbW));
    canvas.height = Math.max(1, parseFloat(vbH));
    canvas.style.cssText = 'position:absolute;top:-9999px;left:-9999px;visibility:hidden;pointer-events:none';
    document.body.appendChild(canvas);

    scope = new paper.PaperScope();
    scope.setup(canvas);

    scope.project.importSVG(svgString, {
      insert: true,
      expandShapes: true,
      applyMatrix: true
    });

    const svgNode = scope.project.exportSVG({ asString: false }) as SVGElement;
    svgNode.setAttribute('viewBox', vb);
    svgNode.setAttribute('width', vbW);
    svgNode.setAttribute('height', vbH);

    return svgNode.outerHTML;
  } catch (e) {
    console.error("bakeSvgTransforms failed:", e);
    return svgString;
  } finally {
    // Clean up our temporary scope
    if (scope) {
      try { scope.project.clear(); } catch (_) {}
      try { (scope as any).remove(); } catch (_) {}
    }
    // Remove canvas from DOM
    if (canvas && canvas.parentNode) {
      try { canvas.parentNode.removeChild(canvas); } catch (_) {}
    }
    // CRITICAL: Restore the previously active scope and project!
    // When we called scope.setup() it became the active scope.
    // When we called scope.remove() it may have set paper.project to null.
    // We must restore the original state.
    if (savedProject) {
      try { savedProject.activate(); } catch (_) {}
    }
    if (savedScope && typeof savedScope.activate === 'function') {
      try { savedScope.activate(); } catch (_) {}
    }
  }
};
