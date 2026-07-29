import React, { useState } from 'react';
import { Database, Download, RefreshCw, RotateCcw } from 'lucide-react';
import { BackupDTO } from '../../../api/types';
import { backupApi } from '../../../api/backup.service';

interface BackupHistoryPanelProps {
  backups: BackupDTO[];
  isLoading: boolean;
  isBackingUp: boolean;
  isRestoring: string | null;
  onRestoreBackup: (key: string) => void;
  onLoadBackups: () => void;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const BackupHistoryPanel: React.FC<BackupHistoryPanelProps> = ({
  backups,
  isLoading,
  isBackingUp,
  isRestoring,
  onRestoreBackup,
  onLoadBackups,
}) => {
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const handleDownload = async (key: string) => {
    setDownloadingKey(key);
    try {
      const res = await backupApi.getDownloadUrl(key);
      if (res.success && res.downloadUrl) {
        const link = document.createElement('a');
        link.href = res.downloadUrl;
        link.download = key.split('/').pop() || 'backup.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '获取下载链接失败');
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleRestore = (key: string) => {
    const input = window.prompt(
      `高危操作警告：全量数据库还原将清空当前所有数据并从备份重新导入！\n\n请输入 "CONFIRM_RESTORE" 以确认操作:`,
    );
    if (input === 'CONFIRM_RESTORE') {
      onRestoreBackup(key);
    } else if (input !== null) {
      alert('二次确认文本错误，还原已被取消');
    }
  };

  return (
    <div className="form-section" style={{ marginTop: '30px' }}>
      <div className="section-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="form-title" style={{ margin: 0 }}>
          <span className="icon">☁️</span>
          R2 云端历史备份记录 ({backups.length}个备份)
        </h2>
        <button onClick={onLoadBackups} className="add-btn refresh-btn" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
          <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
          刷新列表
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>加载列表中...</div>
      ) : backups.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>
          <Database size={48} style={{ marginBottom: '10px', color: '#ccc' }} />
          <p>暂无任何云端备份记录，请点击上方按钮创建首个备份</p>
        </div>
      ) : (
        <div className="player-table-wrapper">
          <table className="player-table">
            <thead>
              <tr>
                <th>备份文件名</th>
                <th>文件大小</th>
                <th>创建时间</th>
                <th style={{ width: '220px', textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((bk) => (
                <tr key={bk.key}>
                  <td style={{ fontWeight: 500, color: '#333' }}>{bk.filename}</td>
                  <td style={{ color: '#666' }}>{formatSize(bk.size)}</td>
                  <td style={{ color: '#666' }}>{formatDate(bk.lastModified)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleDownload(bk.key)}
                        disabled={downloadingKey === bk.key}
                        className="add-btn small btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', height: 'auto', cursor: 'pointer' }}
                      >
                        <Download size={12} />
                        {downloadingKey === bk.key ? '准备中...' : '下载'}
                      </button>
                      <button
                        onClick={() => handleRestore(bk.key)}
                        disabled={isRestoring !== null || isBackingUp}
                        className="add-btn small refresh-btn"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', height: 'auto', background: '#ffebeb', color: '#d93838', borderColor: '#ffd1d1' }}
                      >
                        {isRestoring === bk.key ? (
                          <>
                            <RefreshCw size={12} className="spinning" />
                            还原中...
                          </>
                        ) : (
                          <>
                            <RotateCcw size={12} />
                            覆盖还原
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
