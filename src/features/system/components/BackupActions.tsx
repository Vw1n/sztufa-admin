import React, { useRef } from 'react';
import { Database, RefreshCw, UploadCloud, ShieldCheck, Trash2 } from 'lucide-react';

interface BackupActionsProps {
  isBackingUp: boolean;
  isRestoring: string | null;
  isUploading: boolean;
  isCleaningRetention?: boolean;
  uploadProgress: string | null;
  onCreateBackup: () => void;
  onUploadFile: (file: File) => void;
  onCleanRetention?: (dryRun: boolean) => void;
}

export const BackupActions: React.FC<BackupActionsProps> = ({
  isBackingUp,
  isRestoring,
  isUploading,
  isCleaningRetention,
  uploadProgress,
  onCreateBackup,
  onUploadFile,
  onCleanRetention,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUploadFile(files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="form-section">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h2 className="form-title" style={{ margin: 0 }}>
          <span className="icon">💾</span>
          备份与恢复操作
        </h2>
      </div>

      <div className="backup-actions-grid">
        {/* 手动全量备份卡片 */}
        <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#333' }}>手动执行全站备份</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
              导出 17 张数据表并流式生成紧凑 GZIP 压缩文件 (`.json.gz`) 推送至 Cloudflare R2 冷备。
            </p>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onCreateBackup}
              disabled={isBackingUp || isRestoring !== null || isUploading || isCleaningRetention}
              className="save-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', height: 'auto', margin: 0 }}
            >
              {isBackingUp ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  正在备份中...
                </>
              ) : (
                <>
                  <Database size={16} />
                  立即执行备份 (V3 GZIP)
                </>
              )}
            </button>
          </div>
        </div>

        {/* 本地直传上传卡片 */}
        <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#333' }}>上传本地备份文件</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
              支持 `.json.gz` (上限 100 MB) 与 `.json` (上限 200 MB)，浏览器直传 R2，服务端重算 Hash 并全量校验。
            </p>
            {uploadProgress && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#2563eb', fontWeight: 500 }}>
                进度：{uploadProgress}
              </div>
            )}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.json.gz"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isBackingUp || isRestoring !== null || isUploading || isCleaningRetention}
              className="add-btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', height: 'auto', margin: 0 }}
            >
              {isUploading ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  正在直传校验...
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  选择文件直传
                </>
              )}
            </button>
          </div>
        </div>

        {/* 保留策略清理卡片 */}
        <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#333' }}>保留策略清理入口</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
              自动识别 24h 超时临时上传、7 天前置快照，按 ISO 周保留最近 4 周及 6 个月备份。
            </p>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onCleanRetention?.(true)}
              disabled={isBackingUp || isRestoring !== null || isUploading || isCleaningRetention}
              className="add-btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 10px', fontSize: '12px', height: 'auto', margin: 0 }}
            >
              <ShieldCheck size={14} />
              Dry-run 检查
            </button>
            <button
              onClick={() => onCleanRetention?.(false)}
              disabled={isBackingUp || isRestoring !== null || isUploading || isCleaningRetention}
              className="save-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 10px', fontSize: '12px', height: 'auto', margin: 0, backgroundColor: '#dc2626' }}
            >
              <Trash2 size={14} />
              执行保留清理
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
