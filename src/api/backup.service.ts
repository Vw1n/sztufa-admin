import { BackupDTO } from "./types";
import { BASE_URL, createHeaders, handleResponse } from "./http";

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
    const response = await fetch(`${BASE_URL}/backups/create`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(request),
    });
    return handleResponse<{ success: boolean; data: BackupDTO }>(response);
  },
  list: async (): Promise<{ success: boolean; data: BackupDTO[] }> => {
    const response = await fetch(`${BASE_URL}/backups/list`, {
      method: "GET",
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; data: BackupDTO[] }>(response);
  },
  getDownloadUrl: async (
    key: string,
  ): Promise<{ success: boolean; downloadUrl: string }> => {
    const response = await fetch(`${BASE_URL}/backups/download-url`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({ key }),
    });
    return handleResponse<{ success: boolean; downloadUrl: string }>(response);
  },
  restore: async (
    key: string,
    confirmText: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${BASE_URL}/backups/restore`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({ key, confirmText }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
  previewRestore: async (
    key: string,
  ): Promise<{ success: boolean; data: BackupRestorePreview }> => {
    const response = await fetch(`${BASE_URL}/backups/restore/preview`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({ key }),
    });
    return handleResponse<{ success: boolean; data: BackupRestorePreview }>(
      response,
    );
  },
  restoreModule: async (
    key: string,
    restoreToken: string,
    confirmText: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${BASE_URL}/backups/restore/module`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({ key, restoreToken, confirmText }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
  initUpload: async (
    filename: string,
    size: number,
    sha256: string,
  ): Promise<{ success: boolean; data: InitUploadResult }> => {
    const response = await fetch(`${BASE_URL}/backups/upload/init`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({ filename, size, sha256 }),
    });
    return handleResponse<{ success: boolean; data: InitUploadResult }>(
      response,
    );
  },
  completeUpload: async (
    uploadToken: string,
  ): Promise<{ success: boolean; data: BackupDTO }> => {
    const response = await fetch(`${BASE_URL}/backups/upload/complete`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({ uploadToken }),
    });
    return handleResponse<{ success: boolean; data: BackupDTO }>(response);
  },
  deleteBackup: async (
    key: string,
    confirmText: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${BASE_URL}/backups`, {
      method: "DELETE",
      headers: createHeaders(),
      body: JSON.stringify({ key, confirmText }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
  cleanRetention: async (
    dryRun: boolean = true,
    confirmText?: string,
  ): Promise<{ success: boolean; data: RetentionResult }> => {
    const response = await fetch(`${BASE_URL}/backups/retention/clean`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({ dryRun, confirmText }),
    });
    return handleResponse<{ success: boolean; data: RetentionResult }>(
      response,
    );
  },
  getArchiveCoverage: async (): Promise<{
    success: boolean;
    data: ArchiveCoverageSummary;
  }> => {
    const response = await fetch(`${BASE_URL}/backups/archive-coverage`, {
      method: "GET",
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; data: ArchiveCoverageSummary }>(
      response,
    );
  },
  previewArchiveBackfill: async (
    seasonIds?: string[],
  ): Promise<{ success: boolean; data: ArchiveBackfillPreviewResult }> => {
    const response = await fetch(
      `${BASE_URL}/backups/archive-backfill/preview`,
      {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ seasonIds }),
      },
    );
    return handleResponse<{
      success: boolean;
      data: ArchiveBackfillPreviewResult;
    }>(response);
  },
  executeArchiveBackfill: async (
    backfillToken: string,
    seasonIds?: string[],
  ): Promise<{ success: boolean; data: ArchiveBackfillExecuteResult }> => {
    const response = await fetch(
      `${BASE_URL}/backups/archive-backfill/execute`,
      {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ backfillToken, seasonIds }),
      },
    );
    return handleResponse<{
      success: boolean;
      data: ArchiveBackfillExecuteResult;
    }>(response);
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
    const response = await fetch(
      `${BASE_URL}/backups/archive-backfill/${seasonId}/retry`,
      {
        method: "POST",
        headers: createHeaders(),
      },
    );
    return handleResponse<{
      success: boolean;
      data: {
        seasonId: string;
        status: "succeeded" | "skipped" | "failed";
        reason?: string;
        backupKey?: string;
        error?: string;
      };
    }>(response);
  },
  getDashboard: async (): Promise<{
    success: boolean;
    data: BackupDashboardDTO;
  }> => {
    const response = await fetch(`${BASE_URL}/backups/dashboard`, {
      method: "GET",
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; data: BackupDashboardDTO }>(
      response,
    );
  },
  getMetricsSummary: async (
    periodKey?: string,
  ): Promise<{
    success: boolean;
    data: BackupMetricsSummaryDTO;
  }> => {
    const query = periodKey ? `?periodKey=${encodeURIComponent(periodKey)}` : "";
    const response = await fetch(`${BASE_URL}/backups/metrics/summary${query}`, {
      method: "GET",
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; data: BackupMetricsSummaryDTO }>(
      response,
    );
  },
  getMetricsTimeseries: async (
    months?: number,
  ): Promise<{
    success: boolean;
    data: BackupMetricsTimeseriesPoint[];
  }> => {
    const query = months ? `?months=${months}` : "";
    const response = await fetch(
      `${BASE_URL}/backups/metrics/timeseries${query}`,
      {
        method: "GET",
        headers: createHeaders(),
      },
    );
    return handleResponse<{
      success: boolean;
      data: BackupMetricsTimeseriesPoint[];
    }>(response);
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
    const response = await fetch(`${BASE_URL}/backups/runs${qs}`, {
      method: "GET",
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; data: BackupRunListResponse }>(
      response,
    );
  },
  retryRun: async (
    runId: string,
  ): Promise<{
    success: boolean;
    data: BackupRunDTO;
  }> => {
    const response = await fetch(`${BASE_URL}/backups/runs/${runId}/retry`, {
      method: "POST",
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; data: BackupRunDTO }>(response);
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
