import { PointerEvent, RefObject } from "react";
import { Mode, DrawTool, DrawPoint, GlyphArt, BrickGrid } from "./types";
import { fingerTools, getToolIcon, getCalligraphyPath, getPointedPath } from "./constants";

interface DrawingCanvasProps {
  mode: Mode;
  activeGlyph: string;
  selectedGlyph: GlyphArt;
  drawTool: DrawTool;
  setDrawTool: (tool: DrawTool) => void;
  drawPoints: DrawPoint[];
  drawingFilled: boolean;
  drawingPath: string;
  smoothedDrawPoints: DrawPoint[];
  lastPenPoint: DrawPoint | null;
  penPreviewPoint: { x: number; y: number } | null;
  setPenPreviewPoint: (val: { x: number; y: number } | null) => void;
  nextPenMove: boolean;
  setNextPenMove: (val: boolean) => void;
  isDrawingBrick: boolean;
  setIsDrawingBrick: (val: boolean) => void;
  lastToggledCell: { r: number; c: number } | null;
  setLastToggledCell: (val: { r: number; c: number } | null) => void;
  brickTool: "pencil" | "eraser";
  showGuides: boolean;
  referenceImage: string;
  fingerImage: string;
  referenceOpacity: number;
  brushSize: number;
  typeZoom: number;
  fingerZoom: number;
  workingSvg: string;
  hasTypeDraft: boolean;
  getActiveBrickGrid: () => BrickGrid;
  toggleBrickCell: (row: number, col: number, forceValue?: boolean) => void;
  setPreviousBrickGrid: (grid: BrickGrid | null) => void;
  drawingRef: RefObject<SVGSVGElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  startDrawing: (event: PointerEvent<SVGSVGElement>) => void;
  continueDrawing: (event: PointerEvent<SVGSVGElement>) => void;
  finishDrawing: () => void;
  shapeStart: { x: number; y: number } | null;
  shapePreview: { x: number; y: number } | null;

  // New features props
  showOnionSkin: boolean;
  prevGlyphSvg: string;
  nextGlyphSvg: string;
  snapToGrid: boolean;
  gridSnapSize: number;
  penType: "round" | "calligraphy" | "pointed";
  penAngle: number;
}

export default function DrawingCanvas({
  mode,
  activeGlyph,
  selectedGlyph,
  drawTool,
  setDrawTool,
  drawPoints,
  drawingFilled,
  drawingPath,
  smoothedDrawPoints,
  lastPenPoint,
  penPreviewPoint,
  setPenPreviewPoint,
  nextPenMove,
  setNextPenMove,
  isDrawingBrick,
  setIsDrawingBrick,
  lastToggledCell,
  setLastToggledCell,
  brickTool,
  showGuides,
  referenceImage,
  fingerImage,
  referenceOpacity,
  brushSize,
  typeZoom,
  fingerZoom,
  workingSvg,
  hasTypeDraft,
  getActiveBrickGrid,
  toggleBrickCell,
  setPreviousBrickGrid,
  drawingRef,
  canvasRef,
  startDrawing,
  continueDrawing,
  finishDrawing,
  shapeStart,
  shapePreview,

  // New features destructured
  showOnionSkin,
  prevGlyphSvg,
  nextGlyphSvg,
  snapToGrid,
  gridSnapSize,
  penType,
  penAngle,
}: DrawingCanvasProps) {
  return (
    <>
      <div className="board-header">
        <div>
          <p className="kicker" style={{ color: "var(--ink)" }}>Panduan Huruf Lengkap</p>
          <h2>{activeGlyph}</h2>
        </div>
        <div className="preview-word" aria-label="Font preview">
          {mode === "typeTapToe" ? "TypeTapToe" : mode === "fingertype" ? "FingerType" : mode === "brickType" ? "BrickType" : "Specimen"}
        </div>
      </div>

      <div className={`canvas-zone ${mode === "fingertype" ? "finger-zone" : "type-zone"}`}>
        {mode === "fingertype" ? (
          <div className="finger-tool-rail" aria-label="FingerType tools">
            {fingerTools.map((tool) => (
              <button
                className={`icon-tool ${drawTool === tool.id ? "active" : ""} ${tool.id}-tool`}
                key={tool.id}
                onClick={() => {
                  setDrawTool(tool.id as DrawTool);
                  if (tool.id === "pen") setNextPenMove(drawPoints.length === 0);
                }}
                title={tool.hint}
                aria-label={tool.label}
              >
                <span aria-hidden="true">{getToolIcon(tool.id)}</span>
                <em>{tool.label}</em>
              </button>
            ))}
          </div>
        ) : null}

        <div
          ref={canvasRef}
          className={`mega-canvas ${mode === "typeTapToe" ? "type-canvas" : ""} tool-${drawTool}`}
        >
          <span className="stage-label">Glyph {activeGlyph}</span>
          {mode === "fingertype" ? (
            <svg
              ref={drawingRef}
              style={{ width: `${fingerZoom}%` }}
              viewBox="0 0 100 100"
              onPointerDown={startDrawing}
              onPointerMove={continueDrawing}
              onPointerUp={finishDrawing}
              onPointerLeave={() => {
                finishDrawing();
                setPenPreviewPoint(null);
              }}
              role="img"
              aria-label="FingerType drawing canvas"
            >
              <defs>
                {snapToGrid && (
                  <pattern
                    id="grid-snap-pattern"
                    width={gridSnapSize}
                    height={gridSnapSize}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${gridSnapSize} 0 L 0 0 0 ${gridSnapSize}`}
                      fill="none"
                      stroke="var(--line)"
                      strokeWidth="0.15"
                      opacity="0.1"
                    />
                  </pattern>
                )}
              </defs>
              <rect className="draw-bg" width="100" height="100" />
              {snapToGrid && (
                <rect width="100" height="100" fill="url(#grid-snap-pattern)" style={{ pointerEvents: "none" }} />
              )}
              {showOnionSkin && prevGlyphSvg ? (
                <g opacity={0.16} style={{ pointerEvents: "none" }} dangerouslySetInnerHTML={{ __html: prevGlyphSvg }} />
              ) : null}
              {showOnionSkin && nextGlyphSvg ? (
                <g opacity={0.08} style={{ pointerEvents: "none" }} dangerouslySetInnerHTML={{ __html: nextGlyphSvg }} />
              ) : null}
              {selectedGlyph.svg ? (
                <g
                  opacity={1}
                  style={{ pointerEvents: "none" }}
                  dangerouslySetInnerHTML={{ __html: selectedGlyph.svg }}
                />
              ) : null}
              {showGuides ? (
                <g className="draw-guides">
                  <line x1="18" y1="0" x2="18" y2="100" strokeDasharray="2,2" />
                  <line x1="82" y1="0" x2="82" y2="100" strokeDasharray="2,2" />

                  {/* CAP HEIGHT */}
                  <line x1="0" y1="18" x2="100" y2="18" stroke="#ff4136" />
                  <text x="2" y="16" className="guide-line-text" fill="#ff4136">ASCENT</text>

                  {/* X-HEIGHT */}
                  <line x1="0" y1="46" x2="100" y2="46" stroke="#b10dc9" strokeDasharray="1,1" />
                  <text x="2" y="44" className="guide-line-text" fill="#b10dc9">X-HEIGHT</text>

                  {/* BASELINE */}
                  <line x1="0" y1="74" x2="100" y2="74" stroke="#0074d9" />
                  <text x="2" y="72" className="guide-line-text" fill="#0074d9">BASELINE</text>

                  {/* DESCENDER */}
                  <line x1="0" y1="88" x2="100" y2="88" stroke="#0074d9" strokeDasharray="2,2" />
                  <text x="2" y="86" className="guide-line-text" fill="#0074d9">DESCENT</text>
                </g>
              ) : null}
              {referenceImage ? (
                <image
                  href={referenceImage}
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  opacity={referenceOpacity / 100}
                  preserveAspectRatio="xMidYMid meet"
                />
              ) : null}
              {fingerImage ? (
                <image
                  href={fingerImage}
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  className="finger-image-layer"
                  preserveAspectRatio="xMidYMid meet"
                />
              ) : null}
              {penType === "calligraphy" ? (
                <path
                  d={getCalligraphyPath(smoothedDrawPoints, brushSize, penAngle)}
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0.2"
                />
              ) : penType === "pointed" ? (
                <path
                  d={getPointedPath(smoothedDrawPoints, brushSize)}
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0.2"
                />
              ) : (
                <path
                  d={drawingPath}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={brushSize}
                  fill={drawingFilled ? "currentColor" : "none"}
                />
              )}
              {drawTool === "pen" && lastPenPoint && penPreviewPoint && !nextPenMove ? (
                <line
                  className="pen-preview-line"
                  x1={lastPenPoint.x}
                  y1={lastPenPoint.y}
                  x2={penPreviewPoint.x}
                  y2={penPreviewPoint.y}
                />
              ) : null}
              {drawTool === "pen"
                ? smoothedDrawPoints.map((point, index) => (
                    <circle
                      className="pen-anchor"
                      cx={point.x}
                      cy={point.y}
                      r="1.8"
                      key={`${point.x}-${point.y}-${index}`}
                    />
                  ))
                : null}

              {/* Geometric Shape Previews */}
              {shapeStart && shapePreview && (
                <>
                  {drawTool === "line" && (
                    <line
                      x1={shapeStart.x}
                      y1={shapeStart.y}
                      x2={shapePreview.x}
                      y2={shapePreview.y}
                      stroke="currentColor"
                      strokeWidth={brushSize}
                      strokeDasharray="2,2"
                      strokeLinecap="round"
                    />
                  )}
                  {drawTool === "rect" && (
                    <rect
                      x={Math.min(shapeStart.x, shapePreview.x)}
                      y={Math.min(shapeStart.y, shapePreview.y)}
                      width={Math.abs(shapePreview.x - shapeStart.x)}
                      height={Math.abs(shapePreview.y - shapeStart.y)}
                      stroke="currentColor"
                      strokeWidth={brushSize}
                      strokeDasharray="2,2"
                      fill="none"
                    />
                  )}
                  {drawTool === "ellipse" && (
                    <ellipse
                      cx={(shapeStart.x + shapePreview.x) / 2}
                      cy={(shapeStart.y + shapePreview.y) / 2}
                      rx={Math.abs(shapePreview.x - shapeStart.x) / 2}
                      ry={Math.abs(shapePreview.y - shapeStart.y) / 2}
                      stroke="currentColor"
                      strokeWidth={brushSize}
                      strokeDasharray="2,2"
                      fill="none"
                    />
                  )}
                </>
              )}
            </svg>
          ) : mode === "brickType" ? (
            <div
              className="brick-grid-canvas"
              style={{
                gridTemplateColumns: `repeat(${getActiveBrickGrid().size}, 1fr)`,
                gridTemplateRows: `repeat(${getActiveBrickGrid().size}, 1fr)`,
                width: "100%",
                maxWidth: "460px",
                margin: "0 auto",
                position: "relative",
              }}
              onPointerLeave={() => setIsDrawingBrick(false)}
            >
              {selectedGlyph?.svg ? (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: referenceOpacity / 100,
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedGlyph.svg }}
                />
              ) : null}
              {showOnionSkin && prevGlyphSvg ? (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0.16,
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9,
                  }}
                  dangerouslySetInnerHTML={{ __html: prevGlyphSvg }}
                />
              ) : null}
              {showOnionSkin && nextGlyphSvg ? (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0.08,
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9,
                  }}
                  dangerouslySetInnerHTML={{ __html: nextGlyphSvg }}
                />
              ) : null}

              {getActiveBrickGrid().cells.map((rowArr, rIndex) =>
                rowArr.map((isActive, cIndex) => (
                  <div
                    key={`${rIndex}-${cIndex}`}
                    className={`brick-cell ${isActive ? "active" : ""}`}
                    role="button"
                    aria-label={`Piksel baris ${rIndex + 1} kolom ${cIndex + 1}, ${
                      isActive ? "aktif" : "nonaktif"
                    }`}
                    tabIndex={0}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setPreviousBrickGrid(getActiveBrickGrid());
                      setIsDrawingBrick(true);
                      toggleBrickCell(rIndex, cIndex);
                      setLastToggledCell({ r: rIndex, c: cIndex });
                    }}
                    onPointerMove={(e) => {
                      e.preventDefault();
                      if (isDrawingBrick) {
                        if (lastToggledCell?.r !== rIndex || lastToggledCell?.c !== cIndex) {
                          const targetVal = brickTool === "pencil";
                          toggleBrickCell(rIndex, cIndex, targetVal);
                          setLastToggledCell({ r: rIndex, c: cIndex });
                        }
                      }
                    }}
                    onPointerUp={() => {
                      setIsDrawingBrick(false);
                      setLastToggledCell(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        setPreviousBrickGrid(getActiveBrickGrid());
                        toggleBrickCell(rIndex, cIndex);
                      }
                    }}
                  />
                ))
              )}

              {showGuides && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "18%",
                      borderTop: "2px dashed #ff4136",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "74%",
                      borderTop: "2px solid #0074d9",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "88%",
                      borderTop: "2px dashed #0074d9",
                    }}
                  />
                </div>
              )}
            </div>
          ) : hasTypeDraft || !selectedGlyph.svg ? (
            <div
              className="mega-art"
              style={{ transform: `scale(${typeZoom / 100})` }}
              dangerouslySetInnerHTML={{ __html: workingSvg }}
            />
          ) : (
            <div
              className="mega-art"
              style={{
                transform: `translate(${selectedGlyph.x}px, ${selectedGlyph.y}px) rotate(${selectedGlyph.rotation}deg) scale(${(selectedGlyph.scale / 100) * (typeZoom / 100)})`,
              }}
              dangerouslySetInnerHTML={{ __html: selectedGlyph.svg }}
            />
          )}
        </div>
      </div>
    </>
  );
}
