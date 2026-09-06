import { useSearchParams } from 'react-router-dom';
import React, { lazy, Suspense, useCallback, useState } from 'react';
import { Database, FileCheck } from 'lucide-react';
import {
  CupGroupPanel,
  HistoryImportPanel,
  SeasonBackupPanel,
} from './components';
import {
  useCupGroupSettings,
  useHistoryImport,
  useSeasonBackupSettings,
  useSystemTeams,
} from './hooks';

const MemberAccountsPage = lazy(() => import('../accounts/MemberAccountsPage'));
const StaffAccountsPage = lazy(() => import('../accounts/StaffAccountsPage'));
const settingsTabs = [
  { id: 'backup', label: '💾 数据灾备与归档' },
  { id: 'groups', label: '🏆 赛季分组配置' },
  { id: 'history-import', label: '📥 历史 JSON 导入' },
  { id: 'automation', label: '🧪 自动化测试' },
  { id: 'members', label: '网页用户审核' },
  { id: 'staff', label: '后台账号' },
] as const;
type SettingsTab = typeof settingsTabs[number]['id'];
type DataSettingsTab = Exclude<SettingsTab, 'members' | 'staff' | 'automation'>;

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 18px',
  fontWeight: active ? '600' : '400',
  color: active ? '#0070f3' : '#fff',
  background: active ? '#f0f7ff' : 'none',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
});

const SystemSettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: SettingsTab = settingsTabs.find(tab => tab.id === requestedTab)?.id || 'backup';
  const setActiveTab = (tab: SettingsTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next);
  };

  return (
    <div className="team-info-page">
      <style>{`
        .season-card {
          background: #fff;
          border: 1px solid #e9ecef;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }
        .season-form {
          display: flex;
          gap: 15px;
          align-items: flex-end;
        }
        .season-input-field {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
          height: 40px;
          background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .season-input-field:focus {
          border-color: #3b5bdb;
          box-shadow: 0 0 0 3px rgba(59,91,219,0.1);
          outline: none;
        }
        .season-table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .season-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          text-align: left;
        }
        .season-table th {
          padding: 12px 16px;
          font-weight: 600;
          color: #495057;
          background: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
        }
        .season-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #e9ecef;
          vertical-align: middle;
        }
        .season-table tr:last-child td {
          border-bottom: none;
        }
        .season-table tr:hover {
          background-color: #f8f9fa;
        }
        @media (max-width: 700px) {
          .season-card { padding: 16px; }
          .season-form { flex-direction: column; align-items: stretch; gap: 12px; }
          .season-form > div { width: 100% !important; }
          .season-form button { width: 100%; justify-content: center; margin-top: 5px; }
        }
      `}</style>

      <header className="page-header">
        <div className="header-content">
          <h1>
            <Database className="trophy-icon" />
            系统设置与安全中心
          </h1>
          <p>管理网页用户审核、后台账号权限、赛季配置、自动化测试、历史数据导入与灾备备份</p>
        </div>
      </header>

      <main className="page-content">
        <nav aria-label="系统设置分类" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
          {settingsTabs.map(tab => (
            <button key={tab.id} type="button" aria-pressed={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} style={tabButtonStyle(activeTab === tab.id)}>
              {tab.label}
            </button>
          ))}
        </nav>

        <Suspense fallback={<p role="status">加载设置内容…</p>}>
          {activeTab === 'members' ? <MemberAccountsPage /> :
            activeTab === 'staff' ? <StaffAccountsPage /> :
              activeTab === 'automation' ? <AutomationReportPanel /> :
                <SystemDataSettings activeTab={activeTab} />}
        </Suspense>

      </main>

    </div>
  );
};

const AutomationReportPanel: React.FC = () => (
  <section className="season-card" aria-labelledby="automation-report-title">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
      <div>
        <h2 id="automation-report-title" style={{ margin: 0 }}>自动化测试报告</h2>
        <p style={{ margin: '6px 0 0', color: '#64748b' }}>查看最新测试结果、通过率、执行耗时与用例详情。</p>
      </div>
      <a href="/automation-report.html?v=20260906-4" target="_blank" rel="noreferrer" style={{ color: '#4f46e5', fontWeight: 600 }}>
        在新窗口打开
      </a>
    </div>
    <div role="status" style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
      当前仅连接 develop 独立 API 与数据库；写入用例只操作带本次运行标识的测试数据，并在结束后精确清理。
    </div>
    <iframe
      src="/automation-report.html?v=20260906-4"
      title="自动化测试可视化报告"
      style={{ width: '100%', height: '75vh', minHeight: '680px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fff' }}
    />
  </section>
);

const SystemDataSettings: React.FC<{ activeTab: DataSettingsTab }> = ({ activeTab }) => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const feedback = { setError, setSuccessMessage };

  const seasonBackup = useSeasonBackupSettings(feedback);
  const { loadAllSeasons } = seasonBackup;
  const handleHistoryImported = useCallback((message: string) => {
    setSuccessMessage(message);
    void loadAllSeasons();
    setTimeout(() => setSuccessMessage(null), 5000);
  }, [loadAllSeasons]);
  const historyImport = useHistoryImport(handleHistoryImported);
  const { teams: activeSeasonTeams } = useSystemTeams(seasonBackup.activeSeason?.id, true);
  const cupGroups = useCupGroupSettings(seasonBackup.activeSeason, feedback);

  return (<>
        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="save-success" style={{ display: 'flex', marginBottom: '20px' }}>
            <FileCheck size={20} />
            <span>{successMessage}</span>
          </div>
        )}
        {activeTab === 'backup' && (
          <SeasonBackupPanel
            seasons={seasonBackup.seasons}
            activeSeason={seasonBackup.activeSeason}
            backups={seasonBackup.backups}
            newSeasonName={seasonBackup.newSeasonName}
            newSeasonType={seasonBackup.newSeasonType}
            isArchivingSeason={seasonBackup.isArchivingSeason}
            isLoading={seasonBackup.isLoading}
            isBackingUp={seasonBackup.isBackingUp}
            isRestoring={seasonBackup.isRestoring}
            isUploading={seasonBackup.isUploading}
            isCleaningRetention={seasonBackup.isCleaningRetention}
            uploadProgress={seasonBackup.uploadProgress}
            isUpdatingStatusId={seasonBackup.isUpdatingStatusId}
            isRenamingSeasonId={seasonBackup.isRenamingSeasonId}
            isDeletingSeasonId={seasonBackup.isDeletingSeasonId}
            onNewSeasonNameChange={seasonBackup.setNewSeasonName}
            onNewSeasonTypeChange={seasonBackup.setNewSeasonType}
            onCreateSeason={seasonBackup.handleCreateSeason}
            onUpdateSeasonStatus={seasonBackup.handleUpdateSeasonStatus}
            onRenameSeason={seasonBackup.handleRenameSeason}
            onDeleteSeason={seasonBackup.handleDeleteSeason}
            onCreateBackup={seasonBackup.handleCreateBackup}
            onUploadFile={seasonBackup.handleUploadFile}
            onDeleteBackup={seasonBackup.handleDeleteBackup}
            onCleanRetention={seasonBackup.handleCleanRetention}
            onRestoreBackup={seasonBackup.handleRestore}
            onLoadBackups={seasonBackup.loadBackups}
          />
        )}

        {activeTab === 'groups' && seasonBackup.activeSeason?.type === 'CUP' && (
          <CupGroupPanel
            activeSeason={seasonBackup.activeSeason}
            teams={activeSeasonTeams}
            groupsData={cupGroups.groupsData}
            isSavingGroups={cupGroups.isSavingGroups}
            onTeamGroupChange={cupGroups.handleTeamGroupChange}
            onSaveGroups={cupGroups.handleSaveGroups}
            onGenerateKnockout={cupGroups.handleGenerateKnockout}
          />
        )}
        {activeTab === 'groups' && seasonBackup.activeSeason?.type !== 'CUP' && (
          <div className="form-section" style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <span style={{ fontSize: '48px' }}>🏆</span>
            <p style={{ marginTop: '16px', fontSize: '15px' }}>当前活跃赛季为<strong>联赛赛制</strong>，无需进行小组分配。</p>
            <p style={{ fontSize: '13px' }}>如需管理杯赛分组，请先在"数据灾备与归档"页签中创建一个 CUP 类型的赛季并激活。</p>
          </div>
        )}

        {activeTab === 'history-import' && (
          <HistoryImportPanel historyImport={historyImport} />
        )}

  </>);
};

export default SystemSettingsPage;
