"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import paper from 'paper/dist/paper-core';
import { getCalligraphyPath, getPointedPath } from './constants';
import { DrawTool } from './types';

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

  const pushHistory = () => {
    if (!scopeRef.current) return;
    const currentSVG = scopeRef.current.project.exportSVG({ asString: true }) as string;
    const nextIndex = historyIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, nextIndex);
    historyRef.current.push(currentSVG);
    historyIndexRef.current = nextIndex;
  };

  const onModificationRef = useRef(onModification);
  useEffect(() => {
    onModificationRef.current = onModification;
  }, [onModification]);

  const restoreHistory = (svgString: string) => {
    if (!scopeRef.current) return;
    scopeRef.current.project.clear();
    if (svgString) {
      scopeRef.current.project.importSVG(svgString, {
        insert: true,
        expandShapes: true,
        applyMatrix: true,
      });
    }
    if (onModificationRef.current) onModificationRef.current();
  };

  useImperativeHandle(ref, () => ({
    exportSVG: () => {
      if (!scopeRef.current) return '';
      const svgNode = scopeRef.current.project.exportSVG({ 
        asString: false,
        bounds: new scopeRef.current.Rectangle(0, 0, 100, 100)
      }) as SVGElement;
      svgNode.setAttribute('viewBox', '0 0 100 100');
      svgNode.setAttribute('viewBox', '0 0 100 100');
      svgNode.setAttribute('width', '100');
      svgNode.setAttribute('height', '100');
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
      if (onModificationRef.current) onModificationRef.current();
    },
    setSVG: (svg: string) => {
      if (!scopeRef.current) return;
      scopeRef.current.project.clear();
      if (svg) {
        scopeRef.current.project.importSVG(svg, {
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
    if (!scopeRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const baseZoom = rect.width / 100;
    scopeRef.current.view.zoom = baseZoom * (fingerZoom / 100);
    scopeRef.current.view.center = new scopeRef.current.Point(50, 50);
  };

  useEffect(() => {
    updateView();
  }, [fingerZoom]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scope = new paper.PaperScope();
    scope.setup(canvasRef.current);
    scopeRef.current = scope;
    
    scope.view.onResize = () => {
      updateView();
    };
    updateView();

    if (initialSvg) {
      scope.project.importSVG(initialSvg, {
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
      scope.remove();
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

    if (drawTool === "brush") {
      let path: paper.Path | null = null;
      let rawPoints: { x: number, y: number, move?: boolean }[] = [];
      
      tool.onMouseDown = (event: paper.ToolEvent) => {
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
        const pt = applySnap(event.point);
        rawPoints.push({ x: pt.x, y: pt.y });
        if (path) path.add(pt);
      };
      tool.onMouseUp = (event: paper.ToolEvent) => {
        if (path) {
          path.simplify(10);
          
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
           currentSegment = path.add(pt);
        }
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        const pt = applySnap(event.point);
        if (currentSegment) {
          currentSegment.handleOut = pt.subtract(currentSegment.point);
          currentSegment.handleIn = currentSegment.handleOut.multiply(-1);
        }
      };
      tool.onMouseUp = (event: paper.ToolEvent) => {
        pushHistory();
        if (onModificationRef.current) onModificationRef.current();
      };
    } else if (drawTool === "move") {
      let hitItem: paper.Item | null = null;
      tool.onMouseDown = (event: paper.ToolEvent) => {
        const hitResult = scope.project.hitTest(event.point, { fill: true, stroke: true, segments: true, tolerance: 8 });
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
        if (hitItem) {
          hitItem.position = hitItem.position.add(event.delta);
        }
      };
      tool.onMouseUp = (event: paper.ToolEvent) => {
        if (hitItem) {
          pushHistory();
          if (onModificationRef.current) onModificationRef.current();
        }
      };
    } else if (drawTool === "node") {
      let hitSegment: paper.Segment | null = null;
      let hitHandle: 'in' | 'out' | null = null;

      tool.onMouseDown = (event: paper.ToolEvent) => {
        const hitResult = scope.project.hitTest(event.point, { fill: true, segments: true, handles: true, stroke: true, tolerance: 8 });
        
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

        if (hitResult) {
          hitResult.item.selected = true;
          hitResult.item.fullySelected = true;

          if (hitResult.type === 'segment') {
            hitSegment = hitResult.segment;
            if (event.modifiers.shift || event.count === 2) {
              hitSegment.remove();
              hitSegment = null;
              pushHistory();
              if (onModificationRef.current) onModificationRef.current();
            }
          } else if (hitResult.type === 'handle-in') {
            hitSegment = hitResult.segment;
            hitHandle = 'in';
          } else if (hitResult.type === 'handle-out') {
            hitSegment = hitResult.segment;
            hitHandle = 'out';
          } else if (hitResult.type === 'stroke' && hitResult.item instanceof scope.Path) {
            if (event.count === 2) {
              hitSegment = hitResult.item.insert(hitResult.location.index + 1, event.point);
              pushHistory();
              if (onModificationRef.current) onModificationRef.current();
            }
          }
        }
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
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
        if (hitSegment || hitHandle) {
          pushHistory();
          if (onModificationRef.current) onModificationRef.current();
        }
      };
      tool.onKeyDown = (event: paper.KeyEvent) => {
        if (event.key === 'backspace' || event.key === 'delete') {
          if (hitSegment) {
            hitSegment.remove();
            hitSegment = null;
            pushHistory();
            if (onModificationRef.current) onModificationRef.current();
          }
        }
      };
    } else if (drawTool === "eraser") {
      let eraserPath: paper.Path | null = null;
      let erasedSomething = false;
      tool.onMouseDown = (event: paper.ToolEvent) => {
        erasedSomething = false;
        eraserPath = new scope.Path({
          segments: [event.point],
          strokeColor: 'red',
          strokeWidth: brushSize,
          strokeCap: 'round'
        });
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        if (eraserPath) eraserPath.add(event.point);
      };
      tool.onMouseUp = (event: paper.ToolEvent) => {
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
        scope.view.center = scope.view.center.subtract(event.delta);
      };
    } else if (drawTool === "rect" || drawTool === "ellipse" || drawTool === "line") {
      let shape: paper.Shape | paper.Path | null = null;
      let startPoint: paper.Point | null = null;

      tool.onMouseDown = (event: paper.ToolEvent) => {
        startPoint = applySnap(event.point);
        shape = null;
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
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

  }, [drawTool, brushSize, penType, penAngle, snapToGrid, gridSnapSize]); // Removed onModification

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 50 }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block', background: 'transparent', touchAction: 'none' }} 
        data-paper-resize="true" 
      />
    </div>
  );
});

PaperCanvas.displayName = 'PaperCanvas';

export default PaperCanvas;
