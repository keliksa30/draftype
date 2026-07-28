"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import paper from 'paper/dist/paper-core';
import { getCalligraphyPath, getPointedPath, normalizeSvgToCanvas } from './constants';
import { DrawTool, DrawPoint } from './types';

interface PaperCanvasProps {
  drawTool: DrawTool;
  brushSize: number;
  initialSvg?: string;
  fingerZoom: number;
  onModification?: () => void;
  penType?: "round" | "calligraphy" | "pointed";
  penAngle?: number;
  snapToGrid?: boolean;
  gridSnapSize?: number;
}

export interface PaperCanvasRef {
  exportSVG: () => string;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  setSVG: (svg: string) => void;
}

const PaperCanvas = forwardRef<PaperCanvasRef, PaperCanvasProps>(({
  drawTool,
  brushSize,
  initialSvg,
  fingerZoom,
  onModification,
  penType,
  penAngle,
  snapToGrid,
  gridSnapSize
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scopeRef = useRef<paper.PaperScope | null>(null);
  const toolRef = useRef<paper.Tool | null>(null);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isInternalChangeRef = useRef(false);

  const pushHistory = () => {
    if (!scopeRef.current) return;
    const svgNode = scopeRef.current.project.exportSVG({ asString: false }) as SVGElement;
    svgNode.setAttribute('viewBox', '0 0 1000 1000');
    svgNode.setAttribute('width', '1000');
    svgNode.setAttribute('height', '1000');
    const currentSVG = svgNode.outerHTML;
    
    // Only push if different from current state
    if (historyIndexRef.current >= 0 && historyRef.current[historyIndexRef.current] === currentSVG) {
      return;
    }
    
    // If we're not at the end of history, truncate the future
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    
    historyRef.current.push(currentSVG);
    historyIndexRef.current++;
    isInternalChangeRef.current = true;
    if (onModificationRef.current) onModificationRef.current();
  };

  const onModificationRef = useRef(onModification);
  useEffect(() => {
    onModificationRef.current = onModification;
  }, [onModification]);

  useEffect(() => {
    if (scopeRef.current && initialSvg) {
      if (isInternalChangeRef.current) {
        isInternalChangeRef.current = false;
        return;
      }
      
      const svgNode = scopeRef.current.project.exportSVG({ asString: false }) as SVGElement;
      svgNode.setAttribute('viewBox', '0 0 1000 1000');
      svgNode.setAttribute('width', '1000');
      svgNode.setAttribute('height', '1000');
      const currentSVG = svgNode.outerHTML;

      const normalized = normalizeSvgToCanvas(initialSvg, 1000);
      
      if (normalized !== currentSVG) {
        scopeRef.current.activate();
        scopeRef.current.project.clear();
        
        const oldZoom = scopeRef.current.view.zoom;
        const oldCenter = scopeRef.current.view.center;
        scopeRef.current.view.zoom = 1;
        scopeRef.current.view.center = new scopeRef.current.Point(500, 500);

        scopeRef.current.project.importSVG(normalized, {
          insert: true,
          expandShapes: true,
          applyMatrix: true,
        });

        scopeRef.current.view.zoom = oldZoom;
        scopeRef.current.view.center = oldCenter;
      }
    }
  }, [initialSvg]);

  const restoreHistory = (svgString: string) => {
    if (!scopeRef.current) return;
    scopeRef.current.project.clear();
    if (svgString) {
      const oldZoom = scopeRef.current.view.zoom;
      const oldCenter = scopeRef.current.view.center;
      scopeRef.current.view.zoom = 1;
      scopeRef.current.view.center = new scopeRef.current.Point(500, 500);

      scopeRef.current.project.importSVG(svgString, {
        insert: true,
        expandShapes: true,
        applyMatrix: true,
      });

      scopeRef.current.view.zoom = oldZoom;
      scopeRef.current.view.center = oldCenter;
    }
    isInternalChangeRef.current = true;
    if (onModificationRef.current) onModificationRef.current();
  };

  useImperativeHandle(ref, () => ({
    exportSVG: () => {
      if (!scopeRef.current) return '';
      
      // Temporarily reset view zoom to 1 to avoid exporting zoomed coordinates
      const oldZoom = scopeRef.current.view.zoom;
      const oldCenter = scopeRef.current.view.center;
      scopeRef.current.view.zoom = 1;
      scopeRef.current.view.center = new scopeRef.current.Point(500, 500);

      const svgNode = scopeRef.current.project.exportSVG({ 
        asString: false,
        bounds: new scopeRef.current.Rectangle(0, 0, 1000, 1000)
      }) as SVGElement;

      // Restore view
      scopeRef.current.view.zoom = oldZoom;
      scopeRef.current.view.center = oldCenter;

      svgNode.setAttribute('viewBox', '0 0 1000 1000');
      svgNode.setAttribute('width', '1000');
      svgNode.setAttribute('height', '1000');
      return svgNode.outerHTML;
    },
    undo: () => {
      if (historyIndexRef.current > 0) {
        historyIndexRef.current--;
        restoreHistory(historyRef.current[historyIndexRef.current]);
      }
    },
    redo: () => {
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current++;
        restoreHistory(historyRef.current[historyIndexRef.current]);
      }
    },
    clear: () => {
      if (!scopeRef.current) return;
      scopeRef.current.project.clear();
      pushHistory();
      isInternalChangeRef.current = true;
      if (onModificationRef.current) onModificationRef.current();
    },
    setSVG: (svg: string) => {
      if (!scopeRef.current) return;
      scopeRef.current.project.clear();
      if (svg) {
        const normalized = normalizeSvgToCanvas(svg, 1000);
        scopeRef.current.project.importSVG(normalized, {
          insert: true,
          expandShapes: true,
          applyMatrix: true,
        });
      }
      historyRef.current = [];
      historyIndexRef.current = -1;
      pushHistory();
    }
  }));

  const updateView = () => {
    if (!scopeRef.current || !canvasRef.current || !scopeRef.current.view) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const baseZoom = rect.width / 1000;
    scopeRef.current.view.zoom = baseZoom;
    scopeRef.current.view.center = new scopeRef.current.Point(500, 500);
  };

  useEffect(() => {
    updateView();
  }, [fingerZoom]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    if (!scopeRef.current) {
      const scope = new paper.PaperScope();
      scope.setup(canvasRef.current);
      // FORCE exactly 1000x1000 internal resolution, bypassing CSS layout size
      scope.project.view.viewSize = new paper.Size(1000, 1000);
      scopeRef.current = scope;
    }
    
    scopeRef.current.view.onResize = () => {
      updateView();
    };
    updateView();

    if (initialSvg) {
      const normalized = normalizeSvgToCanvas(initialSvg);
      scope.activate();
      scope.project.importSVG(normalized, {
        insert: true,
        expandShapes: true,
        applyMatrix: true,
      });
    }
    
    // Initialize history with initial state
    historyRef.current = [];
    historyIndexRef.current = -1;
    pushHistory();

    return () => {
      scope.project.clear();
      (scope as any).remove();
      scopeRef.current = null;
    };
  }, []); // Only on mount

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    if (toolRef.current) {
      toolRef.current.remove();
    }

    const tool = new scope.Tool();
    toolRef.current = tool;

    const applySnap = (pt: paper.Point) => {
      if (snapToGrid && gridSnapSize && scopeRef.current) {
        return new scopeRef.current.Point(
          Math.round(pt.x / gridSnapSize) * gridSnapSize,
          Math.round(pt.y / gridSnapSize) * gridSnapSize
        );
      }
      return pt;
    };

    const ensureActive = () => {
      if (scopeRef.current) scopeRef.current.activate();
    };

    if (drawTool === "brush") {
      let path: paper.Path | null = null;
      let rawPoints: DrawPoint[] = [];
      
      tool.onMouseDown = (event: paper.ToolEvent) => {
        ensureActive();
        const pt = applySnap(event.point);
        rawPoints = [{ x: pt.x, y: pt.y, move: true }];
        path = new scope.Path({
          segments: [pt],
          strokeColor: 'black',
          strokeWidth: brushSize,
          strokeCap: 'round',
          strokeJoin: 'round',
          fullySelected: false
        });
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        ensureActive();
        const pt = applySnap(event.point);
        rawPoints.push({ x: pt.x, y: pt.y, move: false });
        if (path) path.add(pt);
      };
      tool.onMouseUp = (event: paper.ToolEvent) => {
        ensureActive();
        if (path) {
          path.simplify(0.5);
          
          if (penType === "calligraphy" || penType === "pointed") {
             const svgD = penType === "calligraphy" 
                ? getCalligraphyPath(rawPoints, brushSize, penAngle || 45)
                : getPointedPath(rawPoints, brushSize);
             path.remove();
             const newPath = new scope.Path(svgD);
             newPath.fillColor = new paper.Color('black');
          }
          
          pushHistory();
          if (onModificationRef.current) onModificationRef.current();
        }
      };
    } else if (drawTool === "pen") {
      let path: paper.Path | null = null;
      let currentSegment: paper.Segment | null = null;

      tool.onMouseDown = (event: paper.ToolEvent) => {
        ensureActive();
        const pt = applySnap(event.point);
        if (!path || !path.selected) {
           path = new scope.Path({
             segments: [pt],
             strokeColor: 'black',
             strokeWidth: brushSize,
             strokeCap: 'round',
             strokeJoin: 'round',
             fullySelected: true
           });
           currentSegment = path.firstSegment;
        } else {
           currentSegment = path.add(pt) as paper.Segment;
        }
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        ensureActive();
        const pt = applySnap(event.point);
        if (currentSegment) {
          currentSegment.handleOut = pt.subtract(currentSegment.point);
          currentSegment.handleIn = currentSegment.handleOut.multiply(-1);
        }
      };
      tool.onMouseUp = (event: paper.ToolEvent) => {
        ensureActive();
        pushHistory();
        if (onModificationRef.current) onModificationRef.current();
      };
    } else if (drawTool === "move") {
      let hitItem: paper.Item | null = null;
      tool.onMouseDown = (event: paper.ToolEvent) => {
        ensureActive();
        const hitTolerance = Math.max(12, 16 / (scope.view.zoom || 1));
        const hitResult = scope.project.hitTest(event.point, { fill: true, stroke: true, segments: true, tolerance: hitTolerance });
        scope.project.deselectAll();
        if (hitResult && hitResult.item) {
          hitItem = hitResult.item;
          while (hitItem.parent && hitItem.parent !== scope.project.activeLayer) {
            hitItem = hitItem.parent;
          }
          hitItem.selected = true;
        } else {
          hitItem = null;
        }
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        ensureActive();
        if (hitItem) {
          hitItem.position = hitItem.position.add(event.delta);
        }
      };
      tool.onMouseUp = (event: paper.ToolEvent) => {
        ensureActive();
        if (hitItem) {
          pushHistory();
        }
      };
    } else if (drawTool === "node") {
      let hitSegment: paper.Segment | null = null;
      let hitHandle: 'in' | 'out' | null = null;
      let lastClickTime = 0;
      let lastClickPoint: paper.Point | null = null;
      let didDoubleClickAction = false;

      tool.onMouseDown = (event: paper.ToolEvent) => {
        ensureActive();
        didDoubleClickAction = false;
        const now = Date.now();
        const hitTolerance = Math.max(12, 18 / (scope.view.zoom || 1));
        const doubleClickDist = Math.max(15, 25 / (scope.view.zoom || 1));

        const isDoubleClick = (now - lastClickTime < 350) &&
          lastClickPoint &&
          event.point.getDistance(lastClickPoint) < doubleClickDist;
        lastClickTime = now;
        lastClickPoint = event.point.clone();

        // Hit test priority: segments > handles > stroke > fill
        const hitResult = scope.project.hitTest(event.point, {
          segments: true,
          handles: true,
          stroke: true,
          fill: true,
          tolerance: hitTolerance
        });

        if (!hitResult) {
          scope.project.deselectAll();
          hitSegment = null;
          hitHandle = null;
          return;
        }

        if (!hitResult.item.selected) {
          scope.project.deselectAll();
        }

        hitSegment = null;
        hitHandle = null;

        hitResult.item.selected = true;
        (hitResult.item as any).fullySelected = true;

        if (hitResult.type === 'segment') {
          hitSegment = hitResult.segment;
          if (event.modifiers.shift || isDoubleClick) {
            hitSegment.remove();
            hitSegment = null;
            didDoubleClickAction = true;
            pushHistory();
          }
        } else if (hitResult.type === 'handle-in') {
          hitSegment = hitResult.segment;
          hitHandle = 'in';
        } else if (hitResult.type === 'handle-out') {
          hitSegment = hitResult.segment;
          hitHandle = 'out';
        } else if (hitResult.type === 'stroke' && hitResult.item instanceof scope.Path) {
          if (isDoubleClick) {
            hitSegment = hitResult.item.insert(hitResult.location.index + 1, event.point) as paper.Segment;
            hitSegment.selected = true;
            didDoubleClickAction = true;
            pushHistory();
          }
        }
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        ensureActive();
        const pt = applySnap(event.point);
        if (hitSegment) {
          if (hitHandle === 'in') {
            hitSegment.handleIn = pt.subtract(hitSegment.point);
          } else if (hitHandle === 'out') {
            hitSegment.handleOut = pt.subtract(hitSegment.point);
          } else {
            hitSegment.point = pt;
          }
        }
      };
      tool.onMouseUp = (event: paper.ToolEvent) => {
        ensureActive();
        if (didDoubleClickAction) {
          didDoubleClickAction = false;
          return;
        }
        if (hitSegment || hitHandle) {
          pushHistory();
        }
      };
      tool.onKeyDown = (event: paper.KeyEvent) => {
        ensureActive();
        if (event.key === 'backspace' || event.key === 'delete') {
          if (hitSegment) {
            hitSegment.remove();
            hitSegment = null;
            pushHistory();
          }
        }
      };
    } else if (drawTool === "eraser") {
      let eraserPath: paper.Path | null = null;
      let erasedSomething = false;
      tool.onMouseDown = (event: paper.ToolEvent) => {
        ensureActive();
        erasedSomething = false;
        eraserPath = new scope.Path({
          segments: [event.point],
          strokeColor: 'red',
          strokeWidth: brushSize,
          strokeCap: 'round'
        });
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        ensureActive();
        if (eraserPath) eraserPath.add(event.point);
      };
      tool.onMouseUp = (event: paper.ToolEvent) => {
        ensureActive();
        if (eraserPath) {
          const items = scope.project.activeLayer.children.slice();
          for (const item of items) {
            if (item !== eraserPath && (item instanceof scope.PathItem)) {
              if (item.bounds.intersects(eraserPath.bounds)) {
                try {
                  const result = item.subtract(eraserPath);
                  if (result) {
                    item.replaceWith(result);
                    erasedSomething = true;
                  }
                } catch (e) {
                  console.error("Boolean sub fail", e);
                }
              }
            }
          }
          eraserPath.remove();
          if (erasedSomething) {
            pushHistory();
            if (onModificationRef.current) onModificationRef.current();
          }
        }
      };
    } else if (drawTool === "fill") {
      tool.onMouseDown = (event: paper.ToolEvent) => {
        ensureActive();
        const hitResult = scope.project.hitTest(event.point, { fill: true, stroke: true, tolerance: 8 });
        if (hitResult && hitResult.item) {
           const item = hitResult.item;
           if (item.fillColor && item.fillColor.toCSS(true) === '#000000') {
             item.fillColor = null as any;
           } else {
             item.fillColor = new paper.Color('black');
           }
           pushHistory();
           if (onModificationRef.current) onModificationRef.current();
        }
      };
    } else if (drawTool === "hand") {
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        ensureActive();
        scope.view.center = scope.view.center.subtract(event.delta);
      };
    } else if (drawTool === "rect" || drawTool === "ellipse" || drawTool === "line") {
      let shape: paper.Shape | paper.Path | null = null;
      let startPoint: paper.Point | null = null;

      tool.onMouseDown = (event: paper.ToolEvent) => {
        ensureActive();
        startPoint = applySnap(event.point);
        shape = null;
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        ensureActive();
        if (!startPoint) return;
        if (shape) shape.remove();
        
        const pt = applySnap(event.point);
        const rect = new scope.Rectangle(startPoint, pt);
        if (drawTool === "rect") {
          shape = new scope.Shape.Rectangle(rect);
        } else if (drawTool === "ellipse") {
          shape = new scope.Shape.Ellipse(rect);
        } else if (drawTool === "line") {
          shape = new scope.Path.Line(startPoint, pt);
        }
        
        if (shape) {
          shape.strokeColor = new paper.Color('black');
          shape.strokeWidth = brushSize;
        }
      };
      tool.onMouseUp = (event: paper.ToolEvent) => {
        ensureActive();
        if (shape) {
          if (shape instanceof scope.Shape) {
            const converted = shape.toPath();
            shape.remove();
          }
          pushHistory();
          if (onModificationRef.current) onModificationRef.current();
        }
      };
    }

    tool.activate();

  }, [drawTool, brushSize, penType, penAngle, snapToGrid, gridSnapSize]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 50 }}>
      <canvas 
        ref={canvasRef} 
        width="1000"
        height="1000"
        style={{ width: '100%', height: '100%', display: 'block', background: 'transparent', touchAction: 'none' }} 
      />
    </div>
  );
});

PaperCanvas.displayName = 'PaperCanvas';

export default PaperCanvas;
