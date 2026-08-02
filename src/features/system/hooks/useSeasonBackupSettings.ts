import React, { useCallback, useEffect, useState } from 'react';
import { backupApi, seasonApi } from '../../../api/service';
import { BackupDTO } from '../../../api/types';
import { SeasonSummary, SystemFeedback } from './types';

const computeFileSha256 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const useSeasonBackupSettings = ({ setError, setSuccessMessage }: SystemFeedback) => {
  const [backups, setBackups] = useState<BackupDTO[]>([]);
  const [activeSeason, setActiveSeason] = useState<SeasonSummary | null>(null);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonType, setNewSeasonType] = useState('LEAGUE');
  const [isArchivingSeason, setIsArchivingSeason] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<SeasonSummary[]>([]);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);
  const [isRenamingSeasonId, setIsRenamingSeasonId] = useState<string | null>(null);
  const [isDeletingSeasonId, setIsDeletingSeasonId] = useState<string | null>(null);
  const [isCleaningRetention, setIsCleaningRetention] = useState(false);

  const loadAllSeasons = useCallback(async () => {
    try {
      const data = await seasonApi.getAll();
      if (!Array.isArray(data)) {
        throw new Error('赛季列表响应格式不正确');
      }
      setSeasons(data);
    } catch (error) {
      console.error('加载所有赛季失败:', error);
      setSeasons([]);
      setError(error instanceof Error ? error.message : '无法加载赛季列表');
    }
  }, [setError]);

  const loadBackups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await backupApi.list();
      if (response.success) {
        setBackups(response.data || []);
      }
    } catch (error) {
      console.error('加载备份列表失败:', error);
      setError('无法获取云端备份列表，请检查网络或 R2 连接');
    } finally {
      setIsLoading(false);
    }
  }, [setError]);

  const loadActiveSeason = useCallback(async () => {
    try {
      const data = await seasonApi.getActive();
      setActiveSeason(data);
    } catch (error) {
      console.error('加载活跃赛季失败:', error);
      setActiveSeason(null);
    }
  }, []);

  useEffect(() => {
    loadBackups();
    loadActiveSeason();
    loadAllSeasons();
  }, [loadActiveSeason, loadAllSeasons, loadBackups]);

  const handleCreateSeason = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newSeasonName.trim()) return;
    if (!confirm(`确定要创建新赛季"${newSeasonName}"并将其直接设为活跃状态吗？\n\n此操作会重置球员的卡片数，但不会强行归档现有的其他活跃赛季。`)) return;

    setIsArchivingSeason(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await seasonApi.create(newSeasonName, newSeasonType);
      setSuccessMessage(`已成功创建新活跃赛季：${response.name}`);
      setNewSeasonName('');
      loadActiveSeason();
      loadAllSeasons();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('创建新赛季失败:', error);
      setError(error instanceof Error ? error.message : '创建新赛季失败');
    } finally {
      setIsArchivingSeason(false);
    }
  };

  const handleUpdateSeasonStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'archived' : 'active';
    if (!confirm(`确定要将该赛季的状态修改为【${nextStatus === 'active' ? '活跃' : '已归档'}】吗？`)) return;

    setIsUpdatingStatusId(id);
    setError(null);
    setSuccessMessage(null);
    try {
      await seasonApi.updateStatus(id, nextStatus);
      setSuccessMessage('已成功更新赛季状态！');
      loadActiveSeason();
      loadAllSeasons();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('更新赛季状态失败:', error);
      setError(error instanceof Error ? error.message : '更新赛季状态失败');
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  const handleRenameSeason = async (id: string, currentName: string, newName: string) => {
    const name = newName.trim();
    if (!name || name === currentName) return;

    setIsRenamingSeasonId(id);
    setError(null);
    setSuccessMessage(null);
    try {
      await seasonApi.rename(id, name);
      setSuccessMessage(`赛季已重命名为“${name}”`);
      await Promise.all([loadActiveSeason(), loadAllSeasons()]);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('修改赛季名称失败:', error);
      setError(error instanceof Error ? error.message : '修改赛季名称失败');
    } finally {
      setIsRenamingSeasonId(null);
    }
  };

  const handleDeleteSeason = async (id: string, name: string) => {
    setIsDeletingSeasonId(id);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await seasonApi.delete(id);
      if (response.pending) {
        setSuccessMessage(
          `已提交删除赛季“${name}”的审批（${response.approval?.approvedCount ?? 0}/${response.approval?.requiredCount ?? 3}），还需其他超级管理员同意`,
        );
      } else {
        setSuccessMessage(
          `已删除赛季“${name}”及其 ${response.deleted?.matches ?? 0} 场比赛`,
        );
      }
      await Promise.all([loadActiveSeason(), loadAllSeasons()]);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('删除赛季失败:', error);
      setError(error instanceof Error ? error.message : '删除赛季失败');
    } finally {
      setIsDeletingSeasonId(null);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await backupApi.create();
      if (response.success) {
        setSuccessMessage('数据库成功生成 V3.0 GZIP 备份并上传至 Cloudflare R2！');
        loadBackups();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (error) {
      console.error('创建备份失败:', error);
      setError('创建备份失败，请检查 R2 存储桶配置');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    const isGzip = file.name.endsWith('.json.gz');
    const isJson = file.name.endsWith('.json');

    if (!isJson && !isGzip) {
      setError('仅支持上传 .json 或 .json.gz 格式的备份文件');
      return;
    }

    const maxBytes = isGzip ? 100 * 1024 * 1024 : 200 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`上传文件大小超出 ${isGzip ? '100 MB' : '200 MB'} 上限限制`);
      return;
    }

    setIsUploading(true);
    setUploadProgress('计算 SHA-256 摘要中...');
    setError(null);
    setSuccessMessage(null);

    try {
      const sha256 = await computeFileSha256(file);
      setUploadProgress('申请云端直传凭证...');

      const initRes = await backupApi.initUpload(file.name, file.size, sha256);
      if (!initRes.success || !initRes.data) {
        throw new Error('初始化直传凭证失败');
      }

      const { uploadToken, uploadUrl, requiredHeaders } = initRes.data;
      setUploadProgress('直传 Cloudflare R2 中...');

      const headersToSend = requiredHeaders || {
        'Content-Type': isGzip ? 'application/gzip' : 'application/json',
      };

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: headersToSend,
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`文件上传至 R2 失败 (${uploadRes.status})`);
      }

      setUploadProgress('服务端解压与合规校验中...');
      const completeRes = await backupApi.completeUpload(uploadToken);

      if (completeRes.success) {
        setSuccessMessage('本地备份文件已成功直传、校验并保存至云端备份列表！');
        loadBackups();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('上传备份失败:', err);
      setError(err instanceof Error ? err.message : '上传备份失败');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteBackup = async (key: string, isNewest: boolean) => {
    if (isNewest) {
      setError('最新备份点已被系统永久保护，无法删除！');
      return;
    }

    const confirmInput = window.prompt(
      `【高危警告】确定要永久删除云端备份文件吗？\n文件: ${key}\n\n请输入 "DELETE_BACKUP" 以确认删除：`,
    );
    if (confirmInput !== 'DELETE_BACKUP') {
      if (confirmInput !== null) {
        setError('二次确认文本输入错误，取消删除操作');
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await backupApi.deleteBackup(key, 'DELETE_BACKUP');
      if (res.success) {
        setSuccessMessage('已成功删除指定云端备份文件');
        loadBackups();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('删除备份失败:', err);
      setError(err instanceof Error ? err.message : '删除备份失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanRetention = async (dryRun: boolean = true) => {
    setIsCleaningRetention(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (dryRun) {
        const res = await backupApi.cleanRetention(true);
        if (res.success) {
          const planned = res.data.plannedDeletions || [];
          if (planned.length === 0) {
            setSuccessMessage('保留策略检查完成：当前所有备份均在安全保留窗口内，无需清理。');
          } else {
            alert(
              `【Retention Dry-run 检查结果】\n` +
                `规划清理文件数: ${planned.length}\n` +
                `保留备份数: ${res.data.keptCount}\n\n` +
                planned.map((p, i) => `${i + 1}. ${p.filename} (${p.reason})`).join('\n'),
            );
          }
        }
      } else {
        const confirmInput = window.prompt(
          '【高危操作】确定要根据保留策略执行物理删除吗？\n\n请输入 "EXECUTE_RETENTION_DELETE" 以确认执行：',
        );
        if (confirmInput !== 'EXECUTE_RETENTION_DELETE') {
          if (confirmInput !== null) setError('确认文本输入错误，终止保留清理操作');
          return;
        }

        const res = await backupApi.cleanRetention(false, 'EXECUTE_RETENTION_DELETE');
        if (res.success) {
          setSuccessMessage(`保留策略物理清理已完成！成功清理 ${res.data.deletedCount} 个超出保存窗口的备份。`);
          loadBackups();
        }
      }
    } catch (err: any) {
      console.error('保留策略清理失败:', err);
      setError(err instanceof Error ? err.message : '保留策略清理失败');
    } finally {
      setIsCleaningRetention(false);
    }
  };

  const handleRestore = async (key: string) => {
    if (!confirm('【警告】还原数据库将会删除并完全覆盖当前数据库中的所有球队、球员、赛程、进球和事件记录！此操作不可逆！\n\n确定要还原到选中的备份吗？')) return;

    setIsRestoring(key);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await backupApi.restore(key, 'CONFIRM_RESTORE');
      if (response.success) {
        setSuccessMessage('数据库已成功恢复至指定备份状态！');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (error) {
      console.error('还原备份失败:', error);
      setError('还原失败，备份文件可能损坏或网络连接中断');
    } finally {
      setIsRestoring(null);
    }
  };

  return {
    backups,
    activeSeason,
    newSeasonName,
    newSeasonType,
    isArchivingSeason,
    isLoading,
    isBackingUp,
    isRestoring,
    isUploading,
    uploadProgress,
    isCleaningRetention,
    seasons,
    isUpdatingStatusId,
    isRenamingSeasonId,
    isDeletingSeasonId,
    setNewSeasonName,
    setNewSeasonType,
    loadBackups,
    loadAllSeasons,
    loadActiveSeason,
    handleCreateSeason,
    handleUpdateSeasonStatus,
    handleRenameSeason,
    handleDeleteSeason,
    handleCreateBackup,
    handleUploadFile,
    handleDeleteBackup,
    handleCleanRetention,
    handleRestore,
  };
};
