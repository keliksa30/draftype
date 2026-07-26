import { RefObject } from "react";
import { GlyphArt } from "./types";
import { useI18n } from "../utils/i18n";

interface GlyphStripProps {
  glyphs: readonly string[];
  glyphMap: Record<string, GlyphArt>;
  activeGlyph: string;
  setActiveGlyph: (glyph: string) => void;
  glyphScroll: number;
  glyphStripRef: RefObject<HTMLDivElement | null>;
  scrollGlyphStrip: (direction: -1 | 1) => void;
  setGlyphStripScroll: (val: number) => void;
  updateGlyphScroll: () => void;
  onAddCustomGlyphClick: () => void;
}

export default function GlyphStrip({
  glyphs,
  glyphMap,
  activeGlyph,
  setActiveGlyph,
  glyphScroll,
  glyphStripRef,
  scrollGlyphStrip,
  setGlyphStripScroll,
  updateGlyphScroll,
  onAddCustomGlyphClick,
}: GlyphStripProps) {
  const { t } = useI18n();

  return (
    <>
      <div className="glyph-select-header">{t("glyph_select_header")}</div>
      <div className="glyph-carousel">
        <button
          className="glyph-arrow prev"
          onClick={() => scrollGlyphStrip(-1)}
          aria-label="Previous glyphs"
        >
          <span aria-hidden="true" />
        </button>
        <div className="glyph-track">
          <div
            ref={glyphStripRef}
            className="glyph-grid glyph-strip"
            onScroll={updateGlyphScroll}
          >
            {glyphs.map((glyph) => {
              const item = glyphMap[glyph];
              let iconSvg = "";
              if (item?.svg) {
                const contentMatch = item.svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
                let innerContent = contentMatch ? contentMatch[1] : item.svg;
                innerContent = innerContent
                  .replace(/fill=["']#000000["']/gi, 'fill="currentColor"')
                  .replace(/fill=["']black["']/gi, 'fill="currentColor"')
                  .replace(/stroke=["']#000000["']/gi, 'stroke="currentColor"')
                  .replace(/stroke=["']black["']/gi, 'stroke="currentColor"')
                  .replace(/#000000/gi, "currentColor")
                  .replace(/black/gi, "currentColor");

                const viewBox = item.svg.match(/viewBox=["']([^"']+)["']/i)?.[1];
                const viewParts = viewBox?.split(/\s+/).map(Number) ?? [0, 0, 1000, 1000];
                const [, , viewWidth = 1000, viewHeight = 1000] = viewParts;

                iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewParts[0]} ${viewParts[1]} ${viewWidth} ${viewHeight}" fill="currentColor" stroke="currentColor" style="width:100%;height:100%;display:block;overflow:visible;"><g fill="currentColor" stroke="currentColor">${innerContent}</g></svg>`;
              }

              return (
                <button
                  className={`glyph-cell ${glyph === activeGlyph ? "selected" : ""} ${
                    item?.svg ? "filled" : ""
                  }`}
                  key={glyph}
                  onClick={() => setActiveGlyph(glyph)}
                  aria-label={`Edit glyph ${glyph}`}
                >
                  <span>{glyph}</span>
                  {iconSvg ? (
                    <i
                      style={{
                        transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg) scale(${item.scale / 100})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "70%",
                        height: "70%",
                      }}
                      dangerouslySetInnerHTML={{ __html: iconSvg }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          <label className="glyph-scroll" aria-label="Scroll glyph strip">
            <input
              type="range"
              min="0"
              max="100"
              value={glyphScroll}
              onChange={(event) => setGlyphStripScroll(Number(event.target.value))}
            />
          </label>
        </div>
        <button
          className="glyph-arrow next"
          onClick={() => scrollGlyphStrip(1)}
          aria-label="Next glyphs"
        >
          <span aria-hidden="true" />
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "18px" }}>
        <button
          className="action-button yellow"
          style={{
            width: "auto",
            minHeight: "40px",
            padding: "8px 20px",
            fontSize: "0.78rem",
            fontWeight: "900",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
          onClick={onAddCustomGlyphClick}
        >
          ➕ {t("custom_glyph_trigger")}
        </button>
      </div>
    </>
  );
}
