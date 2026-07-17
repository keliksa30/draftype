import { GlyphArt, MagicAction } from "./types";
import { makeMagicContent } from "./constants";

interface GlyphEditPanelProps {
  filledCount: number;
  activeGlyph: string;
  selectedGlyph: GlyphArt;
  magicLoading: MagicAction | null;
  updateGlyph: (patch: Partial<GlyphArt>) => void;
  runMagic: (action: MagicAction, task: () => void | Promise<void>) => Promise<void>;
  autoKern: () => void;
  autoNeat: () => void;
  revertAutoEdit: () => void;
  t: (key: string) => string;
}

export default function GlyphEditPanel({
  filledCount,
  activeGlyph,
  selectedGlyph,
  magicLoading,
  updateGlyph,
  runMagic,
  autoKern,
  autoNeat,
  revertAutoEdit,
  t,
}: GlyphEditPanelProps) {
  const magicContent = makeMagicContent(magicLoading);

  return (
    <>
      <div
        className="stats-card"
        style={{ width: "100%", marginBottom: "16px", padding: "12px", justifyContent: "center" }}
        title={t("glyphs_done")}
      >
        <span>{filledCount}</span>
        {t("glyphs_done")}
      </div>
      <div className="glyph-stage">
        <span className="stage-label">{t("stage_label")} {activeGlyph}</span>
        {selectedGlyph.svg ? (
          <div
            className="stage-art"
            style={{
              transform: `translate(${selectedGlyph.x}px, ${selectedGlyph.y}px) rotate(${selectedGlyph.rotation}deg) scale(${selectedGlyph.scale / 100})`,
            }}
            dangerouslySetInnerHTML={{ __html: selectedGlyph.svg }}
          />
        ) : (
          <b>{activeGlyph}</b>
        )}
      </div>

      <div className="control-stack">
        <label className="slider-row">
          {t("scale_slider")}
          <input
            min="35"
            max="145"
            type="range"
            value={selectedGlyph.scale}
            onChange={(event) => updateGlyph({ scale: Number(event.target.value) })}
          />
          <span>{selectedGlyph.scale}%</span>
        </label>
        <label className="slider-row">
          {t("rotation_slider")}
          <input
            min="-35"
            max="35"
            type="range"
            value={selectedGlyph.rotation}
            onChange={(event) => updateGlyph({ rotation: Number(event.target.value) })}
          />
          <span>{selectedGlyph.rotation}°</span>
        </label>
        <label className="slider-row">
          {t("offset_x_slider")}
          <input
            min="-32"
            max="32"
            type="range"
            value={selectedGlyph.x}
            onChange={(event) => updateGlyph({ x: Number(event.target.value) })}
          />
          <span>{selectedGlyph.x}</span>
        </label>
        <label className="slider-row">
          {t("offset_y_slider")}
          <input
            min="-32"
            max="32"
            type="range"
            value={selectedGlyph.y}
            onChange={(event) => updateGlyph({ y: Number(event.target.value) })}
          />
          <span>{selectedGlyph.y}</span>
        </label>
        <label className="slider-row kerning">
          {t("spacing_slider")}
          <input
            min="-40"
            max="40"
            type="range"
            value={selectedGlyph.kerning}
            onChange={(event) => updateGlyph({ kerning: Number(event.target.value) })}
          />
          <span>{selectedGlyph.kerning}</span>
        </label>
        <button
          className="action-button magic-button teal"
          disabled={magicLoading === "autoKern"}
          onClick={() => runMagic("autoKern", autoKern)}
          title={t("auto_spacing_btn")}
        >
          {magicContent("autoKern", t("auto_spacing_btn"))}
        </button>
        <div className="button-row">
          <button
            className="action-button magic-button yellow"
            disabled={magicLoading === "autoNeat"}
            onClick={() => runMagic("autoNeat", autoNeat)}
            title={t("auto_neat_btn")}
          >
            {magicContent("autoNeat", t("auto_neat_btn"))}
          </button>
          <button
            className="action-button"
            onClick={revertAutoEdit}
            title={t("revert_btn")}
          >
            {t("revert_btn")}
          </button>
        </div>
        <button
          className="action-button"
          onClick={() => updateGlyph({ scale: 100, rotation: 0, x: 0, y: 0, kerning: 0 })}
          style={{ marginTop: "12px", width: "100%" }}
          title={t("reset_all_btn")}
        >
          {t("reset_all_btn")}
        </button>
      </div>
    </>
  );
}
