import React from 'react';
import { AlertCircle, Upload, X } from 'lucide-react';

interface ExcelUploadSectionProps {
  file: File | null;
  error: string | null;
  isLoading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onParseExcel: () => void;
}

export const ExcelUploadSection: React.FC<ExcelUploadSectionProps> = ({
  file,
  error,
  isLoading,
  onFileChange,
  onRemoveFile,
  onParseExcel,
}) => {
  return (
    <div className="upload-section">
      <div className="drop-zone">
        <Upload size={48} />
        <p>点击或选择上传 Excel 文件</p>
        <p className="hint">支持 .xlsx 和 .xls 格式</p>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={onFileChange}
          className="file-input"
        />
      </div>

      {file && (
        <div className="file-info">
          <span>{file.name}</span>
          <button onClick={onRemoveFile} className="remove-file">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {file && !error && (
        <button onClick={onParseExcel} className="parse-btn" disabled={isLoading}>
          {isLoading ? '解析中...' : '解析文件'}
        </button>
      )}
    </div>
  );
};

export default ExcelUploadSection;
