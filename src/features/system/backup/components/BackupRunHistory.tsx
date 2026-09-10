import React from "react";
import {
  List,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { useBackupRunHistory } from "../hooks/useBackupRunHistory";

const formatBytes = (bytesStr?: string | number | null): string => {
  if (bytesStr === null || bytesStr === undefined) return "-";
  const bytes = Number(bytesStr);
  if (isNaN(bytes)) return "-";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const BackupRunHistory: React.FC = () => {
  const {
    runs,
    total,
    page,
    setPage,
    limit,
    setLimit,
    loading,
    error,
    refresh,
    filterModule,
    setFilterModule,
    filterStatus,
    setFilterStatus,
    filterTrigger,
    setFilterTrigger,
    retryingRunId,
    retryRun,
  } = useBackupRunHistory(20);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden space-y-4">
      {/* 顶部控制与筛选栏 */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <List className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800 text-sm">备份任务运行账本</h3>
          <span className="text-xs text-gray-400 font-medium">({total} 条记录)</span>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filterModule}
            onChange={(e) => {
              setFilterModule(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700"
          >
            <option value="">全部模块</option>
            <option value="season">season (赛季)</option>
            <option value="staff">staff (工作人员)</option>
            <option value="members">members (会员)</option>
            <option value="content">content (内容)</option>
            <option value="operations">operations (日志)</option>
            <option value="full">full (全量)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700"
          >
            <option value="">全部状态</option>
            <option value="succeeded">succeeded (成功)</option>
            <option value="failed">failed (失败)</option>
            <option value="skipped">skipped (跳过)</option>
            <option value="running">running (执行中)</option>
          </select>

          <select
            value={filterTrigger}
            onChange={(e) => {
              setFilterTrigger(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700"
          >
            <option value="">全部触发源</option>
            <option value="manual">manual (人工)</option>
            <option value="cron">cron (定时)</option>
            <option value="archive">archive (归档)</option>
            <option value="retry">retry (重试)</option>
            <option value="backfill">backfill (补建)</option>
            <option value="pre-restore">pre-restore (恢复前)</option>
          </select>

          <button
            onClick={() => refresh()}
            disabled={loading}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
            title="刷新数据"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 列表表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="py-2.5 px-4 font-semibold">开始时间</th>
              <th className="py-2.5 px-4 font-semibold">模块 / 选择器</th>
              <th className="py-2.5 px-4 font-semibold">触发源 / 用途</th>
              <th className="py-2.5 px-4 font-semibold">状态</th>
              <th className="py-2.5 px-4 font-semibold">读取出口 / 行数</th>
              <th className="py-2.5 px-4 font-semibold">实际上传</th>
              <th className="py-2.5 px-4 font-semibold">尝试次数</th>
              <th className="py-2.5 px-4 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {runs.length > 0 ? (
              runs.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                    <div>{formatDate(run.startedAt)}</div>
                    <div className="font-mono text-[10px] text-gray-400">
                      {run.durationMs ? `${run.durationMs}ms` : "-"}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-800">{run.module}</div>
                    <div className="font-mono text-[11px] text-gray-500 truncate max-w-[150px]">
                      {run.selectorKey}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 mb-0.5">
                      {run.trigger}
                    </span>
                    <div className="text-[11px] text-gray-500">{run.purpose}</div>
                  </td>

                  <td className="py-3 px-4">
                    {run.status === "succeeded" ? (
                      <span className="inline-flex items-center text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium text-[11px]">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                        成功
                      </span>
                    ) : run.status === "failed" ? (
                      <div>
                        <span className="inline-flex items-center text-red-700 bg-red-50 px-2 py-0.5 rounded font-medium text-[11px]">
                          <XCircle className="w-3 h-3 mr-1 text-red-600" />
                          失败
                        </span>
                        {run.failureMessage && (
                          <div className="text-[10px] text-red-500 truncate max-w-[160px] mt-0.5" title={run.failureMessage}>
                            {run.failureMessage}
                          </div>
                        )}
                      </div>
                    ) : run.status === "skipped" ? (
                      <span className="inline-flex items-center text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium text-[11px]">
                        <Clock className="w-3 h-3 mr-1 text-gray-400" />
                        跳过 ({run.skipReason || "unchanged"})
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium text-[11px]">
                        <RotateCw className="w-3 h-3 mr-1 animate-spin text-blue-600" />
                        执行中
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-mono text-blue-700 font-medium">
                      {formatBytes(run.databaseBytesEstimated)}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {run.databaseRowsRead !== null && run.databaseRowsRead !== undefined
                        ? `${run.databaseRowsRead} 行`
                        : "-"}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-emerald-700 font-medium">
                    {formatBytes(run.uploadedBytes)}
                  </td>

                  <td className="py-3 px-4 text-gray-600 text-center">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-[11px]">
                      第 {run.attempts} 次
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    {run.status === "failed" && run.scope === "module" && (
                      <button
                        onClick={() => retryRun(run.id)}
                        disabled={retryingRunId === run.id}
                        className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition-colors inline-flex items-center space-x-1"
                      >
                        {retryingRunId === run.id ? (
                          <>
                            <RotateCw className="w-3 h-3 animate-spin" />
                            <span>重试中</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            <span>重试</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                  暂无匹配的运行记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页控制器 */}
      <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          <span>第 {page} / {totalPages} 页 (共 {total} 条)</span>
          <div className="flex items-center space-x-1">
            <span>每页</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-700 text-xs focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>条</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            上一页
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};
