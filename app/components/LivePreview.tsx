import { GlyphArt } from "./types";
import { getGlyphWidth } from "./constants";

interface LivePreviewProps {
  previewText: string;
  setPreviewText: (val: string) => void;
  glyphMap: Record<string, GlyphArt>;
}

export default function LivePreview({ previewText, setPreviewText, glyphMap }: LivePreviewProps) {
  return (
    <div className="live-card focus-live-card">
      <label>
        Live preview
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
          return art?.svg ? (
            <span
              className="live-glyph"
              key={`${letter}-${index}`}
              style={{
                width: `${(getGlyphWidth(art.svg) / 100) * 58}px`,
                marginRight: art.kerning,
                transform: `translate(${art.x ?? 0}%, ${art.y ?? 0}%) rotate(${art.rotation ?? 0}deg) scale(${(art.scale ?? 100) / 100})`,
                transformOrigin: "center",
              }}
              dangerouslySetInnerHTML={{ __html: art.svg }}
            />
          ) : (
            <span className="live-fallback" key={`${letter}-${index}`}>
              {letter}
            </span>
          );
        })}
      </div>
    </div>
  );
}
