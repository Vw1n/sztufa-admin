import React, { useRef, useState } from 'react';
import { Database, RefreshCw, UploadCloud, ShieldCheck, Trash2 } from 'lucide-react';
import { BackupCreateRequest } from '../../../api/backup.service';

interface BackupActionsProps {
  isBackingUp: boolean;
  isRestoring: string | null;
  isUploading: boolean;
  isCleaningRetention?: boolean;
  uploadProgress: string | null;
  activeSeason?: { id: string; name: string } | null;
  seasons?: Array<{ id: string; name: string; status: string; archivedAt?: string | null }>;
  onCreateBackup: (request?: BackupCreateRequest) => void;
  onUploadFile: (file: File) => void;
  onCleanRetention?: (dryRun: boolean) => void;
}

export const BackupActions: React.FC<BackupActionsProps> = ({
  isBackingUp,
  isRestoring,
  isUploading,
  isCleaningRetention,
  uploadProgress,
  activeSeason,
  seasons = [],
  onCreateBackup,
  onUploadFile,
  onCleanRetention,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupTarget, setBackupTarget] = useState<string>(activeSeason ? 'season' : 'staff');
  const [hasManuallySelected, setHasManuallySelected] = useState(false);

  React.useEffect(() => {
    if (!hasManuallySelected && activeSeason) {
      setBackupTarget('season');
    }
  }, [activeSeason, hasManuallySelected]);

  const isArchivedSelected = backupTarget.startsWith('archived-season:');
  const selectedArchivedSeasonId = isArchivedSelected ? backupTarget.replace('archived-season:', '') : null;
  const selectedArchivedSeason = selectedArchivedSeasonId
    ? seasons.find((s) => s.id === selectedArchivedSeasonId)
    : null;

  const createSelectedBackup = () => {
    if (backupTarget === 'full') {
      const confirmed = window.confirm(
        '⚠️ 警告：全站灾备将导出全库所有业务表，可能产生大量 Neon 流量消耗（免费版月出口上限仅为 5GB）。\n\n自动备份已全面转为月度轻量模块快照，全量备份仅推荐用于灾备基线采样。\n\n是否确认继续？',
      );
      if (!confirmed) {
        return;
      }
      return onCreateBackup({ scope: 'full' });
    }
    if (isArchivedSelected && selectedArchivedSeasonId) {
      return onCreateBackup({
        scope: 'module',
        module: 'season',
        selector: { seasonId: selectedArchivedSeasonId },
        purpose: 'archive',
        protected: true,
      });
    }
    if (backupTarget === 'season' && activeSeason) {
      return onCreateBackup({ scope: 'module', module: 'season', selector: { seasonId: activeSeason.id } });
    }
    if (backupTarget !== 'season' && !isArchivedSelected) {
      return onCreateBackup({ scope: 'module', module: backupTarget as 'staff' | 'members' | 'content' | 'operations', selector: {} });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUploadFile(files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const archivedSeasons = seasons.filter((s) => s.status === 'archived');

  return (
    <div className="form-section">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h2 className="form-title" style={{ margin: 0 }}>
          <span className="icon">💾</span>
          备份与恢复操作
        </h2>
      </div>

      <div className="backup-actions-grid">
        {/* 手动全量/模块备份卡片 */}
        <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#333' }}>手动执行数据备份</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
              推荐按业务模块执行轻量备份（大幅降低 Neon 流量消耗）。全站灾备仅建议低频用于灾备基线采样。
            </p>
            <select
              value={backupTarget}
              onChange={(e) => {
                setHasManuallySelected(true);
                setBackupTarget(e.target.value);
              }}
              disabled={isBackingUp}
              className="form-select"
              style={{ marginTop: '12px', width: '100%' }}
            >
              <optgroup label="活跃赛季">
                <option value="season" disabled={!activeSeason}>
                  当前赛季{activeSeason ? `：${activeSeason.name}` : '（无活跃赛季）'}
                </option>
              </optgroup>
              {archivedSeasons.length > 0 && (
                <optgroup label="历史已归档赛季（受保护归档备份）">
                  {archivedSeasons.map((s) => (
                    <option key={s.id} value={`archived-season:${s.id}`}>
                      {s.name} (已归档{s.archivedAt ? ` · ${new Date(s.archivedAt).toLocaleDateString('zh-CN')}` : ''})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="系统功能模块">
                <option value="staff">管理员数据</option>
                <option value="members">成员账号</option>
                <option value="content">新闻内容</option>
                <option value="operations">运维记录</option>
              </optgroup>
              <optgroup label="灾备基线">
                <option value="full">全站灾备（V3，高流量开销）</option>
              </optgroup>
            </select>
            {isArchivedSelected && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  fontSize: '12px',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ShieldCheck size={16} />
                <span>
                  已归档赛季备份将<strong>永久标记为受保护（Protected）</strong>，防保留策略清理误删。
                </span>
              </div>
            )}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={createSelectedBackup}
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
                  立即执行备份
                </>
              )}
            </button>
          </div>
        </div>

        {/* 本地直传上传卡片 */}
        <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#333' }}>上传已有备份 (直传 R2)</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
              通过预签名 URL 直传 R2 存储桶，支持断点补录与异地冷备恢复，自动校验签名哈希与结构。
            </p>
            {uploadProgress && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} className="spinning" />
                {uploadProgress}
              </div>
            )}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".gz,.json"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isBackingUp || isRestoring !== null || isUploading || isCleaningRetention}
              className="add-btn"
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
