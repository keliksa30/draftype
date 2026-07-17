import { MagicAction } from "./types";
import { makeMagicContent } from "./constants";

interface ExportPanelProps {
  fontName: string;
  setFontName: (val: string) => void;
  fontDesigner: string;
  setFontDesigner: (val: string) => void;
  fontStyle: string;
  setFontStyle: (val: string) => void;
  fontVersion: string;
  setFontVersion: (val: string) => void;
  fontLicense: string;
  setFontLicense: (val: string) => void;
  exportStatus: string;
  magicLoading: MagicAction | null;
  runMagic: (action: MagicAction, task: () => void | Promise<void>) => Promise<void>;
  exportFont: (format: "otf" | "ttf") => Promise<void>;
  t: (key: string) => string;
}

export default function ExportPanel({
  fontName,
  setFontName,
  fontDesigner,
  setFontDesigner,
  fontStyle,
  setFontStyle,
  fontVersion,
  setFontVersion,
  fontLicense,
  setFontLicense,
  exportStatus,
  magicLoading,
  runMagic,
  exportFont,
  t,
}: ExportPanelProps) {
  const magicContent = makeMagicContent(magicLoading);

  return (
    <div className="export-card">
      <label>
        {t("font_name")}
        <input
          value={fontName}
          placeholder={t("font_name_placeholder")}
          onChange={(event) => setFontName(event.target.value)}
          aria-label={t("font_name")}
        />
      </label>

      <div className="metadata-grid">
        <p className="kicker" style={{ margin: "0 0 6px" }}>{t("font_metadata")}</p>
        <label>
          {t("font_designer")}
          <input
            value={fontDesigner}
            placeholder={t("font_designer_placeholder")}
            onChange={(event) => setFontDesigner(event.target.value)}
          />
        </label>
        <label>
          {t("font_style")}
          <input
            value={fontStyle}
            placeholder={t("font_style_placeholder")}
            onChange={(event) => setFontStyle(event.target.value)}
          />
        </label>
        <label>
          {t("font_version")}
          <input
            value={fontVersion}
            placeholder="1.0.0"
            onChange={(event) => setFontVersion(event.target.value)}
          />
        </label>
        <label>
          {t("font_license")}
          <input
            value={fontLicense}
            placeholder={t("font_license_placeholder")}
            onChange={(event) => setFontLicense(event.target.value)}
          />
        </label>
      </div>

      <div className="button-row" style={{ marginTop: "16px" }}>
        <button
          className="action-button magic-button yellow"
          disabled={magicLoading === "exportOtf"}
          onClick={() => runMagic("exportOtf", () => exportFont("otf"))}
          title={t("export_otf")}
        >
          {magicContent("exportOtf", t("export_otf"))}
        </button>
        <button
          className="action-button magic-button teal"
          disabled={magicLoading === "exportTtf"}
          onClick={() => runMagic("exportTtf", () => exportFont("ttf"))}
          title={t("export_ttf")}
        >
          {magicContent("exportTtf", t("export_ttf"))}
        </button>
      </div>
      <p style={{ marginTop: "10px", fontSize: "0.8rem", fontWeight: "bold" }}>{exportStatus}</p>
    </div>
  );
}
