import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BackupDTO } from '../../../api/types';
import { SeasonManagementPanel } from './SeasonManagementPanel';
import { SeasonTable } from './SeasonTable';
import { BackupActions } from './BackupActions';
import { BackupHistoryPanel } from './BackupHistoryPanel';

interface SeasonBackupPanelProps {
  seasons: any[];
  activeSeason: any;
  backups: BackupDTO[];
  newSeasonName: string;
  newSeasonType: string;
  isArchivingSeason: boolean;
  isLoading: boolean;
  isBackingUp: boolean;
  isRestoring: string | null;
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
        onCreateBackup={onCreateBackup}
      />

      <BackupHistoryPanel
        backups={backups}
        isLoading={isLoading}
        isBackingUp={isBackingUp}
        isRestoring={isRestoring}
        onRestoreBackup={onRestoreBackup}
        onLoadBackups={onLoadBackups}
      />

      <div className="form-section alert-section" style={{ marginTop: '30px', border: '1px solid #ffe3b3', background: '#fffcf5', padding: '20px', borderRadius: '8px', display: 'flex', gap: '15px' }}>
        <AlertTriangle size={36} style={{ color: '#e69500', flexShrink: 0 }} />
        <div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#b37400' }}>安全操作守则</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#665c40', lineHeight: '1.5' }}>
            <li><strong>备份范围</strong>：备份文件仅包含数据库内容，并不包含图片文件本身（图片将安全保留在 Cloudflare R2 云存储上，不被删除）。</li>
            <li><strong>还原警告</strong>：点击“覆盖还原”将清空本地或 Neon 线上当前的所有赛程比分、球队数据，并完全用备份文件里的老数据覆盖。进行此操作前，建议先创建一个最新的备份！</li>
          </ul>
        </div>
      </div>
    </>
  );
};
