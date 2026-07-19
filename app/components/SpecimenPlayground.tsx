"use client";

import React, { useState } from "react";
import { GlyphArt } from "./types";
import { computeGlyphAdvance, getGlyphBounds } from "./constants";
import { useI18n } from "../utils/i18n";

interface SpecimenPlaygroundProps {
  glyphMap: Record<string, GlyphArt>;
  borderSpacing?: number; // unused but kept for interface match if any
  kerningPairs: Record<string, number>;
}

export default function SpecimenPlayground({ glyphMap, kerningPairs }: SpecimenPlaygroundProps) {
  const { t } = useI18n();
  const [text, setText] = useState(
    "The quick brown fox jumps over the lazy dog.\n\n" +
    "DRAFTYPE - SANGAT PRESISI & PREMIUM.\n" +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ\n" +
    "abcdefghijklmnopqrstuvwxyz\n" +
    "0123456789"
  );
  
  const [fontSize, setFontSize] = useState(28);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [wordSpacing, setWordSpacing] = useState(12);
  const [align, setAlign] = useState<"left" | "center" | "right">("left");

  // Render individual letters inside a word, applying individual kerning and pair kerning
  const renderWord = (word: string, wordIdx: number) => {
    return (
      <span
        key={`word-${wordIdx}`}
        style={{
          display: "inline-flex",
          flexWrap: "nowrap",
          marginRight: `${wordSpacing}px`,
        }}
      >
        {[...word].map((letter, letterIdx) => {
          const art = glyphMap[letter];
          const nextLetter = word[letterIdx + 1] || "";
          
          // Total kerning = sidebearing kerning + pair kerning
          const pairKey = letter + nextLetter;
          const pairKern = kerningPairs[pairKey] ?? 0;
          const individualKern = art?.kerning ?? 0;
          const totalKern = individualKern + pairKern + letterSpacing;

          if (art?.svg) {
            const { advanceWidth, xShift } = computeGlyphAdvance(art, "proportional");
            // Scale base advance width to target font size
            const baseWidth = advanceWidth * (fontSize / 1000);
            
            // Scaled pair kerning & custom tracking (letter spacing)
            const pairKernPx = pairKern * 8 * (fontSize / 1000);
            const letterSpacingPx = letterSpacing * 8 * (fontSize / 1000);
            const totalWidth = baseWidth + pairKernPx + letterSpacingPx;

            const bounds = getGlyphBounds(art.svg);
            const viewBox = art.svg.match(/viewBox=["']([^"']+)["']/i)?.[1];
            const viewParts = viewBox?.split(/\s+/).map(Number) ?? [0, 0, 100, 100];
            const [, , viewWidth = 100, viewHeight = 100] = viewParts;
            const scale = ((art.scale ?? 100) / 100) * (700 / Math.max(viewWidth, viewHeight, 1));
            
            const centerX = viewWidth / 2;
            const centerY = viewHeight / 2;

            const contentMatch = art.svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
            const innerContent = contentMatch ? contentMatch[1] : "";

            // Match the UPM baseline offset (790) used in font export for perfect vertical alignment
            const translateY = 790 - (0.74 * viewHeight) * scale + (art.y ?? 0) * 5;

            const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="currentColor" style="width: 100%; height: 100%; display: block; overflow: visible;">
              <g transform="translate(${150 + xShift + (art.x ?? 0) * 5}, ${translateY}) scale(${scale}) translate(${-viewParts[0]}, ${-viewParts[1]}) rotate(${art.rotation ?? 0}, ${centerX}, ${centerY})">
                ${innerContent}
              </g>
            </svg>`;

            return (
              <span
                key={`letter-${letterIdx}`}
                style={{
                  display: "inline-block",
                  width: `${Math.max(4, totalWidth)}px`,
                  height: `${fontSize}px`,
                  position: "relative",
                }}
                className="specimen-glyph"
                dangerouslySetInnerHTML={{ __html: previewSvg }}
              />
            );
          } else {
            // Fallback for missing characters
            const pairKernPx = pairKern * 8 * (fontSize / 1000);
            const letterSpacingPx = letterSpacing * 8 * (fontSize / 1000);
            return (
              <span
                key={`letter-${letterIdx}`}
                style={{
                  display: "inline-block",
                  fontSize: `${fontSize}px`,
                  lineHeight: 1,
                  fontFamily: "monospace",
                  marginRight: `${Math.max(2, pairKernPx + letterSpacingPx)}px`,
                  color: "var(--ink)",
                  opacity: 0.4,
                }}
              >
                {letter}
              </span>
            );
          }
        })}
      </span>
    );
  };

  // Split text by lines
  const paragraphs = text.split("\n");

  return (
    <div className="specimen-container" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      {/* Controls Bar */}
      <div
        className="export-card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          padding: "16px",
          background: "var(--white)",
        }}
      >
        <label className="slider-row" style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem" }}>
          {t("font_size")} ({fontSize}px)
          <input
            type="range"
            min="16"
            max="64"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
        </label>

        <label className="slider-row" style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem" }}>
          {t("line_height")} ({lineHeight})
          <input
            type="range"
            min="1"
            max="2.5"
            step="0.1"
            value={lineHeight}
            onChange={(e) => setLineHeight(Number(e.target.value))}
          />
        </label>

        <label className="slider-row" style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem" }}>
          {t("letter_spacing")} ({letterSpacing}px)
          <input
            type="range"
            min="-10"
            max="15"
            value={letterSpacing}
            onChange={(e) => setLetterSpacing(Number(e.target.value))}
          />
        </label>

        <label className="slider-row" style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem" }}>
          {t("word_spacing")} ({wordSpacing}px)
          <input
            type="range"
            min="4"
            max="30"
            value={wordSpacing}
            onChange={(e) => setWordSpacing(Number(e.target.value))}
          />
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem" }}>
          {t("align_paragraph")}
          <div style={{ display: "flex", gap: "4px" }}>
            {(["left", "center", "right"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setAlign(mode)}
                className={`action-button ${align === mode ? "active yellow" : ""}`}
                style={{
                  flex: 1,
                  minHeight: "32px",
                  fontSize: "0.75rem",
                  padding: 0,
                  textTransform: "capitalize",
                }}
              >
                {mode === "left" ? t("align_left") : mode === "center" ? t("align_center") : t("align_right")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor & Render Columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", minHeight: "350px", flex: 1 }}>
        {/* Input Textarea */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.78rem", marginBottom: "4px", color: "var(--ink)", fontWeight: "bold" }}>
            {t("test_text_label")}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              flex: 1,
              width: "100%",
              minHeight: "280px",
              padding: "12px",
              border: "3px solid var(--line)",
              borderRadius: "8px",
              boxShadow: "4px 4px 0 var(--line)",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              background: "var(--white)",
              color: "var(--ink)",
              resize: "none",
            }}
          />
        </div>

        {/* Live SVG Specimen Render Card */}
        <div
          style={{
            border: "3px solid var(--line)",
            borderRadius: "8px",
            boxShadow: "4px 4px 0 var(--line)",
            background: "var(--white)",
            padding: "16px",
            overflowY: "auto",
            maxHeight: "450px",
          }}
        >
          <label style={{ display: "block", fontSize: "0.78rem", marginBottom: "8px", opacity: 0.6, fontWeight: "bold" }}>
            {t("print_specimen_label")}
          </label>
          
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: align === "left" ? "flex-start" : align === "center" ? "center" : "flex-end",
              textAlign: align,
            }}
          >
            {paragraphs.map((pText, pIdx) => {
              if (pText.trim() === "") {
                return <div key={`p-${pIdx}`} style={{ height: `${fontSize * lineHeight}px`, width: "100%" }} />;
              }
              const words = pText.split(" ");
              return (
                <div
                  key={`p-${pIdx}`}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    width: "100%",
                    lineHeight: lineHeight,
                    justifyContent: align === "left" ? "flex-start" : align === "center" ? "center" : "flex-end",
                    marginBottom: `${fontSize * (lineHeight - 1)}px`,
                  }}
                >
                  {words.map((word, wordIdx) => renderWord(word, wordIdx))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
