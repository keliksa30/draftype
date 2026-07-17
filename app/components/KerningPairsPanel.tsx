"use client";

import React, { useState } from "react";

interface KerningPairsPanelProps {
  kerningPairs: Record<string, number>;
  onUpdatePair: (pair: string, value: number) => void;
  onDeletePair: (pair: string) => void;
  t: (key: string) => string;
}

export default function KerningPairsPanel({
  kerningPairs,
  onUpdatePair,
  onDeletePair,
  t,
}: KerningPairsPanelProps) {
  const [newPair, setNewPair] = useState("");
  const [newValue, setNewValue] = useState(-5);

  const handleAdd = () => {
    const trimmed = newPair.trim();
    if (trimmed.length !== 2) {
      alert(t("kerning_alert"));
      return;
    }
    onUpdatePair(trimmed, newValue);
    setNewPair("");
  };

  const pairsList = Object.entries(kerningPairs);

  return (
    <div className="export-card" style={{ marginTop: "16px" }}>
      <p className="kicker" style={{ color: "var(--teal)" }}>{t("kerning_title")}</p>
      <h3 style={{ margin: "0 0 10px", fontSize: "1.1rem", fontWeight: 800 }}>Kerning Pairs</h3>

      {/* Form Tambah */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px", alignItems: "flex-end" }}>
        <label style={{ flex: 1, display: "flex", flexDirection: "column", fontSize: "0.78rem" }}>
          {t("kerning_pair")}
          <input
            value={newPair}
            onChange={(e) => setNewPair(e.target.value.slice(0, 2))}
            placeholder="AV"
            style={{
              padding: "4px 8px",
              border: "2px solid var(--line)",
              borderRadius: "4px",
              fontSize: "0.85rem",
              marginTop: "4px",
              textAlign: "center",
              textTransform: "none",
            }}
          />
        </label>
        <label style={{ width: "60px", display: "flex", flexDirection: "column", fontSize: "0.78rem" }}>
          Offset
          <input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(Number(e.target.value))}
            style={{
              padding: "4px 8px",
              border: "2px solid var(--line)",
              borderRadius: "4px",
              fontSize: "0.85rem",
              marginTop: "4px",
              textAlign: "center",
            }}
          />
        </label>
        <button
          className="action-button yellow"
          onClick={handleAdd}
          style={{
            minHeight: "32px",
            padding: "0 12px",
            fontSize: "0.78rem",
            fontWeight: "bold",
          }}
        >
          {t("add_btn")}
        </button>
      </div>

      {/* List Pasangan */}
      {pairsList.length === 0 ? (
        <p style={{ fontSize: "0.8rem", color: "var(--ink)", opacity: 0.6, margin: 0 }}>
          {t("no_kerning")}
        </p>
      ) : (
        <div
          style={{
            maxHeight: "180px",
            overflowY: "auto",
            border: "2px solid var(--line)",
            borderRadius: "6px",
            background: "var(--paper)",
            padding: "6px",
          }}
        >
          {pairsList.map(([pair, value]) => (
            <div
              key={pair}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 4px",
                borderBottom: "1px solid var(--line)",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "0.85rem", fontWeight: "bold", fontFamily: "monospace" }}>
                &quot;{pair}&quot;
              </span>
              <input
                type="range"
                min="-40"
                max="40"
                value={value}
                onChange={(e) => onUpdatePair(pair, Number(e.target.value))}
                style={{ flex: 1, height: "4px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.8rem", width: "26px", textAlign: "right", fontWeight: "bold" }}>
                {value > 0 ? `+${value}` : value}
              </span>
              <button
                onClick={() => onDeletePair(pair)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--red)",
                  fontWeight: "bold",
                  cursor: "pointer",
                  padding: "0 4px",
                  fontSize: "0.85rem",
                }}
                title="Hapus"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
