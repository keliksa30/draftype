import { GlyphArt } from "./types";
import { cropSvgToAdvance, getGlyphBounds } from "./constants";
import { useI18n } from "../utils/i18n";

interface LivePreviewProps {
  previewText: string;
  setPreviewText: (val: string) => void;
  glyphMap: Record<string, GlyphArt>;
}

// Height of the glyph container in px (used as the cap-height reference)
const GLYPH_H = 58;

export default function LivePreview({ previewText, setPreviewText, glyphMap }: LivePreviewProps) {
  const { t } = useI18n();

  return (
    <div className="live-card focus-live-card">
      <label>
        {t("live_preview")}
        <input
          value={previewText}
          onChange={(event) => setPreviewText(event.target.value)}
          aria-label="Live font preview text"
        />
      </label>
      <div className="live-font-preview" aria-label="Typed font preview">
        {[...previewText].map((letter, index) => {
          const art = glyphMap[letter];
          if (letter === " ") return <span key={`${letter}-${index}`} className="live-space" />;

          if (!art?.svg) {
            return (
              <span className="live-fallback" key={`${letter}-${index}`}>
                {letter}
              </span>
            );
          }

          const bounds = getGlyphBounds(art.svg);
          const kerningScale = GLYPH_H / (bounds.gridHeight || 16);
          const kerningPx = (art.kerning ?? 0) * kerningScale;
          const { svg: croppedSvg, widthRatio } = cropSvgToAdvance(art.svg, 0.06);
          const containerW = widthRatio * GLYPH_H;

          return (
            <span
              className="live-glyph"
              key={`${letter}-${index}`}
              style={{
                display: "inline-block",
                width: `${Math.max(8, containerW + kerningPx)}px`,
                height: `${GLYPH_H}px`,
                flexShrink: 0,
                transform: art.y || art.rotation
                  ? `translateY(${art.y ?? 0}%) rotate(${art.rotation ?? 0}deg)`
                  : undefined,
                transformOrigin: "center bottom",
              }}
              dangerouslySetInnerHTML={{ __html: croppedSvg }}
            />
          );
        })}
      </div>
    </div>
  );
}
