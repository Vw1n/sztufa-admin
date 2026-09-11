import React from 'react';
import { AlertCircle, Download, FileJson, Loader2, Save, Trophy } from 'lucide-react';
import ExcelImporter from '../../components/ExcelImporter';
import SuccessToast from '../../components/SuccessToast';
import { useAuth } from '../../contexts/AuthContext';
import CoachAssignedNotice from './components/CoachAssignedNotice';
import PdfImportSection from './components/PdfImportSection';
import PlayerList from './components/PlayerList';
import SaveProgressOverlay from './components/SaveProgressOverlay';
import TeamForm from './components/TeamForm';
import { usePdfTeamDraftQueue } from './hooks/usePdfTeamDraftQueue';
import { useTeamEntryForm } from './hooks/useTeamEntryForm';
import { useTeamEntrySave } from './hooks/useTeamEntrySave';
import { exportTeamToExcel, exportTeamToJson } from './utils/team-entry-export';

const TeamEntryPage: React.FC = () => {
  const { user } = useAuth();

  // 表单状态（球队数据、球员 CRUD、赛季、校验、共享 error）
  const form = useTeamEntryForm();

  // PDF 草稿队列（多球队识别、图片下载、队列推进、object URL 生命周期）
  const pdfQueue = usePdfTeamDraftQueue({
    setTeamFormData: form.setTeamFormData,
    setPlayers: form.setPlayers,
    gender: form.teamFormData.gender,
    seasonId: form.teamFormData.seasonId,
    setError: form.setError,
  });

  // 保存逻辑（超级管理员草稿物化 / 普通用户正式创建）
  const save = useTeamEntrySave({
    teamFormData: form.teamFormData,
    players: form.players,
    userRole: user?.role,
    validate: form.validateForm,
    setError: form.setError,
    onSaveSuccess: pdfQueue.advanceQueue,
  });

  const handleExportJson = () => {
    if (!save.savedTeam) {
      form.setError('请先保存球队信息');
      return;
    }
    exportTeamToJson(save.savedTeam);
  };

  const handleExportExcel = () => {
    if (!save.savedTeam) {
      form.setError('请先保存球队信息');
      return;
    }
    exportTeamToExcel(save.savedTeam);
  };

  if (user?.role === 'coach') {
    return <CoachAssignedNotice />;
  }

  return (
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Trophy className="trophy-icon" />
            校园足球比赛球队信息录入系统
          </h1>
          <p>录入球队信息和参赛队员资料</p>
        </div>
      </header>

      <main className="page-content">
        {save.isSaved && <SuccessToast message="球队信息录入成功！" />}

        {pdfQueue.pdfImportMessage && (
          <SuccessToast
            message={pdfQueue.pdfImportMessage}
            onClose={() => pdfQueue.setPdfImportMessage(null)}
          />
        )}

        {form.error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{form.error}</span>
          </div>
        )}

        {user?.role === 'super_admin' && (
          <PdfImportSection
            showPdfImporter={pdfQueue.showPdfImporter}
            onTogglePdfImporter={() => {
              pdfQueue.setShowPdfImporter((visible) => !visible);
              pdfQueue.setPdfImportMessage(null);
            }}
            onImportSuccess={pdfQueue.handlePdfTeamsRecognized}
            onClose={() => pdfQueue.setShowPdfImporter(false)}
          />
        )}

        <div className="form-section">
          <TeamForm
            data={form.teamFormData}
            onChange={form.setTeamFormData}
            activeSeasons={form.compatibleActiveSeasons}
            isSuperAdmin={user?.role === 'super_admin'}
          />
        </div>

        <div className="player-section">
          <PlayerList
            players={form.players}
            onAddPlayer={form.handleAddPlayer}
            onRemovePlayer={form.handleRemovePlayer}
            onUpdatePlayer={form.handleUpdatePlayer}
            isSuperAdmin={user?.role === 'super_admin'}
          />
        </div>

        <div className="importer-section">
          <ExcelImporter onImport={form.handleImportPlayers} />
        </div>
      </main>

      <footer className="page-footer">
        <div className="footer-actions">
          <button onClick={handleExportExcel} className="export-btn">
            <Download size={18} />
            导出为 Excel
          </button>
          <button onClick={handleExportJson} className="export-btn">
            <FileJson size={18} />
            导出为 JSON
          </button>
          <button onClick={save.handleSave} className="save-btn" disabled={save.isLoading}>
            {save.isLoading ? (
              <>
                <Loader2 size={18} className="loader" />
                保存中...
              </>
            ) : (
              <>
                <Save size={18} />
                保存球队信息
              </>
            )}
          </button>
        </div>
      </footer>

      {save.saveProgress && <SaveProgressOverlay saveProgress={save.saveProgress} />}
    </div>
  );
};

export default TeamEntryPage;
