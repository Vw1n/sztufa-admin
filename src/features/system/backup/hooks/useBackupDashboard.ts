import { useState, useEffect, useCallback } from "react";
import { backupApi, BackupDashboardDTO } from "../../../../api/backup.service";

export function useBackupDashboard() {
  const [dashboard, setDashboard] = useState<BackupDashboardDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await backupApi.getDashboard();
      if (res.success) {
        setDashboard(res.data);
      } else {
        setError("获取备份监控概览失败");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "网络请求异常，无法加载监控概览",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const retryRun = useCallback(
    async (runId: string): Promise<boolean> => {
      setRetryingRunId(runId);
      try {
        const res = await backupApi.retryRun(runId);
        if (res.success) {
          await fetchDashboard();
          return true;
        }
        return false;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "重试任务失败");
        return false;
      } finally {
        setRetryingRunId(null);
      }
    },
    [fetchDashboard],
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboard,
    loading,
    error,
    refresh: fetchDashboard,
    retryingRunId,
    retryRun,
  };
}
