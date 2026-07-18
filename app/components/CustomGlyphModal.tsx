"use client";
 
import { useState, useEffect } from "react";
 
interface CustomGlyphModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (input: string) => void;
  t: (key: string) => string;
}
 
export default function CustomGlyphModal({ isOpen, onClose, onConfirm, t }: CustomGlyphModalProps) {
  const [inputValue, setInputValue] = useState("");
 
  // Reset input when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputValue("");
    }
  }, [isOpen]);
 
  if (!isOpen) return null;
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(inputValue);
    onClose();
  };
 
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: "420px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: "12px", color: "var(--ink)", textTransform: "uppercase" }}>
          {t("custom_glyph_title")}
        </h3>
        
        <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "18px", color: "var(--ink)", lineHeight: 1.4 }}>
          {t("custom_glyph_prompt")}
        </p>
 
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="á é ñ"
            autoFocus
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: "1.25rem",
              fontWeight: 900,
              border: "3px solid var(--line)",
              borderRadius: "8px",
              background: "var(--white)",
              color: "var(--ink)",
              boxShadow: "3px 3px 0 var(--line)",
              textAlign: "center",
              marginBottom: "18px",
              outline: "none",
            }}
          />
 
          <div className="modal-buttons">
            <button
              type="submit"
              className="action-button yellow"
              style={{ fontWeight: "900" }}
            >
              {t("confirm_yes")}
            </button>
            <button
              type="button"
              className="action-button"
              onClick={onClose}
              style={{ fontWeight: "900" }}
            >
              {t("confirm_no")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
