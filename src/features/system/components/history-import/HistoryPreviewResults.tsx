import React from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import { ImportEntityCounts, ImportFileSummary, ImportPreview } from '../../../../api/types';

interface HistoryPreviewResultsProps {
  preview: ImportPreview;
  confirmed: boolean;
  isImporting: boolean;
  onSetConfirmed: (confirmed: boolean) => void;
  onImportFiles: () => void;
}

const countRows: Array<{ key: keyof ImportEntityCounts; label: string }> = [
  { key: 'seasons', label: '赛季' },
  { key: 'teams', label: '球队' },
  { key: 'players', label: '球员' },
  { key: 'matches', label: '比赛' },
  { key: 'events', label: '比赛事件' },
];

const fileTypeLabels: Record<ImportFileSummary['type'], string> = {
  season: '分赛季数据',
  supplemental: '未归季球员',
  manifest: '核对清单',
};

export const HistoryPreviewResults: React.FC<HistoryPreviewResultsProps> = ({
  preview,
  confirmed,
  isImporting,
  onSetConfirmed,
  onImportFiles,
}) => {
  const visibleWarnings = preview.warnings.slice(0, 12);
  const hiddenWarningCount = Math.max(preview.warnings.length - visibleWarnings.length, 0);

  return (
    <div className="history-preview">
      <div className="history-preview-title">
        <h3>预检结果</h3>
        <span className="history-digest">摘要 {preview.digest.slice(0, 12)}</span>
      </div>

      <div className="history-file-summary">
        {preview.files.map((file: ImportFileSummary) => (
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
          <div className="history-notice-title">
            <AlertTriangle size={16} />
            必须处理的问题
          </div>
          <ul>
            {preview.errors.map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {preview.warnings.length > 0 && (
        <div className="history-notice warning">
          <div className="history-notice-title">
            <AlertTriangle size={16} />
            导入提示（{preview.warnings.length}）
          </div>
          <ul>
            {visibleWarnings.map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {hiddenWarningCount > 0 && (
            <div>另有 {hiddenWarningCount} 条同类提示，导入后仍可在后台补录。</div>
          )}
        </div>
      )}

      {preview.canImport && (
        <>
          <label className="history-confirm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => onSetConfirmed(event.target.checked)}
              disabled={isImporting}
            />
            我已核对赛季和数量，了解已有历史记录会被这批 JSON 的内容覆盖更新。
          </label>
          <div className="history-import-footer">
            <small>正式导入使用单个数据库事务；任一步失败时不会留下半套数据。</small>
            <button
              className="history-action danger"
              type="button"
              onClick={onImportFiles}
              disabled={!confirmed || isImporting}
            >
              {isImporting ? <RefreshCw size={16} className="spinning" /> : <ShieldCheck size={16} />}
              {isImporting ? '正在写入…' : '确认写入数据库'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryPreviewResults;
