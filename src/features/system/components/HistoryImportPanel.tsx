import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { ImportEntityCounts } from '../../../api/types';
import { useHistoryImport } from '../hooks';

interface HistoryImportPanelProps {
  historyImport: ReturnType<typeof useHistoryImport>;
}

const countRows: Array<{ key: keyof ImportEntityCounts; label: string }> = [
  { key: 'seasons', label: '赛季' },
  { key: 'teams', label: '球队' },
  { key: 'players', label: '球员' },
  { key: 'matches', label: '比赛' },
  { key: 'events', label: '比赛事件' },
];

const fileTypeLabels = {
  season: '分赛季数据',
  supplemental: '未归季球员',
  manifest: '核对清单',
};

const formatBytes = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

export const HistoryImportPanel: React.FC<HistoryImportPanelProps> = ({ historyImport }) => {
  const {
    files,
    preview,
    result,
    error,
    isPreviewing,
    isImporting,
    selectFiles,
    previewFiles,
    importFiles,
  } = historyImport;
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setConfirmed(false);
  }, [preview?.digest, files]);

  const visibleWarnings = preview?.warnings.slice(0, 12) || [];
  const hiddenWarningCount = Math.max((preview?.warnings.length || 0) - visibleWarnings.length, 0);

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
          border-radius: 9px;
          font-size: 13px;
          line-height: 1.55;
        }
        .history-notice.error { color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; }
        .history-notice.warning { color: #92400e; background: #fffbeb; border: 1px solid #fde68a; }
        .history-notice.success { color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; }
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
          .history-import-badge { align-self: flex-start; }
          .history-action { width: 100%; }
        }
      `}</style>

      <div className="history-import-heading">
        <div>
          <h2><Upload size={21} />历史 JSON 智能导入</h2>
          <p>
            一次可上传多个重新分类后的分赛季 JSON。系统会自动识别赛季、球队、球员、比赛和事件，
            先展示新增与覆盖数量，确认后再一次性写入数据库。
          </p>
        </div>
        <span className="history-import-badge">仅超级管理员</span>
      </div>

      <div className="history-drop-zone">
        <div className="history-drop-copy">
          <FileCheck size={28} color="#2563eb" />
          <div>
            <strong>{files.length ? `已选择 ${files.length} 个文件` : '选择历史 JSON 文件'}</strong>
            <small>支持 1–10 个 .json 文件，单个文件最大 2MB；图片资源不会被导入。</small>
          </div>
        </div>
        <label className="history-action">
          <Upload size={16} />
          {files.length ? '重新选择' : '选择文件'}
          <input
            className="history-file-input"
            type="file"
            accept=".json,application/json"
            multiple
            onChange={selectFiles}
            disabled={isPreviewing || isImporting}
          />
        </label>
      </div>

      {files.length > 0 && (
        <>
          <div className="history-file-list">
            {files.map((file) => (
              <div className="history-file" key={`${file.name}-${file.size}-${file.lastModified}`}>
                <span title={file.name}>{file.name}</span>
                <span>{formatBytes(file.size)}</span>
              </div>
            ))}
          </div>
          <div className="history-preview-actions">
            <button
              className="history-action primary"
              type="button"
              onClick={previewFiles}
              disabled={isPreviewing || isImporting}
            >
              {isPreviewing ? <RefreshCw size={16} className="spinning" /> : <ShieldCheck size={16} />}
              {isPreviewing ? '正在分析…' : '分析文件'}
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="history-notice error">
          <div className="history-notice-title"><AlertTriangle size={16} />操作失败</div>
          {error}
        </div>
      )}

      {preview && (
        <div className="history-preview">
          <div className="history-preview-title">
            <h3>预检结果</h3>
            <span className="history-digest">摘要 {preview.digest.slice(0, 12)}</span>
          </div>

          <div className="history-file-summary">
            {preview.files.map((file) => (
              <span className="history-file-chip" key={file.name}>
                {file.season || file.name} · {fileTypeLabels[file.type]}
              </span>
            ))}
          </div>

          <table className="history-count-table">
            <thead>
              <tr>
                <th>数据类型</th>
                <th>识别总数</th>
                <th>新增</th>
                <th>覆盖更新</th>
              </tr>
            </thead>
            <tbody>
              {countRows.map(({ key, label }) => (
                <tr key={key}>
                  <td>{label}</td>
                  <td>{preview.records[key]}</td>
                  <td>{preview.create[key]}</td>
                  <td>{preview.update[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {preview.errors.length > 0 && (
            <div className="history-notice error">
              <div className="history-notice-title"><AlertTriangle size={16} />必须处理的问题</div>
              <ul>{preview.errors.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}

          {preview.warnings.length > 0 && (
            <div className="history-notice warning">
              <div className="history-notice-title">
                <AlertTriangle size={16} />导入提示（{preview.warnings.length}）
              </div>
              <ul>{visibleWarnings.map((item) => <li key={item}>{item}</li>)}</ul>
              {hiddenWarningCount > 0 && <div>另有 {hiddenWarningCount} 条同类提示，导入后仍可在后台补录。</div>}
            </div>
          )}

          {preview.canImport && (
            <>
              <label className="history-confirm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  disabled={isImporting}
                />
                我已核对赛季和数量，了解已有历史记录会被这批 JSON 的内容覆盖更新。
              </label>
              <div className="history-import-footer">
                <small>正式导入使用单个数据库事务；任一步失败时不会留下半套数据。</small>
                <button
                  className="history-action danger"
                  type="button"
                  onClick={importFiles}
                  disabled={!confirmed || isImporting}
                >
                  {isImporting ? <RefreshCw size={16} className="spinning" /> : <ShieldCheck size={16} />}
                  {isImporting ? '正在写入…' : '确认写入数据库'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {result && (
        <div className="history-notice success">
          <div className="history-notice-title"><CheckCircle2 size={17} />导入完成</div>
          新增 {result.created.seasons} 个赛季、{result.created.teams} 支球队、
          {result.created.players} 名球员、{result.created.matches} 场比赛；
          更新 {result.updated.players} 名球员和 {result.updated.matches} 场比赛。
        </div>
      )}
    </section>
  );
};
