import React from 'react';
import { FileCheck, RefreshCw, ShieldCheck, Upload } from 'lucide-react';

interface HistoryDropZoneProps {
  files: File[];
  isPreviewing: boolean;
  isImporting: boolean;
  onSelectFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPreviewFiles: () => void;
}

const formatBytes = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

export const HistoryDropZone: React.FC<HistoryDropZoneProps> = ({
  files,
  isPreviewing,
  isImporting,
  onSelectFiles,
  onPreviewFiles,
}) => {
  return (
    <>
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
            onChange={onSelectFiles}
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
              onClick={onPreviewFiles}
              disabled={isPreviewing || isImporting}
            >
              {isPreviewing ? (
                <RefreshCw size={16} className="spinning" />
              ) : (
                <ShieldCheck size={16} />
              )}
              {isPreviewing ? '正在分析…' : '分析文件'}
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default HistoryDropZone;
