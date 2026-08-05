import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Player } from '../types';
import ExcelPreviewSection from './excel-importer/ExcelPreviewSection';
import ExcelTemplateFooter from './excel-importer/ExcelTemplateFooter';
import ExcelUploadSection from './excel-importer/ExcelUploadSection';
import { useExcelImporter } from './excel-importer/useExcelImporter';

interface ExcelImporterProps {
  onImport: (players: Omit<Player, 'id'>[]) => void;
}

const ExcelImporter: React.FC<ExcelImporterProps> = ({ onImport }) => {
  const {
    file,
    setFile,
    previewData,
    error,
    isPreviewing,
    isLoading,
    batchMatchingStatus,
    uploadingRowIndex,
    isBusy,
    handleFileChange,
    parseExcel,
    handleSinglePhotoUpload,
    handleBatchPhotosUpload,
    handleConfirm,
    handleCancel,
    handleDownloadTemplate,
  } = useExcelImporter({ onImport });

  return (
    <div className="excel-importer">
      <h3 className="importer-title">
        <FileSpreadsheet size={20} />
        Excel 批量导入
      </h3>

      {!isPreviewing ? (
        <ExcelUploadSection
          file={file}
          error={error}
          isLoading={isLoading}
          onFileChange={handleFileChange}
          onRemoveFile={() => setFile(null)}
          onParseExcel={parseExcel}
        />
      ) : (
        <ExcelPreviewSection
          previewData={previewData}
          error={error}
          batchMatchingStatus={batchMatchingStatus}
          uploadingRowIndex={uploadingRowIndex}
          isBusy={isBusy}
          onBatchPhotosUpload={handleBatchPhotosUpload}
          onSinglePhotoUpload={handleSinglePhotoUpload}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      <ExcelTemplateFooter onDownloadTemplate={handleDownloadTemplate} />
    </div>
  );
};

export default ExcelImporter;
