"use client";

import { useEffect, useState } from "react";
/* eslint-disable react-hooks/set-state-in-effect */

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Sync with localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("draftype_dark_mode");
    if (saved === "true") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("draftype_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("draftype_dark_mode", "false");
    }
  };

  return (
    <div className="dark-mode-dock">
      <p className="kicker" style={{ margin: "0 0 8px", textAlign: "center" }}>
        TAMPILAN
      </p>
      <button
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
        className={`dark-toggle-btn ${isDark ? "is-dark" : "is-light"}`}
      >
        <span className="toggle-track">
          <span className="toggle-thumb">
            {isDark ? (
              /* Moon */
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              /* Sun */
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
                <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
                <line x1="19.78" y1="4.22" x2="17.66" y2="6.34" />
                <line x1="6.34" y1="17.66" x2="4.22" y2="19.78" />
              </svg>
            )}
          </span>
        </span>
        <span className="toggle-label">
          {isDark ? "MODE GELAP" : "MODE TERANG"}
        </span>
      </button>
    </div>
  );
}
