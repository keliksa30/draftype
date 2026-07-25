import { GlyphArt, BrickGrid } from "./types";

interface BrickTypePanelProps {
  getActiveBrickGrid: () => BrickGrid;
  brickTool: "pencil" | "eraser";
  setBrickTool: (tool: "pencil" | "eraser") => void;
  showGuides: boolean;
  setShowGuides: (val: boolean) => void;
  showOnionSkin: boolean;
  setShowOnionSkin: (val: boolean) => void;
  selectedGlyph: GlyphArt;
  changeBrickSize: (size: number) => void;
  clearBrickGrid: () => void;
  fillBrickGrid: () => void;
  loadShapeToGrid: () => Promise<void>;
  undoBrick: () => void;
  redoBrick: () => void;
  t: (key: string) => string;
  templateStyle: "none" | "sans" | "serif" | "cursive";
  setTemplateStyle: (val: "none" | "sans" | "serif" | "cursive") => void;
  handleReferenceUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setReferenceImage: (val: string) => void;
}

export default function BrickTypePanel({
  getActiveBrickGrid,
  brickTool,
  setBrickTool,
  showGuides,
  setShowGuides,
  showOnionSkin,
  setShowOnionSkin,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedGlyph,
  changeBrickSize,
  clearBrickGrid,
  fillBrickGrid,
  loadShapeToGrid,
  undoBrick,
  redoBrick,
  t,
  templateStyle,
  setTemplateStyle,
  handleReferenceUpload,
  setReferenceImage,
}: BrickTypePanelProps) {
  const activeSize = getActiveBrickGrid().size;

  return (
    <div className="panel-stack">
      <div className="trace-box">
        <p className="kicker">{t("choose_grid_size")}</p>
        <div className="button-split" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <button
            className={`action-button ${activeSize === 8 ? "active yellow" : ""}`}
            onClick={() => changeBrickSize(8)}
            title="8x8 Grid"
          >
            8x8
          </button>
          <button
            className={`action-button ${activeSize === 16 ? "active yellow" : ""}`}
            onClick={() => changeBrickSize(16)}
            title="16x16 Grid"
          >
            16x16
          </button>
          <button
            className={`action-button ${activeSize === 32 ? "active yellow" : ""}`}
            onClick={() => changeBrickSize(32)}
            title="32x32 Grid"
          >
            32x32
          </button>
        </div>
        <button
          className="action-button yellow"
          onClick={loadShapeToGrid}
          title={t("convert_to_pixelate")}
          style={{
            marginTop: "8px",
            width: "100%",
            fontSize: "0.82rem",
            fontWeight: "900",
            textTransform: "uppercase",
            border: "3px solid var(--line)",
            boxShadow: "4px 4px 0 var(--line)",
          }}
        >
          {t("convert_to_pixelate")}
        </button>
      </div>
      <div className="trace-box">
        <p className="kicker">{t("pixel_tools")}</p>
        <div className="button-split">
          <button
            className={`action-button ${brickTool === "pencil" ? "active yellow" : ""}`}
            onClick={() => setBrickTool("pencil")}
            title={t("pencil")}
          >
            {t("pencil")}
          </button>
          <button
            className={`action-button ${brickTool === "eraser" ? "active yellow" : ""}`}
            onClick={() => setBrickTool("eraser")}
            title={t("eraser")}
          >
            {t("eraser")}
          </button>
        </div>
      </div>
      <div className="button-split">
        <button className="action-button" onClick={clearBrickGrid} title={t("clear_grid")}>
          {t("clear_grid")}
        </button>
        <button className="action-button" onClick={fillBrickGrid} title={t("fill_grid")}>
          {t("fill_grid")}
        </button>
      </div>
      <div className="button-split">
        <button className="action-button" onClick={undoBrick} title="Undo">
          Undo
        </button>
        <button className="action-button" onClick={redoBrick} title="Redo">
          Redo
        </button>
      </div>
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
      {/* Template Image Section */}
      <div style={{ border: "2px solid var(--line)", padding: "12px", borderRadius: "8px", background: "var(--white)", boxShadow: "3px 3px 0 var(--line)" }}>
        <p style={{ margin: "0 0 10px", fontSize: "0.75rem", fontWeight: "900", color: "var(--yellow)", letterSpacing: "0.05em" }}>IMAGE GUIDE / OVERLAY</p>
        <div style={{ display: "flex", gap: "6px" }}>
          <label className="action-button file-label" style={{ flex: 1, minHeight: "32px", fontSize: "0.7rem", padding: "4px 2px", fontWeight: "900", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title={t("upload_ref")}>
            {t("upload_ref")}
            <input accept="image/*" type="file" onChange={handleReferenceUpload} style={{ display: "none" }} />
          </label>
          <button 
            className="action-button" 
            onClick={() => {
              setReferenceImage("");
            }} 
            style={{ flex: 1, minHeight: "32px", fontSize: "0.7rem", padding: "4px 2px", fontWeight: "900", textTransform: "uppercase" }}
            title={t("clear_ref")}
          >
            {t("clear_ref")}
          </button>
        </div>
      </div>
    </div>
  );
}
