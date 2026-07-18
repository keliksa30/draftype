import { GlyphArt } from "./types";
import { computeGlyphAdvance, getGlyphBounds } from "./constants";
import { useI18n } from "../utils/i18n";

interface LivePreviewProps {
  previewText: string;
  setPreviewText: (val: string) => void;
  glyphMap: Record<string, GlyphArt>;
}

// Height of the glyph container in px
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

          const { advanceWidth, xShift } = computeGlyphAdvance(art, "proportional");
          const containerW = advanceWidth * (GLYPH_H / 1000);

          const bounds = getGlyphBounds(art.svg);
          const viewBox = art.svg.match(/viewBox=["']([^"']+)["']/i)?.[1];
          const viewParts = viewBox?.split(/\s+/).map(Number) ?? [0, 0, 100, 100];
          const [, , viewWidth = 100, viewHeight = 100] = viewParts;
          const scale = ((art.scale ?? 100) / 100) * (700 / Math.max(viewWidth, viewHeight, 1));
          
          const centerX = viewWidth / 2;
          const centerY = viewHeight / 2;

          const contentMatch = art.svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
          const innerContent = contentMatch ? contentMatch[1] : "";

          // The SVG uses a 1000x1000 UPM viewBox.
          // Inside it, we translate and scale the original SVG paths using the exact OTF/TTF mapping.
          const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="currentColor" style="width: 100%; height: 100%; display: block; overflow: visible;">
            <g transform="translate(${150 + xShift + (art.x ?? 0) * 5}, ${60 + (art.y ?? 0) * 5}) scale(${scale}) translate(${-viewParts[0]}, ${-viewParts[1]}) rotate(${art.rotation ?? 0}, ${centerX}, ${centerY})">
              ${innerContent}
            </g>
          </svg>`;

          return (
            <span
              className="live-glyph"
              key={`${letter}-${index}`}
              style={{
                display: "inline-block",
                width: `${Math.max(4, containerW)}px`,
                height: `${GLYPH_H}px`,
                flexShrink: 0,
                position: "relative",
              }}
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          );
        })}
      </div>
    </div>
  );
}
