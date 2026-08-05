import React, { useEffect, useState } from 'react';
import { useHistoryImport } from '../hooks';
import HistoryDropZone from './history-import/HistoryDropZone';
import HistoryImportHeader from './history-import/HistoryImportHeader';
import HistoryNoticeAlerts from './history-import/HistoryNoticeAlerts';
import HistoryPreviewResults from './history-import/HistoryPreviewResults';
import LastImportUndoCard from './history-import/LastImportUndoCard';

interface HistoryImportPanelProps {
  historyImport: ReturnType<typeof useHistoryImport>;
}

export const HistoryImportPanel: React.FC<HistoryImportPanelProps> = ({ historyImport }) => {
  const {
    files,
    preview,
    result,
    undoResult,
    lastImport,
    error,
    isPreviewing,
    isImporting,
    isUndoing,
    selectFiles,
    previewFiles,
    importFiles,
    undoLastImport,
  } = historyImport;
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setConfirmed(false);
  }, [preview?.digest, files]);

  return (
    <section className="history-import-panel">
      <style>{`
        .history-import-panel {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 26px;
          box-shadow: 0 6px 22px rgba(15, 23, 42, 0.05);
        }
        .history-import-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }
        .history-import-heading h2 {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0 0 7px;
          color: #172033;
          font-size: 20px;
        }
        .history-import-heading p {
          max-width: 760px;
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.65;
        }
        .history-import-badge {
          flex: 0 0 auto;
          padding: 7px 11px;
          border-radius: 999px;
          color: #166534;
          background: #dcfce7;
          font-size: 12px;
          font-weight: 600;
        }
        .history-drop-zone {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 20px;
          border: 1px dashed #94a3b8;
          border-radius: 12px;
          background: #f8fafc;
        }
        .history-undo-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
          padding: 15px 17px;
          border: 1px solid #fed7aa;
          border-radius: 10px;
          background: #fff7ed;
        }
        .history-undo-card strong { display: block; color: #9a3412; margin-bottom: 4px; }
        .history-undo-card small { color: #78716c; line-height: 1.5; }
        .history-drop-copy {
          display: flex;
          align-items: center;
          gap: 13px;
          color: #334155;
        }
        .history-drop-copy small {
          display: block;
          margin-top: 4px;
          color: #64748b;
        }
        .history-file-input {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }
        .history-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 40px;
          padding: 8px 15px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
          color: #334155;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        .history-action:hover:not(:disabled) { border-color: #3b82f6; color: #1d4ed8; }
        .history-action:disabled { cursor: not-allowed; opacity: 0.55; }
        .history-action.primary { color: #fff; background: #2563eb; border-color: #2563eb; }
        .history-action.danger { color: #fff; background: #b42318; border-color: #b42318; }
        .history-file-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 9px;
          margin-top: 14px;
        }
        .history-file {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #334155;
          background: #fff;
          font-size: 13px;
        }
        .history-file span:first-child {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .history-file span:last-child { flex: 0 0 auto; color: #94a3b8; }
        .history-preview-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
        }
        .history-preview {
          margin-top: 22px;
          padding-top: 22px;
          border-top: 1px solid #e2e8f0;
        }
        .history-preview-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 13px;
        }
        .history-preview-title h3 { margin: 0; color: #1e293b; font-size: 16px; }
        .history-digest { color: #94a3b8; font-family: monospace; font-size: 12px; }
        .history-count-table {
          width: 100%;
          border-collapse: collapse;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          font-size: 14px;
        }
        .history-count-table th, .history-count-table td {
          padding: 10px 14px;
          border-bottom: 1px solid #e2e8f0;
          text-align: right;
        }
        .history-count-table th { color: #475569; background: #f8fafc; font-weight: 600; }
        .history-count-table th:first-child, .history-count-table td:first-child { text-align: left; }
        .history-count-table tr:last-child td { border-bottom: 0; }
        .history-file-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin: 13px 0;
        }
        .history-file-chip {
          padding: 5px 9px;
          border-radius: 999px;
          color: #475569;
          background: #f1f5f9;
          font-size: 12px;
        }
        .history-notice {
          margin-top: 13px;
          padding: 12px 14px;
          border-radius: 999px;
          font-size: 13px;
          line-height: 1.55;
        }
        .history-notice.error { color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; border-radius: 9px; }
        .history-notice.warning { color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 9px; }
        .history-notice.success { color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 9px; }
        .history-notice-title {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 5px;
          font-weight: 700;
        }
        .history-notice ul { margin: 5px 0 0; padding-left: 20px; }
        .history-confirm {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 17px;
          color: #334155;
          font-size: 13px;
        }
        .history-confirm input { width: 16px; height: 16px; }
        .history-import-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 14px;
        }
        .history-import-footer small { color: #64748b; line-height: 1.5; }
        @media (max-width: 720px) {
          .history-import-panel { padding: 18px; }
          .history-import-heading, .history-drop-zone, .history-import-footer {
            align-items: stretch;
            flex-direction: column;
          }
          .history-undo-card { align-items: stretch; flex-direction: column; }
          .history-import-badge { align-self: flex-start; }
          .history-action { width: 100%; }
        }
      `}</style>

      <HistoryImportHeader />

      {lastImport && (
        <LastImportUndoCard
          lastImport={lastImport}
          isUndoing={isUndoing}
          isImporting={isImporting}
          onUndoLastImport={undoLastImport}
        />
      )}

      <HistoryDropZone
        files={files}
        isPreviewing={isPreviewing}
        isImporting={isImporting}
        onSelectFiles={selectFiles}
        onPreviewFiles={previewFiles}
      />

      <HistoryNoticeAlerts error={error} result={result} undoResult={undoResult} />

      {preview && (
        <HistoryPreviewResults
          preview={preview}
          confirmed={confirmed}
          isImporting={isImporting}
          onSetConfirmed={setConfirmed}
          onImportFiles={importFiles}
        />
      )}
    </section>
  );
};
