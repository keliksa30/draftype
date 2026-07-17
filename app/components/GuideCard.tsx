import { Mode } from "./types";

interface GuideCardProps {
  mode: Mode;
  uploadedImage: string;
  t: (key: string) => string;
}

export default function GuideCard({ mode, uploadedImage, t }: GuideCardProps) {
  return (
    <div className="guide-card">
      <strong>
        {mode === "typeTapToe"
          ? t("guide_ttt_title")
          : mode === "fingertype"
            ? t("guide_ft_title")
            : t("guide_bt_title")}
      </strong>
      <span>
        {mode === "typeTapToe"
          ? t("guide_ttt_desc")
          : mode === "fingertype"
            ? uploadedImage
              ? t("guide_ft_desc_img")
              : t("guide_ft_desc")
            : t("guide_bt_desc")}
      </span>
    </div>
  );
}
