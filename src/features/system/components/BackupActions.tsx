import React from 'react';
import { Database, RefreshCw } from 'lucide-react';

interface BackupActionsProps {
  isBackingUp: boolean;
  isRestoring: string | null;
  onCreateBackup: () => void;
}

export const BackupActions: React.FC<BackupActionsProps> = ({
  isBackingUp,
  isRestoring,
  onCreateBackup,
}) => {
  return (
    <div className="form-section">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h2 className="form-title" style={{ margin: 0 }}>
          <span className="icon">💾</span>
          立即触发系统备份
        </h2>
      </div>
      <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ maxWidth: '70%' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>手动执行全站备份</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
            点击后系统将立即导出当前的所有数据表（包含球队、球员、战绩及系统日志），对其进行压缩，然后生成 `.json` 文件并安全推送到 R2 云端。
          </p>
        </div>
        <button
          onClick={onCreateBackup}
          disabled={isBackingUp || isRestoring !== null}
          className="save-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', height: 'auto', margin: 0 }}
        >
          {isBackingUp ? (
            <>
              <RefreshCw size={18} className="spinning" />
              正在备份中...
            </>
          ) : (
            <>
              <Database size={18} />
              立即执行备份
            </>
          )}
        </button>
      </div>
    </div>
  );
};
