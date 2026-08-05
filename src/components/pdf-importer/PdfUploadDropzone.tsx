import React from 'react';
import { FileText, Upload } from 'lucide-react';

interface PdfUploadDropzoneProps {
  file: File | null;
  isLoading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadAndPreview: () => void;
}

export const PdfUploadDropzone: React.FC<PdfUploadDropzoneProps> = ({
  file,
  isLoading,
  onFileChange,
  onUploadAndPreview,
}) => {
  return (
    <div className="upload-section">
      <div
        className="drop-zone"
        style={{
          border: '2px dashed #a5d8ff',
          borderRadius: '10px',
          padding: '40px 20px',
          textAlign: 'center',
          background: '#f8f9fa',
          cursor: 'pointer',
        }}
      >
        <Upload size={48} style={{ color: '#339af0', marginBottom: '10px' }} />
        <p style={{ margin: '0 0 6px 0', fontWeight: 600, fontSize: '16px' }}>
          点击或拖拽上传官方报名表 PDF 文件
        </p>
        <p style={{ margin: 0, color: '#868e96', fontSize: '13px' }}>
          支持深圳技术大学“校长杯”等原生文本 PDF 报名表格式 (.pdf)
        </p>
        <input
          type="file"
          accept=".pdf"
          disabled={isLoading}
          onChange={onFileChange}
          style={{ display: 'none' }}
          id="pdf-file-input"
        />
        <label
          htmlFor="pdf-file-input"
          style={{
            display: 'inline-block',
            marginTop: '16px',
            padding: '8px 20px',
            background: '#228be6',
            color: '#fff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          选择本地 PDF 文件
        </label>
      </div>

      {file && (
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: '#e7f5ff',
            borderRadius: '6px',
            border: '1px solid #74c0fc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: '#1c7ed6' }} />
            <span style={{ fontWeight: 500 }}>{file.name}</span>
            <span style={{ fontSize: '12px', color: '#868e96' }}>
              ({Math.round(file.size / 1024)} KB)
            </span>
          </div>
          <button
            onClick={onUploadAndPreview}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#12b886',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: isLoading ? 'wait' : 'pointer',
            }}
          >
            {isLoading ? '正在识别与提取照片...' : '开始识别解析'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfUploadDropzone;
