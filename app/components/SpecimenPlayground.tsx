"use client";

import React, { useState } from "react";
import { GlyphArt } from "./types";
import { cropSvgToAdvance } from "./constants";
import { useI18n } from "../utils/i18n";

interface SpecimenPlaygroundProps {
  glyphMap: Record<string, GlyphArt>;
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
            // Crop SVG to bounding box with standard 6% sidebearing (matching live preview)
            const { svg: croppedSvg, widthRatio } = cropSvgToAdvance(art.svg, 0.06);
            const glyphW = widthRatio * fontSize;
            // Apply total kerning (individual + pair + letter spacing)
            const totalKernPx = totalKern * (fontSize / 36);
            return (
              <span
                key={`letter-${letterIdx}`}
                style={{
                  display: "inline-block",
                  width: `${Math.max(4, glyphW + totalKernPx)}px`,
                  height: `${fontSize}px`,
                  transform: art.y || art.rotation
                    ? `translateY(${art.y ?? 0}%) rotate(${art.rotation ?? 0}deg)`
                    : undefined,
                  transformOrigin: "center bottom",
                }}
                className="specimen-glyph"
                dangerouslySetInnerHTML={{ __html: croppedSvg }}
              />
            );
          } else {
            // Fallback for missing characters
            return (
              <span
                key={`letter-${letterIdx}`}
                style={{
                  display: "inline-block",
                  fontSize: `${fontSize}px`,
                  lineHeight: 1,
                  fontFamily: "monospace",
                  marginRight: `${totalKern * (fontSize / 36)}px`,
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
