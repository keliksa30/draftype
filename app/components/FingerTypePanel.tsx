import { DrawPoint } from "./types";

interface FingerTypePanelProps {
  brushSize: number;
  setBrushSize: (val: number) => void;
  smoothness: number;
  setSmoothness: (val: number) => void;
  referenceOpacity: number;
  setReferenceOpacity: (val: number) => void;
  drawHistoryIndex: number;
  drawHistory: { points: DrawPoint[]; filled: boolean }[];
  showGuides: boolean;
  setShowGuides: (val: boolean) => void;
  handleReferenceUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  undoDrawing: () => void;
  redoDrawing: () => void;
  newPenStroke: () => void;
  clearDrawing: () => void;
  showOnionSkin: boolean;
  setShowOnionSkin: (val: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (val: boolean) => void;
  gridSnapSize: number;
  setGridSnapSize: (val: number) => void;
  penType: "round" | "calligraphy" | "pointed";
  setPenType: (val: "round" | "calligraphy" | "pointed") => void;
  penAngle: number;
  setPenAngle: (val: number) => void;
  t: (key: string) => string;
  setReferenceImage: (val: string) => void;
  templateStyle: "none" | "sans" | "serif" | "cursive";
  setTemplateStyle: (val: "none" | "sans" | "serif" | "cursive") => void;
}

export default function FingerTypePanel({
  setReferenceImage,
  brushSize,
  setBrushSize,
  smoothness,
  setSmoothness,
  referenceOpacity,
  setReferenceOpacity,
  drawHistoryIndex,
  drawHistory,
  showGuides,
  setShowGuides,
  handleReferenceUpload,
  undoDrawing,
  redoDrawing,
  newPenStroke,
  clearDrawing,
  showOnionSkin,
  setShowOnionSkin,
  snapToGrid,
  setSnapToGrid,
  gridSnapSize,
  setGridSnapSize,
  penType,
  setPenType,
  penAngle,
  setPenAngle,
  t,
  templateStyle,
  setTemplateStyle,
}: FingerTypePanelProps) {
  return (
    <div className="panel-stack">
      <label className="upload-card">
        <span>{t("upload_ref")}</span>
        <input accept="image/*" type="file" onChange={handleReferenceUpload} />
      </label>
      <button className="action-button" onClick={() => setReferenceImage("")} title={t("clear_ref")}>
        {t("clear_ref")}
      </button>
      <div className="button-split">
        <button
          className="action-button"
          onClick={undoDrawing}
          disabled={drawHistoryIndex < 0}
          title={t("undo_line")}
        >
          {t("undo_line")}
        </button>
        <button
          className="action-button"
          onClick={redoDrawing}
          disabled={drawHistoryIndex >= drawHistory.length - 1}
          title={t("redo_line")}
        >
          {t("redo_line")}
        </button>
      </div>

      <label className="slider-row">
        {t("brush_nib")}
        <input
          max="18"
          min="3"
          type="range"
          value={brushSize}
          onChange={(event) => setBrushSize(Number(event.target.value))}
        />
        <span>{brushSize}</span>
      </label>
      <label className="slider-row">
        {t("smoothness_slider")}
        <input
          max="90"
          min="0"
          type="range"
          value={smoothness}
          onChange={(event) => setSmoothness(Number(event.target.value))}
        />
        <span>{smoothness}</span>
      </label>
      <label className="slider-row">
        {t("opacity_slider")}
        <input
          max="90"
          min="5"
          type="range"
          value={referenceOpacity}
          onChange={(event) => setReferenceOpacity(Number(event.target.value))}
        />
        <span>{referenceOpacity}%</span>
      </label>

      {/* Tipe Pena & Sudut Pena Kaligrafi */}
      <div style={{ border: "2px solid var(--line)", padding: "12px", borderRadius: "8px", background: "var(--white)", boxShadow: "3px 3px 0 var(--line)" }}>
        <p style={{ margin: "0 0 10px", fontSize: "0.75rem", fontWeight: "900", color: "var(--red)", letterSpacing: "0.05em" }}>{t("brush_style")}</p>
        <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
          {(["round", "calligraphy", "pointed"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setPenType(type)}
              className={`action-button ${penType === type ? "active yellow" : ""}`}
              style={{ flex: 1, minHeight: "36px", fontSize: "0.75rem", padding: "4px 2px", fontWeight: "900", textTransform: "uppercase" }}
            >
              {type === "round" ? t("round") : type === "calligraphy" ? t("calligraphy") : t("tapered")}
            </button>
          ))}
        </div>
        {penType === "calligraphy" && (
          <label className="slider-row" style={{ padding: "6px 12px", background: "var(--paper)", border: "2px solid var(--line)", borderRadius: "6px", marginTop: "10px" }}>
            <span style={{ fontWeight: "900", fontSize: "0.78rem" }}>{t("nib_angle")}</span>
            <input
              max="90"
              min="0"
              type="range"
              value={penAngle}
              onChange={(event) => setPenAngle(Number(event.target.value))}
            />
            <span style={{ fontWeight: "900", fontSize: "0.78rem" }}>{penAngle}°</span>
          </label>
        )}
      </div>

      {/* Snap to Grid */}
      <div style={{ border: "2px solid var(--line)", padding: "12px", borderRadius: "8px", background: "var(--white)", boxShadow: "3px 3px 0 var(--line)" }}>
        <p style={{ margin: "0 0 10px", fontSize: "0.75rem", fontWeight: "900", color: "var(--teal)", letterSpacing: "0.05em" }}>{t("snap_to_grid")}</p>
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`action-button ${snapToGrid ? "active yellow" : ""}`}
          style={{ width: "100%", minHeight: "32px", fontSize: "0.75rem", marginBottom: "8px" }}
        >
          {snapToGrid ? t("snap_active") : t("snap_inactive")}
        </button>
        {snapToGrid && (
          <label className="slider-row" style={{ padding: "6px 12px", background: "var(--paper)", border: "2px solid var(--line)", borderRadius: "6px", marginTop: "10px" }}>
            <span style={{ fontWeight: "900", fontSize: "0.78rem" }}>{t("grid_size")}</span>
            <input
              max="10"
              min="1"
              step="0.5"
              type="range"
              value={gridSnapSize}
              onChange={(event) => setGridSnapSize(Number(event.target.value))}
            />
            <span style={{ fontWeight: "900", fontSize: "0.78rem" }}>{gridSnapSize}</span>
          </label>
        )}
      </div>

      {/* Template Guide Selection */}
      <div style={{ border: "2px solid var(--line)", padding: "12px", borderRadius: "8px", background: "var(--white)", boxShadow: "3px 3px 0 var(--line)" }}>
        <p style={{ margin: "0 0 10px", fontSize: "0.75rem", fontWeight: "900", color: "var(--yellow)", letterSpacing: "0.05em" }}>TEMPLATE GUIDE</p>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["none", "sans", "serif", "cursive"] as const).map((style) => (
            <button
              key={style}
              onClick={() => setTemplateStyle(style)}
              className={`action-button ${templateStyle === style ? "active yellow" : ""}`}
              style={{ flex: 1, minHeight: "32px", fontSize: "0.7rem", padding: "4px 2px", fontWeight: "900", textTransform: "uppercase" }}
            >
              {style === "none" ? "Off" : style}
            </button>
          ))}
        </div>
      </div>

      <button className="action-button teal" onClick={newPenStroke} title={t("new_stroke")}>
        {t("new_stroke")}
      </button>
      <button
        className="action-button"
        onClick={clearDrawing}
        title={t("clear_drawing")}
      >
        {t("clear_drawing")}
      </button>

      <div style={{ display: "flex", gap: "6px" }}>
        <button
          className={`action-button ${showGuides ? "active yellow" : ""}`}
          onClick={() => setShowGuides(!showGuides)}
          style={{ flex: 1, minHeight: "36px", fontSize: "0.72rem", padding: 0 }}
          title="Guides"
        >
          {showGuides ? "Guides On" : "Guides Off"}
        </button>
        <button
          className={`action-button ${showOnionSkin ? "active yellow" : ""}`}
          onClick={() => setShowOnionSkin(!showOnionSkin)}
          style={{ flex: 1, minHeight: "36px", fontSize: "0.72rem", padding: 0 }}
          title="Onion"
        >
          {showOnionSkin ? "Onion On" : "Onion Off"}
        </button>
      </div>
    </div>
  );
}
