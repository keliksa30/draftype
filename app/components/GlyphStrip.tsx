import { RefObject } from "react";
import { GlyphArt } from "./types";

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
}: GlyphStripProps) {
  return (
    <>
      <div className="glyph-select-header">Select your glyphs here</div>
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
                  {item?.svg ? (
                    <i
                      style={{
                        transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg) scale(${item.scale / 100})`,
                      }}
                      dangerouslySetInnerHTML={{ __html: item.svg }}
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
    </>
  );
}
