import React, { useState } from "react";
import {
  Activity,
  HardDrive,
  TrendingDown,
  List,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";
import { BackupDTO } from "../../../../api/types";
import { BackupCreateRequest } from "../../../../api/backup.service";
import { SeasonSummary } from "../../hooks/types";
import { BackupOverview } from "./BackupOverview";
import { BackupActions } from "../../components/BackupActions";
import { BackupHistoryPanel } from "../../components/BackupHistoryPanel";
import { BackupDetailDrawer } from "./BackupDetailDrawer";
import { BackupTrafficDashboard } from "./BackupTrafficDashboard";
import { BackupRunHistory } from "./BackupRunHistory";
import { ArchiveProtectionPanel } from "../../components/ArchiveProtectionPanel";
import { BackupCreatePanel } from "./BackupCreatePanel";

export type BackupCenterTab =
  | "overview"
  | "files"
  | "traffic"
  | "history"
  | "archive"
  | "create";

export interface BackupCenterProps {
  backups: BackupDTO[];
  isLoading: boolean;
  isBackingUp: boolean;
  isRestoring: string | null;
  isUploading?: boolean;
  isCleaningRetention?: boolean;
  uploadProgress?: string | null;
  activeSeason?: SeasonSummary | null;
  seasons?: SeasonSummary[];
  onCreateBackup: (request?: BackupCreateRequest) => void;
  onUploadFile?: (file: File) => void;
  onDeleteBackup?: (key: string, isNewest: boolean) => void;
  onCleanRetention?: (dryRun: boolean) => void;
  onRestoreBackup: (backup: BackupDTO) => void;
  onLoadBackups: () => void;
  defaultTab?: BackupCenterTab;
}

interface TabItem {
  id: BackupCenterTab;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: string | number;
}

export const BackupCenter: React.FC<BackupCenterProps> = ({
  backups,
  isLoading,
  isBackingUp,
  isRestoring,
  isUploading = false,
  isCleaningRetention = false,
  uploadProgress = null,
  activeSeason = null,
  seasons = [],
  onCreateBackup,
  onUploadFile = () => {},
  onDeleteBackup = () => {},
  onCleanRetention = () => {},
  onRestoreBackup,
  onLoadBackups,
  defaultTab = "overview",
}) => {
  const [activeTab, setActiveTab] = useState<BackupCenterTab>(defaultTab);
  const [selectedBackup, setSelectedBackup] = useState<BackupDTO | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const tabs: TabItem[] = [
    { id: "overview", label: "系统概览与双轨预算", icon: Activity },
    {
      id: "files",
      label: "备份文件管理",
      icon: HardDrive,
      badge: backups.length > 0 ? backups.length : undefined,
    },
    { id: "traffic", label: "流量基线与趋势", icon: TrendingDown },
    { id: "history", label: "任务运行账本", icon: List },
    { id: "archive", label: "归档保护覆盖", icon: ShieldCheck },
    { id: "create", label: "按需创建备份", icon: PlusCircle },
  ];

  const handleOpenDetail = (backup: BackupDTO) => {
    setSelectedBackup(backup);
    setIsDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDrawerOpen(false);
    setSelectedBackup(null);
  };

  return (
    <div className="space-y-6 mt-6" data-testid="backup-center">
      {/* 备份中心顶部子导航 */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
        <nav
          className="flex flex-wrap gap-1.5"
          aria-label="备份与恢复中心导航"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                aria-pressed={isActive}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-gray-500"} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 子导航内容区域 */}
      <div className="space-y-6">
        {/* 1. 系统概览与双轨预算 */}
        {activeTab === "overview" && <BackupOverview />}

        {/* 2. 备份文件管理与下载/还原 */}
        {activeTab === "files" && (
          <div className="space-y-6">
            <BackupActions
              isBackingUp={isBackingUp}
              isRestoring={isRestoring}
              isUploading={isUploading}
              isCleaningRetention={isCleaningRetention}
              uploadProgress={uploadProgress}
              activeSeason={activeSeason}
              seasons={seasons}
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
              onViewDetail={handleOpenDetail}
            />
          </div>
        )}

        {/* 3. 流量基线与趋势 */}
        {activeTab === "traffic" && <BackupTrafficDashboard />}

        {/* 4. 任务运行账本 */}
        {activeTab === "history" && <BackupRunHistory />}

        {/* 5. 归档保护覆盖 */}
        {activeTab === "archive" && (
          <ArchiveProtectionPanel onBackfillSuccess={onLoadBackups} />
        )}

        {/* 6. 按需创建备份 */}
        {activeTab === "create" && (
          <BackupCreatePanel
            onSuccess={onLoadBackups}
            activeSeasonId={activeSeason?.id}
          />
        )}
      </div>

      {/* 备份详情抽屉 */}
      <BackupDetailDrawer
        backup={selectedBackup}
        isOpen={isDrawerOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
};
