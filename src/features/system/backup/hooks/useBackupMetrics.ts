import { useState, useEffect, useCallback } from "react";
import {
  backupApi,
  BackupMetricsSummaryDTO,
  BackupMetricsTimeseriesPoint,
} from "../../../../api/backup.service";

export function useBackupMetrics(initialPeriod?: string) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    initialPeriod ||
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
      }).format(new Date()),
  );

  const [summary, setSummary] = useState<BackupMetricsSummaryDTO | null>(null);
  const [timeseries, setTimeseries] = useState<BackupMetricsTimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, timeRes] = await Promise.all([
        backupApi.getMetricsSummary(selectedPeriod),
        backupApi.getMetricsTimeseries(6),
      ]);

      if (sumRes.success) {
        setSummary(sumRes.data);
      }
      if (timeRes.success) {
        setTimeseries(timeRes.data);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "获取备份流量与基线数据失败",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    summary,
    timeseries,
    loading,
    error,
    refresh: fetchMetrics,
    selectedPeriod,
    setSelectedPeriod,
  };
}
