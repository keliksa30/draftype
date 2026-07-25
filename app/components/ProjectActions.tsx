// app/components/ProjectActions.tsx
"use client";

import React from "react";

type Props = {
  onSave: () => void;
  onLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewProject: () => void;
  onClearAll: () => void;
  t: (key: string) => string;
};

const ProjectActions: React.FC<Props> = ({ onSave, onLoad, onNewProject, onClearAll, t }) => {
  return (
    <div className="project-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
      <button
        className="action-button yellow"
        onClick={onNewProject}
        title={t("new_project")}
        style={{ minHeight: '40px', fontSize: '0.8rem', fontWeight: 'bold' }}
      >
        {t("new_project")}
      </button>
      <button
        className="action-button"
        onClick={onClearAll}
        title={t("clear_all")}
        style={{ minHeight: '40px', fontSize: '0.8rem', fontWeight: 'bold' }}
      >
        {t("clear_all")}
      </button>
      <button
        className="action-button"
        onClick={onSave}
        title={t("save_project")}
        style={{ minHeight: '40px', fontSize: '0.8rem', fontWeight: 'bold' }}
      >
        {t("save_project")}
      </button>
      <label
        className="action-button"
        style={{ minHeight: '40px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        {t("open_project")}
        <input
          type="file"
          accept=".draftype,application/json"
          onChange={onLoad}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
};

export default ProjectActions;
