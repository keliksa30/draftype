import { MagicAction, GlyphArt } from "./types";
import { makeMagicContent } from "./constants";

interface TypeTapToePanelProps {
  traceStatus: string;
  fileName: string;
  traceStyle: "pixel" | "smooth";
  setTraceStyle: (val: "pixel" | "smooth") => void;
  traceThreshold: number;
  setTraceThreshold: (val: number) => void;
  traceDetail: number;
  setTraceDetail: (val: number) => void;
  traceAlpha: number;
  setTraceAlpha: (val: number) => void;
  bgTolerance: number;
  setBgTolerance: (val: number) => void;
  magicLoading: MagicAction | null;
  runMagic: (action: MagicAction, task: () => void | Promise<void>) => Promise<void>;
  removeBackground: () => Promise<void>;
  removeWhites: () => void;
  clearTypeUpload: () => void;
  autotraceImage: () => Promise<void>;
  undoWorkingChange: () => void;
  handleUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (file: File) => void;
  selectedGlyph: GlyphArt;
  updateGlyph: (patch: Partial<GlyphArt>) => void;
  workingSvg: string;
  updateWorkingSvg: (val: string) => void;
  hasTypeDraft: boolean;
  assignWorkingSvg: () => void;
  handleFontImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  t: (key: string) => string;
}

export default function TypeTapToePanel({
  traceStatus,
  fileName,
  traceStyle,
  setTraceStyle,
  traceThreshold,
  setTraceThreshold,
  traceDetail,
  setTraceDetail,
  traceAlpha,
  setTraceAlpha,
  bgTolerance,
  setBgTolerance,
  magicLoading,
  runMagic,
  removeBackground,
  removeWhites,
  clearTypeUpload,
  autotraceImage,
  undoWorkingChange,
  handleUpload,
  handleFileDrop,
  selectedGlyph,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateGlyph,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  workingSvg,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateWorkingSvg,
  hasTypeDraft,
  assignWorkingSvg,
  handleFontImport,
  t,
}: TypeTapToePanelProps) {
  const magicContent = makeMagicContent(magicLoading);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileDrop(file);
    }
  };

  return (
    <div className="panel-stack">
      <div className="upload-grid">
        <label
          className="upload-card upload-choice image-upload"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <span>{t("upload_img")}</span>
          <small>PNG, JPG, WebP</small>
          <input accept="image/png,image/jpeg,image/webp,image/gif" type="file" onChange={handleUpload} />
        </label>
        <label
          className="upload-card upload-choice svg-upload"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <span>{t("upload_svg")}</span>
          <small>{t("upload_svg_sub")}</small>
          <input accept=".svg,image/svg+xml" type="file" onChange={handleUpload} />
        </label>
        <label
          className="action-button magic-button teal font-import-card"
          style={{
            gridColumn: "span 2",
            cursor: "pointer",
          }}
          title={t("upload_font")}
        >
          <img
            src="/icon/1x/icon_upload-font.png"
            alt="Import Font Icon"
            className="font-import-icon"
            style={{ width: "20px", height: "20px", marginBottom: 0 }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "900" }} className="font-import-text">{t("upload_font")}</span>
            <small style={{ fontSize: "0.68rem" }} className="font-import-subtext">{t("upload_font_sub")}</small>
          </div>
          <input
            type="file"
            accept=".ttf,.otf"
            onChange={handleFontImport}
            disabled={magicLoading === "importFont"}
            style={{ display: "none" }}
          />
        </label>
      </div>
      <div className="mini-status">
        <span>{traceStatus}</span>
        <strong>{fileName}</strong>
      </div>
      <div className="button-row">
        <button
          className="action-button magic-button teal"
          disabled={magicLoading === "removeBg"}
          onClick={() => runMagic("removeBg", removeBackground)}
          title={t("remove_bg")}
        >
          {magicContent("removeBg", t("remove_bg"))}
        </button>
        <button
          className="action-button teal"
          onClick={removeWhites}
          title={t("remove_whites")}
        >
          {t("remove_whites")}
        </button>
        <button
          className="action-button"
          onClick={clearTypeUpload}
          title={t("clear_img")}
        >
          {t("clear_img")}
        </button>
      </div>
      <div className="trace-box">
        <p className="kicker">{t("trace_settings")}</p>
        <div className="button-split" style={{ marginBottom: "12px" }}>
          <button
            className={`action-button ${traceStyle === "smooth" ? "active teal" : ""}`}
            onClick={() => setTraceStyle("smooth")}
            title="Smooth"
          >
            {t("smooth")}
          </button>
          <button
            className={`action-button ${traceStyle === "pixel" ? "active teal" : ""}`}
            onClick={() => setTraceStyle("pixel")}
            title="Pixel"
          >
            {t("pixel")}
          </button>
        </div>
        <label className="slider-row compact">
          {t("ink_thickness")}
          <input
            min="20"
            max="230"
            type="range"
            value={traceThreshold}
            onChange={(event) => setTraceThreshold(Number(event.target.value))}
          />
          <span>{traceThreshold}</span>
        </label>
        <label className="slider-row compact">
          {t("detail")}
          <input
            min="2"
            max="8"
            step="2"
            type="range"
            value={traceDetail}
            onChange={(event) => setTraceDetail(Number(event.target.value))}
          />
          <span>{traceDetail}</span>
        </label>
        <label className="slider-row compact">
          {t("transparency")}
          <input
            min="0"
            max="220"
            type="range"
            value={traceAlpha}
            onChange={(event) => setTraceAlpha(Number(event.target.value))}
          />
          <span>{traceAlpha}</span>
        </label>
        <label className="slider-row compact">
          {t("bg_tolerance")}
          <input
            min="8"
            max="120"
            type="range"
            value={bgTolerance}
            onChange={(event) => setBgTolerance(Number(event.target.value))}
          />
          <span>{bgTolerance}</span>
        </label>
        <button
          className="action-button magic-button yellow"
          disabled={magicLoading === "autotrace"}
          onClick={() => runMagic("autotrace", autotraceImage)}
          title={t("trace_btn")}
        >
          {magicContent("autotrace", t("trace_btn"))}
        </button>
        <button
          className="action-button"
          onClick={undoWorkingChange}
          title={t("undo_trace_bg")}
        >
          {t("undo_trace_bg")}
        </button>
        {hasTypeDraft && (
          <button
            className="action-button teal"
            onClick={assignWorkingSvg}
            title={t("apply_place_in")}
          >
            {t("apply_place_in")}
          </button>
        )}
      </div>
    </div>
  );
}
