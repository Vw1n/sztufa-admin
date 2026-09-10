import { useState, useEffect, useCallback } from "react";
import { backupApi, BackupRunDTO } from "../../../../api/backup.service";

export function useBackupRunHistory(initialLimit = 20) {
  const [runs, setRuns] = useState<BackupRunDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterModule, setFilterModule] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterTrigger, setFilterTrigger] = useState<string>("");
  const [filterBackupKey, setFilterBackupKey] = useState<string>("");
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * limit;
      const res = await backupApi.listRuns({
        module: filterModule || undefined,
        status: filterStatus || undefined,
        trigger: filterTrigger || undefined,
        backupKey: filterBackupKey || undefined,
        limit,
        offset,
      });

      if (res.success) {
        setRuns(res.data.items);
        setTotal(res.data.total);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "获取运行记录账本失败",
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterModule, filterStatus, filterTrigger, filterBackupKey]);

  const retryRun = useCallback(
    async (runId: string): Promise<boolean> => {
      setRetryingRunId(runId);
      try {
        const res = await backupApi.retryRun(runId);
        if (res.success) {
          await fetchRuns();
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
    [fetchRuns],
  );

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return {
    runs,
    total,
    page,
    setPage,
    limit,
    setLimit,
    loading,
    error,
    refresh: fetchRuns,
    filterModule,
    setFilterModule,
    filterStatus,
    setFilterStatus,
    filterTrigger,
    setFilterTrigger,
    filterBackupKey,
    setFilterBackupKey,
    retryingRunId,
    retryRun,
  };
}
