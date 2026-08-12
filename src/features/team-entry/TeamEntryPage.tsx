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
import { useTeamEntry } from './hooks/useTeamEntry';

const TeamEntryPage: React.FC = () => {
  const { user } = useAuth();
  const {
    teamFormData,
    setTeamFormData,
    players,
    compatibleActiveSeasons,
    isSaved,
    isLoading,
    error,
    saveProgress,
    showPdfImporter,
    setShowPdfImporter,
    pdfImportMessage,
    setPdfImportMessage,
    handleAddPlayer,
    handleRemovePlayer,
    handleUpdatePlayer,
    handleImportPlayers,
    handleSave,
    handlePdfTeamsRecognized,
    handleExportJson,
    handleExportExcel,
  } = useTeamEntry();

  if (user && user.role === 'coach' && user.teamId) {
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
        {isSaved && <SuccessToast message="球队信息录入成功！" />}

        {pdfImportMessage && (
          <SuccessToast message={pdfImportMessage} onClose={() => setPdfImportMessage(null)} />
        )}

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {user?.role === 'super_admin' && (
          <PdfImportSection
            showPdfImporter={showPdfImporter}
            onTogglePdfImporter={() => {
              setShowPdfImporter((visible) => !visible);
              setPdfImportMessage(null);
            }}
            onImportSuccess={handlePdfTeamsRecognized}
            onClose={() => setShowPdfImporter(false)}
          />
        )}

        <div className="form-section">
          <TeamForm
            data={teamFormData}
            onChange={setTeamFormData}
            activeSeasons={compatibleActiveSeasons}
            isSuperAdmin={user?.role === 'super_admin'}
          />
        </div>

        <div className="player-section">
          <PlayerList
            players={players}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onUpdatePlayer={handleUpdatePlayer}
            isSuperAdmin={user?.role === 'super_admin'}
          />
        </div>

        <div className="importer-section">
          <ExcelImporter onImport={handleImportPlayers} />
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
          <button onClick={handleSave} className="save-btn" disabled={isLoading}>
            {isLoading ? (
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

      {saveProgress && <SaveProgressOverlay saveProgress={saveProgress} />}
    </div>
  );
};

export default TeamEntryPage;
