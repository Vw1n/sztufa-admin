import { BackupDTO } from "./types";
import { authenticatedRequest } from "./core";

export interface InitUploadResult {
  uploadToken: string;
  uploadUrl: string;
  key: string;
  expiresIn: number;
  requiredHeaders?: Record<string, string>;
}

export interface RetentionResult {
  dryRun: boolean;
  plannedDeletions: Array<{
    key: string;
    filename: string;
    reason: string;
    lastModified?: string;
  }>;
  keptCount: number;
  deletedCount: number;
}

export type BackupCreateRequest =
  | { scope: "full"; protected?: boolean }
  | {
      scope: "module";
      module: "season";
      selector: { seasonId: string };
      purpose?: "manual" | "archive";
      protected?: boolean;
    }
  | {
      scope: "module";
      module: "staff" | "members" | "content" | "operations";
      selector: Record<string, never>;
      protected?: boolean;
    };

export interface ArchiveSeasonCoverage {
  id: string;
  name: string;
  archivedAt: string | null;
  hasProtectedBackup: boolean;
  isCorrupt?: boolean;
  backupKey?: string | null;
  objectSize?: number | null;
  verifiedAt?: string | null;
  lastError?: string | null;
}

export interface ArchiveCoverageSummary {
  total: number;
  protected: number;
  missing: number;
  corrupt: number;
  seasons: ArchiveSeasonCoverage[];
}

export interface ArchiveBackfillPreviewResult {
  missingSeasons: Array<{ id: string; name: string; archivedAt: string | null }>;
  affectedTables: readonly string[];
  estimatedRows: null;
  estimatedBytes: null;
  notice: string;
  backfillToken: string;
}

export interface ArchiveBackfillExecuteResult {
  total: number;
  succeeded: number;
  skipped: number;
  failed: number;
  items: Array<{
    seasonId: string;
    status: "succeeded" | "skipped" | "failed";
    reason?: string;
    backupKey?: string;
    error?: string;
  }>;
}

export interface BackupRestorePreview {
  key: string;
  module: "season" | "staff" | "members" | "content" | "operations";
  selector: Record<string, string>;
  strategy: "replace-module" | "merge" | "merge-only";
  tableCounts: Record<string, number>;
  compressedBytes: number;
  decompressedBytes: number;
  canExecute: boolean;
  warning: string;
  expiresAt: string;
  restoreToken: string;
}

export const backupApi = {
  create: async (
    request: BackupCreateRequest = { scope: "full" },
  ): Promise<{ success: boolean; data: BackupDTO }> => {
    return authenticatedRequest<{ success: boolean; data: BackupDTO }>(
      "/backups/create",
      { method: "POST", body: JSON.stringify(request) },
    );
  },
  list: async (): Promise<{ success: boolean; data: BackupDTO[] }> => {
    return authenticatedRequest<{ success: boolean; data: BackupDTO[] }>(
      "/backups/list",
      { method: "GET" },
    );
  },
  getDownloadUrl: async (
    key: string,
  ): Promise<{ success: boolean; downloadUrl: string }> => {
    return authenticatedRequest<{ success: boolean; downloadUrl: string }>(
      "/backups/download-url",
      { method: "POST", body: JSON.stringify({ key }) },
    );
  },
  restore: async (
    key: string,
    confirmText: string,
  ): Promise<{ success: boolean; message: string }> => {
    return authenticatedRequest<{ success: boolean; message: string }>(
      "/backups/restore",
      { method: "POST", body: JSON.stringify({ key, confirmText }) },
    );
  },
  previewRestore: async (
    key: string,
  ): Promise<{ success: boolean; data: BackupRestorePreview }> => {
    return authenticatedRequest<{ success: boolean; data: BackupRestorePreview }>(
      "/backups/restore/preview",
      { method: "POST", body: JSON.stringify({ key }) },
    );
  },
  restoreModule: async (
    key: string,
    restoreToken: string,
    confirmText: string,
  ): Promise<{ success: boolean; message: string }> => {
    return authenticatedRequest<{ success: boolean; message: string }>(
      "/backups/restore/module",
      { method: "POST", body: JSON.stringify({ key, restoreToken, confirmText }) },
    );
  },
  initUpload: async (
    filename: string,
    size: number,
    sha256: string,
  ): Promise<{ success: boolean; data: InitUploadResult }> => {
    return authenticatedRequest<{ success: boolean; data: InitUploadResult }>(
      "/backups/upload/init",
      { method: "POST", body: JSON.stringify({ filename, size, sha256 }) },
    );
  },
  completeUpload: async (
    uploadToken: string,
  ): Promise<{ success: boolean; data: BackupDTO }> => {
    return authenticatedRequest<{ success: boolean; data: BackupDTO }>(
      "/backups/upload/complete",
      { method: "POST", body: JSON.stringify({ uploadToken }) },
    );
  },
  deleteBackup: async (
    key: string,
    confirmText: string,
  ): Promise<{ success: boolean; message: string }> => {
    return authenticatedRequest<{ success: boolean; message: string }>(
      "/backups",
      { method: "DELETE", body: JSON.stringify({ key, confirmText }) },
    );
  },
  cleanRetention: async (
    dryRun: boolean = true,
    confirmText?: string,
  ): Promise<{ success: boolean; data: RetentionResult }> => {
    return authenticatedRequest<{ success: boolean; data: RetentionResult }>(
      "/backups/retention/clean",
      { method: "POST", body: JSON.stringify({ dryRun, confirmText }) },
    );
  },
  getArchiveCoverage: async (): Promise<{
    success: boolean;
    data: ArchiveCoverageSummary;
  }> => {
    return authenticatedRequest<{
      success: boolean;
      data: ArchiveCoverageSummary;
    }>("/backups/archive-coverage", { method: "GET" });
  },
  previewArchiveBackfill: async (
    seasonIds?: string[],
  ): Promise<{ success: boolean; data: ArchiveBackfillPreviewResult }> => {
    return authenticatedRequest<{
      success: boolean;
      data: ArchiveBackfillPreviewResult;
    }>("/backups/archive-backfill/preview", {
      method: "POST",
      body: JSON.stringify({ seasonIds }),
    });
  },
  executeArchiveBackfill: async (
    backfillToken: string,
    seasonIds?: string[],
  ): Promise<{ success: boolean; data: ArchiveBackfillExecuteResult }> => {
    return authenticatedRequest<{
      success: boolean;
      data: ArchiveBackfillExecuteResult;
    }>("/backups/archive-backfill/execute", {
      method: "POST",
      body: JSON.stringify({ backfillToken, seasonIds }),
    });
  },
  retryArchiveSeasonBackfill: async (
    seasonId: string,
  ): Promise<{
    success: boolean;
    data: {
      seasonId: string;
      status: "succeeded" | "skipped" | "failed";
      reason?: string;
      backupKey?: string;
      error?: string;
    };
  }> => {
    return authenticatedRequest<{
      success: boolean;
      data: {
        seasonId: string;
        status: "succeeded" | "skipped" | "failed";
        reason?: string;
        backupKey?: string;
        error?: string;
      };
    }>(`/backups/archive-backfill/${seasonId}/retry`, { method: "POST" });
  },
  getDashboard: async (): Promise<{
    success: boolean;
    data: BackupDashboardDTO;
  }> => {
    return authenticatedRequest<{
      success: boolean;
      data: BackupDashboardDTO;
    }>("/backups/dashboard", { method: "GET" });
  },
  getMetricsSummary: async (
    periodKey?: string,
  ): Promise<{
    success: boolean;
    data: BackupMetricsSummaryDTO;
  }> => {
    const query = periodKey ? `?periodKey=${encodeURIComponent(periodKey)}` : "";
    return authenticatedRequest<{
      success: boolean;
      data: BackupMetricsSummaryDTO;
    }>(`/backups/metrics/summary${query}`, { method: "GET" });
  },
  getMetricsTimeseries: async (
    months?: number,
  ): Promise<{
    success: boolean;
    data: BackupMetricsTimeseriesPoint[];
  }> => {
    const query = months ? `?months=${months}` : "";
    return authenticatedRequest<{
      success: boolean;
      data: BackupMetricsTimeseriesPoint[];
    }>(`/backups/metrics/timeseries${query}`, { method: "GET" });
  },
  listRuns: async (
    query: BackupRunListQuery = {},
  ): Promise<{
    success: boolean;
    data: BackupRunListResponse;
  }> => {
    const params = new URLSearchParams();
    if (query.module) params.append("module", query.module);
    if (query.status) params.append("status", query.status);
    if (query.trigger) params.append("trigger", query.trigger);
    if (query.batchId) params.append("batchId", query.batchId);
    if (query.selectorKey) params.append("selectorKey", query.selectorKey);
    if (query.backupKey) params.append("backupKey", query.backupKey);
    if (query.limit !== undefined) params.append("limit", String(query.limit));
    if (query.offset !== undefined) params.append("offset", String(query.offset));

    const qs = params.toString() ? `?${params.toString()}` : "";
    return authenticatedRequest<{
      success: boolean;
      data: BackupRunListResponse;
    }>(`/backups/runs${qs}`, { method: "GET" });
  },
  retryRun: async (
    runId: string,
  ): Promise<{
    success: boolean;
    data: BackupRunDTO;
  }> => {
    return authenticatedRequest<{ success: boolean; data: BackupRunDTO }>(
      `/backups/runs/${runId}/retry`,
      { method: "POST" },
    );
  },
};

export interface BackupDashboardDTO {
  applicationBudget: {
    usedBytes: string;
    limitBytes: string;
    warningBytes: string;
    criticalBytes: string;
    alertLevel: "normal" | "warning" | "critical";
    percent: number;
  };
  neonOfficial: {
    status: "configured" | "not_configured" | "unavailable";
    dataTransferBytes: string | null;
    limitBytes: string;
    warningBytes: string;
    criticalBytes: string;
    alertLevel: "normal" | "warning" | "critical" | "unknown";
    billingPeriod: string | null;
    capturedAt: string | null;
    stale: boolean;
  };
  storageUploaded: {
    usedBytes: string;
  };
  moduleHealth: Array<{
    module: "season" | "staff" | "members" | "content" | "operations";
    lastRunStatus: string | null;
    lastRunAt: string | null;
    lastSuccessfulBackupKey: string | null;
    lastSuccessfulAt: string | null;
    fingerprint: string | null;
  }>;
  nextScheduledAt: string;
  currentMonthStats: {
    periodKey: string;
    totalRuns: number;
    succeededRuns: number;
    failedRuns: number;
    skippedRuns: number;
    hasFailedRuns: boolean;
    recentFailedRuns: Array<{
      id: string;
      module: string;
      selectorKey: string;
      trigger: string;
      failureCode: string | null;
      failureMessage: string | null;
      createdAt: string;
    }>;
  };
}

export interface BaselineDimensionComparison {
  baselineAvailable: boolean;
  baselineBytes: string | null;
  currentBytes: string;
  savedBytes: string | null;
  percentSaved: number | null;
  baselineSource: "monthly_manual_full" | "historical_full" | "none";
  baselineBackupKey: string | null;
}

export interface BackupMetricsSummaryDTO {
  periodKey: string;
  databaseExport: BaselineDimensionComparison;
  storageUpload: BaselineDimensionComparison;
  totals: {
    databaseBytesEstimated: string;
    uncompressedBytes: string;
    uploadedBytes: string;
    runsCount: number;
  };
  hasIncompleteBatches: boolean;
}

export interface BackupMetricsTimeseriesPoint {
  periodKey: string;
  databaseBytesEstimated: string;
  uncompressedBytes: string;
  uploadedBytes: string;
  totalRuns: number;
  succeededRuns: number;
  failedRuns: number;
  skippedRuns: number;
}

export interface BackupRunDTO {
  id: string;
  batchId?: string | null;
  taskKey?: string | null;
  trigger: string;
  scope: string;
  module: string;
  selectorKey: string;
  purpose: string;
  status: "pending" | "running" | "succeeded" | "skipped" | "failed";
  skipReason?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  backupKey?: string | null;
  checksum?: string | null;
  objectSize?: string | null;
  fingerprintBefore?: string | null;
  fingerprintAfter?: string | null;
  attempts: number;
  databaseRowsRead?: number | null;
  databaseBytesEstimated?: string | null;
  uncompressedBytes?: string | null;
  uploadedBytes?: string | null;
  peakRssBytes?: string | null;
  durationMs?: number | null;
  startedAt: string;
  finishedAt?: string | null;
  createdAt: string;
}

export interface BackupRunListQuery {
  module?: string;
  status?: string;
  trigger?: string;
  batchId?: string;
  selectorKey?: string;
  backupKey?: string;
  limit?: number;
  offset?: number;
}

export interface BackupRunListResponse {
  total: number;
  limit: number;
  offset: number;
  items: BackupRunDTO[];
}
