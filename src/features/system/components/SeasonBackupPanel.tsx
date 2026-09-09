import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BackupDTO } from '../../../api/types';
import { SeasonSummary } from '../hooks/types';
import { SeasonManagementPanel } from './SeasonManagementPanel';
import { SeasonTable } from './SeasonTable';
import { BackupActions } from './BackupActions';
import { BackupHistoryPanel } from './BackupHistoryPanel';

interface SeasonBackupPanelProps {
  seasons: SeasonSummary[];
  activeSeason: SeasonSummary | null;
  backups: BackupDTO[];
  newSeasonName: string;
  newSeasonType: string;
  isArchivingSeason: boolean;
  isLoading: boolean;
  isBackingUp: boolean;
  isRestoring: string | null;
  isUploading?: boolean;
  isCleaningRetention?: boolean;
  uploadProgress?: string | null;
  isUpdatingStatusId: string | null;
  isRenamingSeasonId: string | null;
  isDeletingSeasonId: string | null;
  onNewSeasonNameChange: (val: string) => void;
  onNewSeasonTypeChange: (val: string) => void;
  onCreateSeason: (e: React.FormEvent) => void;
  onUpdateSeasonStatus: (id: string, currentStatus: string) => void;
  onRenameSeason: (id: string, currentName: string, newName: string) => Promise<void>;
  onDeleteSeason: (id: string, name: string) => void;
  onCreateBackup: () => void;
  onUploadFile?: (file: File) => void;
  onDeleteBackup?: (key: string, isNewest: boolean) => void;
  onCleanRetention?: (dryRun: boolean) => void;
  onRestoreBackup: (key: string) => void;
  onLoadBackups: () => void;
}

export const SeasonBackupPanel: React.FC<SeasonBackupPanelProps> = ({
  seasons,
  backups,
  newSeasonName,
  newSeasonType,
  isArchivingSeason,
  isLoading,
  isBackingUp,
  isRestoring,
  isUploading = false,
  isCleaningRetention = false,
  uploadProgress = null,
  isUpdatingStatusId,
  isRenamingSeasonId,
  isDeletingSeasonId,
  onNewSeasonNameChange,
  onNewSeasonTypeChange,
  onCreateSeason,
  onUpdateSeasonStatus,
  onRenameSeason,
  onDeleteSeason,
  onCreateBackup,
  onUploadFile = () => {},
  onDeleteBackup = () => {},
  onCleanRetention = () => {},
  onRestoreBackup,
  onLoadBackups,
}) => {
  return (
    <>
      <SeasonManagementPanel
        newSeasonName={newSeasonName}
        newSeasonType={newSeasonType}
        isArchivingSeason={isArchivingSeason}
        onNewSeasonNameChange={onNewSeasonNameChange}
        onNewSeasonTypeChange={onNewSeasonTypeChange}
        onCreateSeason={onCreateSeason}
      />

      <SeasonTable
        seasons={seasons}
        isUpdatingStatusId={isUpdatingStatusId}
        isRenamingSeasonId={isRenamingSeasonId}
        isDeletingSeasonId={isDeletingSeasonId}
        onUpdateSeasonStatus={onUpdateSeasonStatus}
        onRenameSeason={onRenameSeason}
        onDeleteSeason={onDeleteSeason}
      />

      <BackupActions
        isBackingUp={isBackingUp}
        isRestoring={isRestoring}
        isUploading={isUploading}
        isCleaningRetention={isCleaningRetention}
        uploadProgress={uploadProgress}
        onCreateBackup={onCreateBackup}
        onUploadFile={onUploadFile}
        onCleanRetention={onCleanRetention}
      />

      <BackupHistoryPanel
        backups={backups}
        isLoading={isLoading}
        isBackingUp={isBackingUp}
        isRestoring={isRestoring}
        onRestoreBackup={onRestoreBackup}
        onDeleteBackup={onDeleteBackup}
        onLoadBackups={onLoadBackups}
      />

      <div className="form-section alert-section" style={{ marginTop: '30px', border: '1px solid #ffe3b3', background: '#fffcf5', padding: '20px', borderRadius: '8px', display: 'flex', gap: '15px' }}>
        <AlertTriangle size={36} style={{ color: '#e69500', flexShrink: 0 }} />
        <div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#b37400' }}>安全操作守则</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#665c40', lineHeight: '1.5' }}>
            <li><strong>备份范围与格式</strong>：备份文件包含按范围筛选的核心业务数据（全量灾备包含当前 18 张核心业务表的全部记录）。支持生成 V3.0 `.json.gz` GZIP 格式，同时全量兼容旧版 V2.0 `.json` 格式；当前仅开放全站灾备恢复，分赛季恢复尚未开放。</li>
            <li><strong>直传与防护</strong>：本地备份上传采用 Web Crypto 摘要计算与 R2 预签名 URL 浏览器直传，不占用服务器内存包体（支持 `.json.gz` 100 MB / `.json` 200 MB 上限），服务端提供双重 Zip Bomb 及文件篡改拦截。</li>
            <li><strong>删除与保留</strong>：系统最新恢复点及带有 protected 标识的备份自动永久受保护不可删除；物理删除需二次输入 `DELETE_BACKUP`，且系统强制校验确保删后保留至少 2 个可用恢复点。</li>
            <li><strong>保留策略清理</strong>：自动识别 24 小时超时未完成临时上传、超出 7 天的 `_pre-restore` 前置快照，且按周一 ISO 日期保留最近 4 周与 6 个月数据库备份。支持 Dry-run 检查与强制二次确认物理清理。</li>
            <li><strong>还原警告</strong>：点击“覆盖还原”将清空线上或本地数据库并用备份数据覆盖，触发前系统会自动生成一个 `_pre-restore` 前置应急快照。</li>
          </ul>
        </div>
      </div>
    </>
  );
};
