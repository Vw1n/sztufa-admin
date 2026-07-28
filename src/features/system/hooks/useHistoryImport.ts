import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { importApi } from '../../../api/service';
import {
  ImportExecutionResult,
  ImportPreview,
  LastImportBatch,
  UndoImportResult,
} from '../../../api/types';

const MAX_FILES = 10;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export const useHistoryImport = (onImported?: (message: string) => void) => {
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportExecutionResult | null>(null);
  const [undoResult, setUndoResult] = useState<UndoImportResult | null>(null);
  const [lastImport, setLastImport] = useState<LastImportBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  const loadLastImport = useCallback(async () => {
    try {
      setLastImport(await importApi.getLast());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '无法获取最近导入记录');
    }
  }, []);

  useEffect(() => {
    loadLastImport();
  }, [loadLastImport]);

  const selectFiles = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    setPreview(null);
    setResult(null);
    setUndoResult(null);
    setError(null);

    if (selected.length > MAX_FILES) {
      setFiles([]);
      setError(`一次最多选择 ${MAX_FILES} 个 JSON 文件`);
      return;
    }
    const invalidFile = selected.find((file) => !file.name.toLowerCase().endsWith('.json'));
    if (invalidFile) {
      setFiles([]);
      setError(`只支持 JSON 文件：${invalidFile.name}`);
      return;
    }
    const oversizedFile = selected.find((file) => file.size > MAX_FILE_BYTES);
    if (oversizedFile) {
      setFiles([]);
      setError(`单个文件不能超过 2MB：${oversizedFile.name}`);
      return;
    }
    setFiles(selected);
  }, []);

  const previewFiles = useCallback(async () => {
    if (files.length === 0) {
      setError('请先选择分赛季 JSON 文件');
      return;
    }
    setIsPreviewing(true);
    setError(null);
    setResult(null);
    try {
      setPreview(await importApi.preview(files));
    } catch (caught) {
      setPreview(null);
      setError(caught instanceof Error ? caught.message : '文件预检失败');
    } finally {
      setIsPreviewing(false);
    }
  }, [files]);

  const importFiles = useCallback(async () => {
    if (!preview?.canImport) {
      setError('当前预检结果不可导入，请先处理错误');
      return;
    }
    setIsImporting(true);
    setError(null);
    try {
      const response = await importApi.execute(files, preview.digest);
      setResult(response.result);
      setUndoResult(null);
      setPreview(null);
      await loadLastImport();
      onImported?.(response.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '历史数据导入失败');
    } finally {
      setIsImporting(false);
    }
  }, [files, loadLastImport, onImported, preview]);

  const undoLastImport = useCallback(async () => {
    setIsUndoing(true);
    setError(null);
    try {
      const response = await importApi.undoLast();
      setUndoResult(response.result);
      setResult(null);
      setPreview(null);
      setFiles([]);
      await loadLastImport();
      onImported?.(response.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '撤销历史导入失败');
    } finally {
      setIsUndoing(false);
    }
  }, [loadLastImport, onImported]);

  return {
    files,
    preview,
    result,
    undoResult,
    lastImport,
    error,
    isPreviewing,
    isImporting,
    isUndoing,
    selectFiles,
    previewFiles,
    importFiles,
    undoLastImport,
  };
};
