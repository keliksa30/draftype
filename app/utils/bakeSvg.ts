/**
 * Bake all SVG transforms into path coordinates using an isolated PaperScope.
 * 
 * CRITICAL DESIGN:
 * - Always creates its own temporary, isolated scope
 * - Saves a DIRECT REFERENCE to the active project BEFORE creating the temp scope
 * - Restores the saved project reference AFTER cleanup
 * - This prevents scope collisions that cause hitTest coordinate mismatches
 *   (clicking node A edits node B) and view null crashes
 * - Uses lazy import to avoid SSR issues with paper.js (which requires DOM/canvas)
 */

// Lazy-loaded paper module — only loaded on the client side
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _paper: any = null;

const getPaper = () => {
  if (typeof window === 'undefined') return null;
  if (!_paper) {
    // Use eval-based require to prevent Turbopack from statically analyzing
    // and bundling paper.js during SSR. Paper.js is purely client-side.
    // eslint-disable-next-line no-eval
    _paper = eval("require")('paper/dist/paper-core');
  }
  return _paper;
};

export const bakeSvgTransforms = (svgString: string): string => {
  const paper = getPaper();
  if (!paper) return svgString; // SSR — return unchanged
  if (typeof document === 'undefined') return svgString;
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

  // Save a DIRECT REFERENCE to the currently active project.
  // This is far more reliable than saving an index, because indices shift
  // when projects are added/removed from paper.projects.
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

    scope.project.importSVG(svgString, {
      insert: true,
      expandShapes: true,
      applyMatrix: true
    });

    const svgNode = scope.project.exportSVG({ asString: false }) as SVGElement;
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
    
    // Restore the previously active project using the saved DIRECT REFERENCE.
    // After our temp scope was removed, paper.project may point to nothing.
    // Re-activate the original project so all other code (PaperCanvas, hitTest, etc.) 
    // continues working correctly.
    if (savedProject) {
      try { savedProject.activate(); } catch (_) {}
    }
  }
};
