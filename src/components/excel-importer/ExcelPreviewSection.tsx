import React from 'react';
import { AlertCircle, Check, Image as ImageIcon, X } from 'lucide-react';
import { Player } from '../../types';

interface ExcelPreviewSectionProps {
  previewData: Omit<Player, 'id'>[];
  error: string | null;
  batchMatchingStatus: string | null;
  uploadingRowIndex: number | null;
  isBusy: boolean;
  onBatchPhotosUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSinglePhotoUpload: (index: number, photoFile: File) => Promise<void>;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExcelPreviewSection: React.FC<ExcelPreviewSectionProps> = ({
  previewData,
  error,
  batchMatchingStatus,
  uploadingRowIndex,
  isBusy,
  onBatchPhotosUpload,
  onSinglePhotoUpload,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="preview-section">
      <div
        className="preview-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h4>预览导入数据</h4>
          <p>共 {previewData.length} 条记录</p>
        </div>
        <div>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: isBusy ? '#f1f3f5' : '#e7f5ff',
              color: isBusy ? '#adb5bd' : '#1c7ed6',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              border: isBusy ? '1px solid #dee2e6' : '1px solid #a5d8ff',
              fontWeight: 500,
              opacity: isBusy ? 0.7 : 1,
            }}
          >
            <ImageIcon size={16} />
            批量选择本地照片 (按学号/姓名自动匹配)
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={isBusy}
              onChange={onBatchPhotosUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {batchMatchingStatus && (
        <div
          style={{
            margin: '8px 0 12px 0',
            padding: '8px 12px',
            borderRadius: '6px',
            background: '#f4fce3',
            border: '1px solid #d8f5a2',
            color: '#2b8a3e',
            fontSize: '13px',
          }}
        >
          {batchMatchingStatus}
        </div>
      )}

      {error && (
        <div className="error-message" style={{ marginBottom: '12px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="preview-table-wrapper">
        <table className="preview-table">
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>照片</th>
              <th>姓名</th>
              <th>学号</th>
              <th>球衣号码</th>
              <th style={{ width: '120px', textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {previewData.map((player, index) => (
              <tr key={index}>
                <td style={{ textAlign: 'center' }}>
                  {player.photo ? (
                    <img
                      src={player.photo}
                      alt={player.name}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block',
                        margin: '0 auto',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#e9ecef',
                        color: '#6c757d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        margin: '0 auto',
                      }}
                    >
                      无
                    </div>
                  )}
                </td>
                <td>{player.name}</td>
                <td>{player.studentId}</td>
                <td>{player.jerseyNumber}</td>
                <td style={{ textAlign: 'center' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      background: isBusy ? '#f8f9fa' : '#f1f3f5',
                      color: isBusy ? '#adb5bd' : '#495057',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: isBusy ? 'not-allowed' : 'pointer',
                      border: '1px solid #ced4da',
                      opacity: isBusy ? 0.7 : 1,
                    }}
                  >
                    <ImageIcon size={12} />
                    {uploadingRowIndex === index ? '上传中' : player.photo ? '更换' : '上传照片'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isBusy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void onSinglePhotoUpload(index, f);
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="preview-actions">
        <button onClick={onConfirm} className="confirm-btn" disabled={isBusy}>
          <Check size={16} />
          确认导入
        </button>
        <button onClick={onCancel} className="cancel-btn" disabled={isBusy}>
          <X size={16} />
          取消
        </button>
      </div>
    </div>
  );
};

export default ExcelPreviewSection;
