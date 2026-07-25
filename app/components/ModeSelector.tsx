import { Mode } from "./types";

interface ModeSelectorProps {
  mode: Mode;
  switchMode: (nextMode: Mode) => void;
  t: (key: string) => string;
}

export default function ModeSelector({
  mode,
  switchMode,
  t,
}: ModeSelectorProps) {
  return (
    <>
      <p className="mode-label">{t("choose_mode")}</p>
      <div className="mode-switch" aria-label="Choose feature">
        <button
          className={`mode-btn ${mode === "typeTapToe" ? "active" : ""}`}
          onClick={() => switchMode("typeTapToe")}
          title={t("typetaptoe_desc")}
        >
          <img src="/icon/1x/icon_typetaptoe.png" alt="TypeTapToe Icon" />
          <span>TypeTapToe</span>
          <span className="tooltip-text">{t("typetaptoe_tooltip")}</span>
        </button>
        <button
          className={`mode-btn ${mode === "fingertype" ? "active" : ""}`}
          onClick={() => switchMode("fingertype")}
          title={t("fingertype_desc")}
        >
          <img src="/icon/1x/icon_fingertype.png" alt="FingerType Icon" />
          <span>FingerType</span>
          <span className="tooltip-text">{t("fingertype_tooltip")}</span>
        </button>
        <button
          className={`mode-btn ${mode === "brickType" ? "active" : ""}`}
          onClick={() => switchMode("brickType")}
          title={t("bricktype_desc")}
        >
          <img src="/icon/1x/icon_bricktype.png" alt="BrickType Icon" />
          <span>BrickType</span>
          <span className="tooltip-text">{t("bricktype_tooltip")}</span>
        </button>
        <button
          className={`mode-btn ${mode === "specimen" ? "active" : ""}`}
          onClick={() => switchMode("specimen")}
          title={t("specimen_desc")}
        >
          <svg
            viewBox="0 0 24 24"
            width="32"
            height="32"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: "6px", transition: "transform 120ms ease" }}
            className="specimen-icon"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>Specimen</span>
          <span className="tooltip-text">{t("specimen_tooltip")}</span>
        </button>
      </div>
    </>
  );
}
