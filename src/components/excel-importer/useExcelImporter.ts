import { useCallback, useState } from 'react';
import { Player } from '../../types';
import {
  MAX_ROWS,
  parsePlayerRows,
  validateExcelArchive,
  validateExcelFile,
  validateWorksheetData,
} from '../../utils/excelSecurity';
import { uploadImageFile } from '../../utils/imageUpload';

interface UseExcelImporterOptions {
  onImport: (players: Omit<Player, 'id'>[]) => void;
}

export const useExcelImporter = ({ onImport }: UseExcelImporterOptions) => {
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
      const url = await uploadImageFile(
        photoFile,
        `球员 ${previewData[index]?.name || index + 1} 的照片`,
      );
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
      const fileNameWithoutExt =
        imageFile.name.substring(0, imageFile.name.lastIndexOf('.')) || imageFile.name;
      const cleanStem = fileNameWithoutExt.trim();

      const targetIndex = updatedData.findIndex(
        (p) => p.studentId === cleanStem || p.name === cleanStem,
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
    if (unmatchedCount > 0)
      statusParts.push(`${unmatchedCount} 张图片未匹配到球员（文件名需与学号或姓名一致）`);
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
      const XLSX = await import('xlsx');

      const templateData = [
        {
          姓名: '张三',
          学号: '20210001',
          球衣号码: '10',
          照片: 'https://example.com/photos/20210001.jpg',
        },
        {
          姓名: '李四',
          学号: '20210002',
          球衣号码: '11',
          照片: '',
        },
        {
          姓名: '王五',
          学号: '20210003',
          球衣号码: '12',
          照片: '',
        },
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

  return {
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
  };
};
