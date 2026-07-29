import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Check, X, AlertCircle, Download, Image as ImageIcon } from 'lucide-react';
import { Player } from '../types';
import {
  MAX_ROWS,
  validateExcelArchive,
  validateExcelFile,
  validateWorksheetData,
  parsePlayerRows,
} from '../utils/excelSecurity';
import { uploadImageFile } from '../utils/imageUpload';

interface ExcelImporterProps {
  onImport: (players: Omit<Player, 'id'>[]) => void;
}

const ExcelImporter: React.FC<ExcelImporterProps> = ({ onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Omit<Player, 'id'>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [batchMatchingStatus, setBatchMatchingStatus] = useState<string | null>(null);
  const [uploadingRowIndex, setUploadingRowIndex] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileValidation = validateExcelFile(selectedFile);
      if (!fileValidation.valid) {
        setError(fileValidation.error || '无效文件');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setIsPreviewing(false);
      setPreviewData([]);
      setBatchMatchingStatus(null);
    }
  };

  const parseExcel = useCallback(async () => {
    if (!file) return;

    const fileValidation = validateExcelFile(file);
    if (!fileValidation.valid) {
      setError(fileValidation.error || '文件验证失败');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBatchMatchingStatus(null);

    try {
      // 动态导入 xlsx
      const XLSX = await import('xlsx');

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (!(result instanceof ArrayBuffer)) {
            setError('读取 Excel 文件内容失败，解析数据出错');
            setIsLoading(false);
            return;
          }
          const data = new Uint8Array(result);
          const archiveValidation = validateExcelArchive(data, file.name);
          if (!archiveValidation.valid) {
            setError(archiveValidation.error || 'Excel 压缩包验证失败');
            setIsLoading(false);
            return;
          }

          const workbookMetadata = XLSX.read(data, {
            type: 'array',
            bookSheets: true,
          });
          const metadataValidation = validateWorksheetData(
            workbookMetadata.SheetNames || [],
            [],
          );

          if (!metadataValidation.valid) {
            setError(metadataValidation.error || '工作簿验证失败');
            setIsLoading(false);
            return;
          }

          const sheetName = workbookMetadata.SheetNames[0];
          const workbook = XLSX.read(data, {
            type: 'array',
            sheets: sheetName,
            sheetRows: MAX_ROWS + 2,
          });
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
          const sheetDataValidation = validateWorksheetData(
            workbookMetadata.SheetNames,
            jsonData,
          );

          if (!sheetDataValidation.valid) {
            setError(sheetDataValidation.error || '工作表数据验证失败');
            setIsLoading(false);
            return;
          }

          const validPlayers = parsePlayerRows(jsonData);

          if (validPlayers.length === 0) {
            setError('未找到有效的球员数据，请检查 Excel 文件格式');
            setIsLoading(false);
            return;
          }

          setPreviewData(validPlayers);
          setIsPreviewing(true);
          setError(null);
          setIsLoading(false);
        } catch (err) {
          setError('解析 Excel 文件失败，请确保文件格式正确');
          console.error(err);
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError('加载 Excel 解析库失败，请稍后重试');
      console.error(err);
      setIsLoading(false);
    }
  }, [file]);

  const isBusy = isLoading || uploadingRowIndex !== null;

  const handleSinglePhotoUpload = async (index: number, photoFile: File) => {
    try {
      setUploadingRowIndex(index);
      setError(null);
      const url = await uploadImageFile(photoFile, `球员 ${previewData[index]?.name || index + 1} 的照片`);
      setPreviewData((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const updated = [...prev];
        updated[index] = { ...updated[index], photo: url };
        return updated;
      });
    } catch (err: any) {
      setError(err?.message || '图片上传失败');
    } finally {
      setUploadingRowIndex(null);
    }
  };

  const handleBatchPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    // 重置 input 以允许再次选择同名图片
    e.target.value = '';

    const imageFiles = rawFiles.filter((f) => f.type.startsWith('image/'));
    const ignoredCount = rawFiles.length - imageFiles.length;

    if (imageFiles.length === 0) {
      setBatchMatchingStatus(`所选的 ${rawFiles.length} 个文件均非有效图片格式。`);
      return;
    }

    setIsLoading(true);
    setBatchMatchingStatus('正在上传与匹配照片...');
    setError(null);

    let matchedCount = 0;
    let failedCount = 0;
    let unmatchedCount = 0;

    const updatedData = [...previewData];

    for (const imageFile of imageFiles) {
      const fileNameWithoutExt = imageFile.name.substring(0, imageFile.name.lastIndexOf('.')) || imageFile.name;
      const cleanStem = fileNameWithoutExt.trim();

      // 按学号或姓名寻找相匹配的球员
      const targetIndex = updatedData.findIndex(
        (p) => p.studentId === cleanStem || p.name === cleanStem
      );

      if (targetIndex === -1) {
        unmatchedCount++;
      } else {
        try {
          const url = await uploadImageFile(imageFile, `照片 ${imageFile.name}`);
          updatedData[targetIndex] = { ...updatedData[targetIndex], photo: url };
          matchedCount++;
        } catch (err) {
          failedCount++;
          console.error(`上传图片 ${imageFile.name} 失败`, err);
        }
      }
    }

    setPreviewData(updatedData);
    setIsLoading(false);

    const statusParts: string[] = [`批量处理完成 (${imageFiles.length} 张图片)`];
    if (matchedCount > 0) statusParts.push(`成功匹配并更新 ${matchedCount} 张照片`);
    if (failedCount > 0) statusParts.push(`${failedCount} 张匹配图片上传失败`);
    if (unmatchedCount > 0) statusParts.push(`${unmatchedCount} 张图片未匹配到球员（文件名需与学号或姓名一致）`);
    if (ignoredCount > 0) statusParts.push(`忽略 ${ignoredCount} 个非图片文件`);

    setBatchMatchingStatus(statusParts.join('；') + '。');
  };

  const handleConfirm = () => {
    if (isBusy) return;
    if (previewData.length > 0) {
      onImport(previewData);
      setFile(null);
      setPreviewData([]);
      setIsPreviewing(false);
      setBatchMatchingStatus(null);
    }
  };

  const handleCancel = () => {
    if (isBusy) return;
    setFile(null);
    setPreviewData([]);
    setIsPreviewing(false);
    setError(null);
    setBatchMatchingStatus(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      // 动态导入 xlsx
      const XLSX = await import('xlsx');

      const templateData = [
        {
          '姓名': '张三',
          '学号': '20210001',
          '球衣号码': '10',
          '照片': 'https://example.com/photos/20210001.jpg',
        },
        {
          '姓名': '李四',
          '学号': '20210002',
          '球衣号码': '11',
          '照片': '',
        },
        {
          '姓名': '王五',
          '学号': '20210003',
          '球衣号码': '12',
          '照片': '',
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '球员信息');

      XLSX.writeFile(workbook, '球员信息导入模板.xlsx');
    } catch (err) {
      setError('加载 Excel 解析库失败，请稍后重试');
      console.error(err);
    }
  };

  return (
    <div className="excel-importer">
      <h3 className="importer-title">
        <FileSpreadsheet size={20} />
        Excel 批量导入
      </h3>

      {!isPreviewing ? (
        <div className="upload-section">
          <div className="drop-zone">
            <Upload size={48} />
            <p>点击或拖拽上传 Excel 文件</p>
            <p className="hint">支持 .xlsx 和 .xls 格式</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          {file && (
            <div className="file-info">
              <span>{file.name}</span>
              <button onClick={() => setFile(null)} className="remove-file">
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {file && !error && (
            <button onClick={parseExcel} className="parse-btn" disabled={isLoading}>
              {isLoading ? '解析中...' : '解析文件'}
            </button>
          )}
        </div>
      ) : (
        <div className="preview-section">
          <div className="preview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4>预览导入数据</h4>
              <p>共 {previewData.length} 条记录</p>
            </div>
            <div>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: isBusy ? '#f1f3f5' : '#e7f5ff',
                  color: isBusy ? '#adb5bd' : '#1c7ed6',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  border: isBusy ? '1px solid #dee2e6' : '1px solid #a5d8ff',
                  fontWeight: 500,
                  opacity: isBusy ? 0.7 : 1,
                }}
              >
                <ImageIcon size={16} />
                批量选择本地照片 (按学号/姓名自动匹配)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isBusy}
                  onChange={handleBatchPhotosUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {batchMatchingStatus && (
            <div style={{ margin: '8px 0 12px 0', padding: '8px 12px', borderRadius: '6px', background: '#f4fce3', border: '1px solid #d8f5a2', color: '#2b8a3e', fontSize: '13px' }}>
              {batchMatchingStatus}
            </div>
          )}

          {error && (
            <div className="error-message" style={{ marginBottom: '12px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>照片</th>
                  <th>姓名</th>
                  <th>学号</th>
                  <th>球衣号码</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((player, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'center' }}>
                      {player.photo ? (
                        <img
                          src={player.photo}
                          alt={player.name}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#e9ecef',
                            color: '#6c757d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            margin: '0 auto',
                          }}
                        >
                          无
                        </div>
                      )}
                    </td>
                    <td>{player.name}</td>
                    <td>{player.studentId}</td>
                    <td>{player.jerseyNumber}</td>
                    <td style={{ textAlign: 'center' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          background: isBusy ? '#f8f9fa' : '#f1f3f5',
                          color: isBusy ? '#adb5bd' : '#495057',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: isBusy ? 'not-allowed' : 'pointer',
                          border: '1px solid #ced4da',
                          opacity: isBusy ? 0.7 : 1,
                        }}
                      >
                        <ImageIcon size={12} />
                        {uploadingRowIndex === index ? '上传中' : player.photo ? '更换' : '上传照片'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isBusy}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleSinglePhotoUpload(index, f);
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="preview-actions">
            <button onClick={handleConfirm} className="confirm-btn" disabled={isBusy}>
              <Check size={16} />
              确认导入
            </button>
            <button onClick={handleCancel} className="cancel-btn" disabled={isBusy}>
              <X size={16} />
              取消
            </button>
          </div>
        </div>
      )}

      <div className="template-info">
        <div className="template-header">
          <p>Excel 模板格式：</p>
          <button onClick={handleDownloadTemplate} className="download-template-btn">
            <Download size={16} />
            下载模板
          </button>
        </div>
        <ul>
          <li>列名：姓名、学号、球衣号码、照片（可选，支持图片 URL 链接）</li>
          <li>第一行为表头，从第二行开始为数据</li>
          <li>除在 Excel 中填写照片 URL 外，解析后还可在预览界面批量选择本地照片（文件名需与学号或姓名一致，如 <code>20210001.jpg</code> 或 <code>张三.png</code>）</li>
        </ul>
      </div>
    </div>
  );
};

export default ExcelImporter;
