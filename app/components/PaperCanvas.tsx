import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import paper from 'paper';
import { DrawTool } from './types';

interface PaperCanvasProps {
  drawTool: DrawTool;
  brushSize: number;
  initialSvg?: string;
  fingerZoom: number;
  onModification?: () => void;
}

export interface PaperCanvasRef {
  exportSVG: () => string;
}

const PaperCanvas = forwardRef<PaperCanvasRef, PaperCanvasProps>(({
  drawTool,
  brushSize,
  initialSvg,
  fingerZoom,
  onModification
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scopeRef = useRef<paper.PaperScope | null>(null);
  const toolRef = useRef<paper.Tool | null>(null);

  useImperativeHandle(ref, () => ({
    exportSVG: () => {
      if (!scopeRef.current) return '';
      return scopeRef.current.project.exportSVG({ asString: true }) as string;
    }
  }));

  useEffect(() => {
    if (!canvasRef.current) return;
    const scope = new paper.PaperScope();
    scope.setup(canvasRef.current);
    scopeRef.current = scope;

    if (initialSvg) {
      scope.project.importSVG(initialSvg, {
        insert: true,
        expandShapes: true,
        applyMatrix: true,
      });
    }

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

    if (drawTool === "brush" || drawTool === "pen") {
      let path: paper.Path | null = null;
      tool.onMouseDown = (event: paper.ToolEvent) => {
        path = new scope.Path({
          segments: [event.point],
          strokeColor: 'black',
          strokeWidth: brushSize,
          strokeCap: 'round',
          strokeJoin: 'round',
          fullySelected: false
        });
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        if (path) path.add(event.point);
      };
      tool.onMouseUp = (event: paper.ToolEvent) => {
        if (path) {
          path.simplify(10);
          if (onModification) onModification();
        }
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
          if (onModification) onModification();
        }
      };
    } else if (drawTool === "node") {
      let hitSegment: paper.Segment | null = null;
      let hitHandle: 'in' | 'out' | null = null;

      tool.onMouseDown = (event: paper.ToolEvent) => {
        const hitResult = scope.project.hitTest(event.point, { segments: true, handles: true, stroke: true, tolerance: 8 });
        scope.project.deselectAll();
        hitSegment = null;
        hitHandle = null;

        if (hitResult) {
          hitResult.item.selected = true;
          hitResult.item.fullySelected = true;

          if (hitResult.type === 'segment') {
            hitSegment = hitResult.segment;
          } else if (hitResult.type === 'handle-in') {
            hitSegment = hitResult.segment;
            hitHandle = 'in';
          } else if (hitResult.type === 'handle-out') {
            hitSegment = hitResult.segment;
            hitHandle = 'out';
          } else if (hitResult.type === 'stroke' && hitResult.item instanceof scope.Path) {
            hitSegment = hitResult.item.insert(hitResult.location.index + 1, event.point);
          }
        }
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        if (hitSegment) {
          if (hitHandle === 'in') {
            hitSegment.handleIn = hitSegment.handleIn.add(event.delta);
          } else if (hitHandle === 'out') {
            hitSegment.handleOut = hitSegment.handleOut.add(event.delta);
          } else {
            hitSegment.point = hitSegment.point.add(event.delta);
          }
          if (onModification) onModification();
        }
      };
    } else if (drawTool === "eraser") {
      let eraserPath: paper.Path | null = null;
      tool.onMouseDown = (event: paper.ToolEvent) => {
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
                    if (onModification) onModification();
                  }
                } catch (e) {
                  console.error("Boolean sub fail", e);
                }
              }
            }
          }
          eraserPath.remove();
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
        startPoint = event.point;
      };
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        if (!startPoint) return;
        if (shape) shape.remove();
        
        const rect = new scope.Rectangle(startPoint, event.point);
        if (drawTool === "rect") {
          shape = new scope.Shape.Rectangle(rect);
        } else if (drawTool === "ellipse") {
          shape = new scope.Shape.Ellipse(rect);
        } else if (drawTool === "line") {
          shape = new scope.Path.Line(startPoint, event.point);
        }
        
        if (shape) {
          shape.strokeColor = new paper.Color('black');
          shape.strokeWidth = brushSize;
        }
      };
      tool.onMouseUp = (event: paper.ToolEvent) => {
        if (shape && onModification) {
          if (shape instanceof scope.Shape) {
            shape.toPath();
            shape.remove();
          }
          onModification();
        }
      };
    }

    tool.activate();

  }, [drawTool, brushSize, onModification]);

  useEffect(() => {
    if (scopeRef.current) {
      scopeRef.current.view.zoom = fingerZoom / 100;
    }
  }, [fingerZoom]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 50 }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block', background: 'transparent' }} 
        data-paper-resize="true" 
      />
    </div>
  );
});

PaperCanvas.displayName = 'PaperCanvas';

export default PaperCanvas;
