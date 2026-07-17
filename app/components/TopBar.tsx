import { Lang } from "../utils/i18n";

interface TopBarProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

export default function TopBar({ lang, setLang, t }: TopBarProps) {
  return (
    <section className="topbar" aria-label="Font creator overview">
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <h1>
          <img
            src="/logo_draftype.png"
            alt="DrafType"
            className="topbar-logo"
            style={{ height: "clamp(3.5rem, 10vw, 7.5rem)", display: "block" }}
          />
        </h1>
        <span
          style={{
            fontSize: "clamp(0.7rem, 1.4vw, 0.9rem)",
            fontWeight: "900",
            color: "var(--ink)",
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            opacity: 0.8,
            paddingLeft: "4px",
            marginTop: "8px"
          }}
        >
          by click kanan
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <div className="tagline-container" style={{ textAlign: "right" }}>
          <p
            style={{
              fontSize: "clamp(0.85rem, 1.6vw, 1.2rem)",
              fontWeight: "900",
              color: "var(--ink)",
              margin: 0,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "3px solid var(--line)",
              background: "var(--yellow)",
              padding: "10px 20px",
              boxShadow: "4px 4px 0 var(--line)",
              borderRadius: "8px",
              display: "inline-block",
            }}
          >
            {t("tagline")}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setLang("id")}
            className={`action-button ${lang === "id" ? "active yellow" : ""}`}
            style={{
              padding: "8px 12px",
              fontSize: "0.8rem",
              fontWeight: "900",
              border: "3px solid var(--line)",
              borderRadius: "8px",
              boxShadow: lang === "id" ? "3px 3px 0 var(--line)" : "none",
              cursor: "pointer",
              transform: lang === "id" ? "translate(-2px, -2px)" : "none"
            }}
            title="Bahasa Indonesia Gaul"
          >
            🇮🇩 ID
          </button>
          <button
            onClick={() => setLang("en")}
            className={`action-button ${lang === "en" ? "active yellow" : ""}`}
            style={{
              padding: "8px 12px",
              fontSize: "0.8rem",
              fontWeight: "900",
              border: "3px solid var(--line)",
              borderRadius: "8px",
              boxShadow: lang === "en" ? "3px 3px 0 var(--line)" : "none",
              cursor: "pointer",
              transform: lang === "en" ? "translate(-2px, -2px)" : "none"
            }}
            title="English translation"
          >
            🇬🇧 EN
          </button>
        </div>
      </div>
    </section>
  );
}
