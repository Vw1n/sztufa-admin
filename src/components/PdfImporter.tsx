import React from 'react';
import { AlertCircle, Check, FileText, X } from 'lucide-react';
import { ParsedTeam } from '../api/pdf-import.service';
import PdfPlayerTable from './pdf-importer/PdfPlayerTable';
import PdfTeamInfoEditor from './pdf-importer/PdfTeamInfoEditor';
import PdfTeamSelectorTabs from './pdf-importer/PdfTeamSelectorTabs';
import PdfUploadDropzone from './pdf-importer/PdfUploadDropzone';
import { usePdfImporter } from './pdf-importer/usePdfImporter';

interface PdfImporterProps {
  onImportSuccess: (importedData: { batchId: string; teams: ParsedTeam[] }) => void | Promise<void>;
  onClose?: () => void;
}

const PdfImporter: React.FC<PdfImporterProps> = ({ onImportSuccess, onClose }) => {
  const {
    file,
    isLoading,
    error,
    previewData,
    activeTeamIndex,
    setActiveTeamIndex,
    uploadingTeamAsset,
    currentTeam,
    isBusy,
    handleFileChange,
    handleUploadAndPreview,
    handleFieldChange,
    handlePlayerChange,
    handleTogglePlayerConfirm,
    handleSinglePhotoUpload,
    handleTeamAssetUpload,
    handleCommit,
    handleCancel,
  } = usePdfImporter({ onImportSuccess, onClose });

  return (
    <div
      className="pdf-importer"
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '960px',
        margin: '0 auto',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      }}
    >
      <div
        className="importer-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '15px',
        }}
      >
        <h3
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '18px',
            color: '#1c7ed6',
          }}
        >
          <FileText size={22} />
          PDF 官方足球赛报名表智能识别导入
        </h3>
        {onClose && (
          <button
            onClick={handleCancel}
            disabled={isBusy}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#868e96' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: '#fff5f5',
            border: '1px solid #ffc9c9',
            color: '#fa5252',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!previewData ? (
        <PdfUploadDropzone
          file={file}
          isLoading={isLoading}
          onFileChange={handleFileChange}
          onUploadAndPreview={handleUploadAndPreview}
        />
      ) : (
        <div className="preview-section">
          <PdfTeamSelectorTabs
            teams={previewData.teams}
            activeTeamIndex={activeTeamIndex}
            onSelectTeam={setActiveTeamIndex}
          />

          {currentTeam && (
            <PdfTeamInfoEditor
              currentTeam={currentTeam}
              activeTeamIndex={activeTeamIndex}
              isBusy={isBusy}
              uploadingTeamAsset={uploadingTeamAsset}
              onFieldChange={handleFieldChange}
              onTeamAssetUpload={handleTeamAssetUpload}
            />
          )}

          {currentTeam && (
            <PdfPlayerTable
              currentTeam={currentTeam}
              hasLowConfidence={previewData.hasLowConfidence}
              isBusy={isBusy}
              onPlayerChange={handlePlayerChange}
              onTogglePlayerConfirm={handleTogglePlayerConfirm}
              onSinglePhotoUpload={handleSinglePhotoUpload}
            />
          )}

          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              onClick={handleCancel}
              disabled={isBusy}
              style={{
                padding: '8px 20px',
                background: '#f1f3f5',
                color: '#495057',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                cursor: isBusy ? 'not-allowed' : 'pointer',
              }}
            >
              取消
            </button>
            <button
              onClick={handleCommit}
              disabled={isBusy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 24px',
                background: '#228be6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: isBusy ? 'not-allowed' : 'pointer',
              }}
            >
              <Check size={16} />
              {isLoading ? '正在回填...' : '回填当前球队到录入表单'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfImporter;
