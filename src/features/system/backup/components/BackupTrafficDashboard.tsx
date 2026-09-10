import React from "react";
import {
  TrendingDown,
  Database,
  HardDrive,
  AlertTriangle,
  RotateCw,
  Info,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { useBackupMetrics } from "../hooks/useBackupMetrics";

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

export const BackupTrafficDashboard: React.FC = () => {
  const {
    summary,
    timeseries,
    loading,
    error,
    refresh,
    selectedPeriod,
    setSelectedPeriod,
  } = useBackupMetrics();

  return (
    <div className="space-y-6">
      {/* 顶部控制栏 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <TrendingDown className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-800 text-sm">
            月度流量看板与双维度同口径基线比对
          </h3>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-gray-500">统计周期:</span>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 当月未完成批次提示 */}
      {summary?.hasIncompleteBatches && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>注意：</strong>该月份存在未完成（incomplete）的备份批次，当月实际消耗指标可能尚未完全结算。
          </span>
        </div>
      )}

      {/* 双维度基线比对卡片 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 维度 1: 出口流量节省率 (基于 databaseBytesEstimated) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-800 text-sm">数据库出口流量比对</h4>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                Neon 出口消耗
              </span>
            </div>

            {summary.databaseExport.baselineAvailable ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3 text-xs">
                  <div>
                    <div className="text-gray-400 text-[11px] mb-0.5">全量基线出口</div>
                    <div className="font-bold text-gray-800">
                      {formatBytes(summary.databaseExport.baselineBytes)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[11px] mb-0.5">当月实际出口</div>
                    <div className="font-bold text-gray-800">
                      {formatBytes(summary.databaseExport.currentBytes)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[11px] mb-0.5">净节省出口</div>
                    <div className="font-bold text-green-600">
                      {formatBytes(summary.databaseExport.savedBytes)}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-green-50/60 border border-green-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-green-800 text-xs">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <span>通过模块轻量快照累计降低出口流量</span>
                  </div>
                  <span className="text-lg font-extrabold text-green-700">
                    {summary.databaseExport.percentSaved !== null
                      ? `${summary.databaseExport.percentSaved}%`
                      : "-"}
                  </span>
                </div>

                <div className="text-[11px] text-gray-400">
                  基线来源:{" "}
                  {summary.databaseExport.baselineSource === "monthly_manual_full"
                    ? "当月手动全量基线"
                    : "历史最新全量基线"}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 space-y-1.5">
                <div className="flex items-center space-x-1.5 font-semibold">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span>无可信全量出口流量基线</span>
                </div>
                <div className="text-amber-700/90 leading-relaxed text-[11px]">
                  历史全量备份未采集 UTF-8 真实出口字节（旧备份仅有上传大小），系统拒绝以 objectSize 冒充出口流量基线。建议在灾备窗口手动触发一次全量备份以建立可信基线。
                </div>
              </div>
            )}
          </div>

          {/* 维度 2: 存储上传净增比对 (基于 uploadedBytes) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-800 text-sm">R2 存储净增比对</h4>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                云端对象占用
              </span>
            </div>

            {summary.storageUpload.baselineAvailable ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3 text-xs">
                  <div>
                    <div className="text-gray-400 text-[11px] mb-0.5">全量基线存储</div>
                    <div className="font-bold text-gray-800">
                      {formatBytes(summary.storageUpload.baselineBytes)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[11px] mb-0.5">当月实际净增</div>
                    <div className="font-bold text-gray-800">
                      {formatBytes(summary.storageUpload.currentBytes)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[11px] mb-0.5">净节省存储</div>
                    <div className="font-bold text-purple-600">
                      {formatBytes(summary.storageUpload.savedBytes)}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-purple-800 text-xs">
                    <CheckCircle className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>相较全量灾备体积节省率</span>
                  </div>
                  <span className="text-lg font-extrabold text-purple-700">
                    {summary.storageUpload.percentSaved !== null
                      ? `${summary.storageUpload.percentSaved}%`
                      : "-"}
                  </span>
                </div>

                <div className="text-[11px] text-gray-400">
                  基线来源:{" "}
                  {summary.storageUpload.baselineSource === "monthly_manual_full"
                    ? "当月手动全量基线"
                    : "历史最新全量基线"}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500 space-y-1.5">
                <div className="flex items-center space-x-1.5 font-semibold text-gray-700">
                  <Info className="w-4 h-4 text-gray-400" />
                  <span>暂无全量存储基线</span>
                </div>
                <div className="text-[11px] text-gray-400">
                  历史未发现有效全量备份对象，暂无法计算存储节省率。
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 过去 6 个月历史月度趋势 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h4 className="font-semibold text-gray-800 text-sm">近 6 个月流量与执行走势</h4>
          </div>
          <span className="text-xs text-gray-400 font-medium">按自然月聚合审计</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="py-2.5 px-4 font-semibold">月份周期</th>
                <th className="py-2.5 px-4 font-semibold">估算数据库出口</th>
                <th className="py-2.5 px-4 font-semibold">未压缩全流体积</th>
                <th className="py-2.5 px-4 font-semibold">R2 实际上传净增</th>
                <th className="py-2.5 px-4 font-semibold text-right">执行任务数 (成功/失败)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timeseries.length > 0 ? (
                timeseries.map((pt) => (
                  <tr key={pt.periodKey} className="hover:bg-gray-50/40">
                    <td className="py-3 px-4 font-semibold text-gray-800 font-mono">
                      {pt.periodKey}
                    </td>
                    <td className="py-3 px-4 text-blue-700 font-medium font-mono">
                      {formatBytes(pt.databaseBytesEstimated)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono">
                      {formatBytes(pt.uncompressedBytes)}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-medium font-mono">
                      {formatBytes(pt.uploadedBytes)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      <span className="font-medium text-gray-900">{pt.totalRuns}</span> 笔
                      <span className="text-green-600 ml-1.5">({pt.succeededRuns} 成功</span>
                      {pt.failedRuns > 0 ? (
                        <span className="text-red-600 ml-1">/ {pt.failedRuns} 失败)</span>
                      ) : (
                        <span>)</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">
                    暂无历史月度数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
