import { Mode } from "./types";

interface CanvasControlsProps {
  mode: Mode;
  activeGlyph: string;
  fingerZoom: number;
  setFingerZoom: (val: number) => void;
  typeZoom: number;
  setTypeZoom: (val: number) => void;
  canGlobalRevert: () => boolean;
  handleClearCanvas: () => void;
  handleGlobalRevert: () => void;
  assignWorkingSvg: () => void;
  commitBrickToGlyph: () => void;
  convertDrawingToGlyph: () => void;
  t: (key: string) => string;
}

export default function CanvasControls({
  mode,
  activeGlyph,
  fingerZoom,
  setFingerZoom,
  typeZoom,
  setTypeZoom,
  canGlobalRevert,
  handleClearCanvas,
  handleGlobalRevert,
  assignWorkingSvg,
  commitBrickToGlyph,
  convertDrawingToGlyph,
  t,
}: CanvasControlsProps) {
  const canRevert = canGlobalRevert();

  const handlePlace = () => {
    if (mode === "typeTapToe") assignWorkingSvg();
    else if (mode === "brickType") commitBrickToGlyph();
    else convertDrawingToGlyph();
  };

  return (
    <>
      <div className="canvas-zoom-container" style={{ width: "100%", maxWidth: "460px", margin: "12px auto 0" }}>
        <label
          className="slider-row compact"
          style={{ background: "transparent", border: "none", boxShadow: "none", padding: 0 }}
          title="Zoom"
        >
          <span style={{ fontSize: "0.8rem", fontWeight: "900" }}>ZOOM CANVAS</span>
          <input
            max={mode === "fingertype" ? 200 : 240}
            min={mode === "fingertype" ? 50 : 60}
            type="range"
            value={mode === "fingertype" ? fingerZoom : typeZoom}
            onChange={(event) => {
              const val = Number(event.target.value);
              if (mode === "fingertype") setFingerZoom(val);
              else setTypeZoom(val);
            }}
          />
          <span style={{ fontSize: "0.8rem", fontWeight: "900" }}>
            {mode === "fingertype" ? fingerZoom : typeZoom}%
          </span>
        </label>
      </div>

      <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "460px", margin: "12px auto 0" }}>
        <button
          className="action-button"
          onClick={handleClearCanvas}
          title="Clear"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            fontSize: "0.8rem",
            fontWeight: "900",
            padding: "0 12px",
            border: "3px solid var(--line)",
            borderRadius: "8px",
            boxShadow: "4px 4px 0 var(--line)",
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          {t("clear_btn")}
        </button>
        <button
          className="canvas-place-button"
          onClick={handlePlace}
          style={{
            flex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          title="Place"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {t("place_btn")} {activeGlyph}
        </button>
        <button
          className="action-button yellow"
          disabled={!canRevert}
          onClick={handleGlobalRevert}
          title="Revert"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            fontSize: "0.8rem",
            fontWeight: "900",
            padding: "0 12px",
            background: "var(--yellow)",
            border: "3px solid var(--line)",
            borderRadius: "8px",
            boxShadow: canRevert ? "4px 4px 0 var(--line)" : "none",
            opacity: canRevert ? 1 : 0.35,
            pointerEvents: canRevert ? "auto" : "none",
            cursor: canRevert ? "pointer" : "default",
            transform: "none",
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
          {t("revert_btn")}
        </button>
      </div>
    </>
  );
}
