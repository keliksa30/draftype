import { Dispatch, SetStateAction } from "react";
import { ConfirmModalState } from "./types";

interface ConfirmModalProps {
  confirmModal: ConfirmModalState;
  setConfirmModal: Dispatch<SetStateAction<ConfirmModalState>>;
  t: (key: string) => string;
}

export default function ConfirmModal({ confirmModal, setConfirmModal, t }: ConfirmModalProps) {
  if (!confirmModal.isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p className="modal-message">{confirmModal.message}</p>
        <div className="modal-buttons">
          <button
            className="action-button yellow"
            onClick={() => {
              confirmModal.onConfirm();
              setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            }}
          >
            {t("confirm_yes")}
          </button>
          <button
            className="action-button"
            onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          >
            {t("confirm_no")}
          </button>
        </div>
      </div>
    </div>
  );
}
