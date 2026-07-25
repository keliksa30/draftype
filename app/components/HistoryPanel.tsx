"use client";

import React from "react";

interface HistoryPanelProps {
  history: { description: string }[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
  t: (key: string) => string;
}

export default function HistoryPanel({ history, currentIndex, onJumpTo, t }: HistoryPanelProps) {
  return (
    <div className="export-card" style={{ marginTop: "16px" }}>
      <p className="kicker" style={{ color: "var(--red)" }}>{t("history_title")}</p>
      <h3 style={{ margin: "0 0 10px", fontSize: "1.1rem", fontWeight: 800 }}>History</h3>
      
      {history.length === 0 ? (
        <p style={{ fontSize: "0.8rem", color: "var(--ink)", opacity: 0.6, margin: 0 }}>
          {t("no_history")}
        </p>
      ) : (
        <div
          style={{
            maxHeight: "160px",
            overflowY: "auto",
            border: "2px solid var(--line)",
            borderRadius: "6px",
            background: "var(--paper)",
            padding: "4px",
          }}
          className="history-list"
        >
          {history.map((entry, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={index}
                onClick={() => onJumpTo(index)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: isActive ? "var(--yellow)" : "transparent",
                  color: isActive ? "#0f1117" : "var(--ink)",
                  border: "none",
                  borderBottom: "1px solid var(--line)",
                  padding: "6px 8px",
                  fontSize: "0.78rem",
                  fontWeight: isActive ? "bold" : "normal",
                  cursor: "pointer",
                  borderRadius: "4px",
                  marginBottom: "2px",
                }}
                title={`Jump to: ${entry.description}`}
              >
                <span style={{ marginRight: "6px", opacity: 0.5 }}>#{index + 1}</span>
                {entry.description}
                {isActive && <span style={{ float: "right", fontSize: "0.7rem" }}>👈 {t("history_active")}</span>}
              </button>
            );
          })}
        </div>
      )}
      
      <p style={{ fontSize: "0.7rem", color: "var(--ink)", opacity: 0.6, marginTop: "8px", marginBottom: 0 }}>
        {t("history_help")}
      </p>
    </div>
  );
}
