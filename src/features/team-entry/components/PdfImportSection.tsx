import React from 'react';
import { FileText, X } from 'lucide-react';
import PdfImporter from '../../../components/PdfImporter';
import { ParsedTeam } from '../../../api/pdf-import.service';

interface PdfImportSectionProps {
  showPdfImporter: boolean;
  onTogglePdfImporter: () => void;
  onImportSuccess: (data: { batchId: string; teams: ParsedTeam[] }) => Promise<void>;
  onClose: () => void;
}

export const PdfImportSection: React.FC<PdfImportSectionProps> = ({
  showPdfImporter,
  onTogglePdfImporter,
  onImportSuccess,
  onClose,
}) => {
  return (
    <section
      className="form-section"
      style={{
        border: '1px solid #a5d8ff',
        background: '#f8fbff',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 className="form-title" style={{ marginBottom: '6px' }}>
            <FileText size={20} />
            PDF 报名表批量导入
          </h2>
          <p style={{ margin: 0, color: '#5c677d', fontSize: '14px' }}>
            可上传一份包含多支球队的官方 PDF，逐队预览；确认当前球队后即可回填到下方录入表单继续修改。
          </p>
        </div>
        <button
          type="button"
          className="add-btn"
          onClick={onTogglePdfImporter}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {showPdfImporter ? <X size={16} /> : <FileText size={16} />}
          {showPdfImporter ? '关闭 PDF 导入' : '上传多球队 PDF'}
        </button>
      </div>

      {showPdfImporter && (
        <div style={{ marginTop: '18px' }}>
          <PdfImporter onImportSuccess={onImportSuccess} onClose={onClose} />
        </div>
      )}
    </section>
  );
};

export default PdfImportSection;
