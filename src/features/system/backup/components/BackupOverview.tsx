import React from "react";
import {
  Database,
  Activity,
  Calendar,
  AlertTriangle,
  RotateCw,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
} from "lucide-react";
import { useBackupDashboard } from "../hooks/useBackupDashboard";

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

const MODULE_NAMES: Record<string, string> = {
  season: "赛季数据 (Season)",
  staff: "工作人员与组织架构 (Staff)",
  members: "普通会员账号 (Members)",
  content: "新闻资讯与动态 (Content)",
  operations: "操作审计与导入日志 (Operations)",
};

export const BackupOverview: React.FC = () => {
  const { dashboard, loading, error, refresh, retryingRunId, retryRun } =
    useBackupDashboard();

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500 space-x-2">
        <RotateCw className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm">正在加载备份系统概览与流量指标...</span>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={() => refresh()}
          className="px-3 py-1.5 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium text-xs"
        >
          重试
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  const {
    applicationBudget,
    neonOfficial,
    storageUploaded,
    moduleHealth,
    nextScheduledAt,
    currentMonthStats,
  } = dashboard;

  return (
    <div className="space-y-6">
      {/* 失败任务重试告警横幅 */}
      {currentMonthStats.hasFailedRuns && currentMonthStats.recentFailedRuns.length > 0 && (
        <div className="bg-red-50/90 border border-red-200 rounded-lg p-4 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-800 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>当月存在 {currentMonthStats.failedRuns} 笔失败任务，请及时处理以恢复健康基线</span>
            </div>
            <button
              onClick={() => refresh()}
              className="text-red-700 hover:text-red-900 underline text-xs font-medium"
            >
              刷新状态
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentMonthStats.recentFailedRuns.map((failed) => (
              <div
                key={failed.id}
                className="bg-white p-3 rounded border border-red-100 flex items-center justify-between space-x-2"
              >
                <div className="truncate flex-1">
                  <div className="font-semibold text-gray-800 truncate">
                    {MODULE_NAMES[failed.module] || failed.module}
                  </div>
                  <div className="text-gray-500 text-[11px] truncate">
                    原因: {failed.failureMessage || failed.failureCode || "执行异常"}
                  </div>
                  <div className="text-gray-400 text-[10px]">
                    时间: {formatDate(failed.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => retryRun(failed.id)}
                  disabled={retryingRunId === failed.id}
                  className="px-3 py-1.5 bg-red-600 text-white rounded font-medium text-xs hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-1 shrink-0"
                >
                  {retryingRunId === failed.id ? (
                    <>
                      <RotateCw className="w-3 h-3 animate-spin" />
                      <span>重试中...</span>
                    </>
                  ) : (
                    <span>立即重试</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 双轨流量监控卡片矩阵 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 轨1：应用出口预算 (硬限 2GB) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800 text-sm">应用出口预算 (月度)</h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                applicationBudget.alertLevel === "critical"
                  ? "bg-red-100 text-red-700"
                  : applicationBudget.alertLevel === "warning"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {applicationBudget.alertLevel === "critical"
                ? "超限告警"
                : applicationBudget.alertLevel === "warning"
                ? "用量预警"
                : "预算正常"}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-2xl font-bold text-gray-900">
                {formatBytes(applicationBudget.usedBytes)}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                限额 {formatBytes(applicationBudget.limitBytes)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  applicationBudget.alertLevel === "critical"
                    ? "bg-red-500"
                    : applicationBudget.alertLevel === "warning"
                    ? "bg-yellow-500"
                    : "bg-blue-600"
                }`}
                style={{ width: `${Math.min(100, applicationBudget.percent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>已消耗 {applicationBudget.percent}%</span>
              <span>预警线 70% (1.4GB)</span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 leading-relaxed">
            累加当月所有成功、重试及失败任务消耗的数据库读取流量。
          </div>
        </div>

        {/* 轨2：Neon 官方用量配额 (5GB) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-800 text-sm">Neon 官方配额监控</h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                neonOfficial.status === "configured"
                  ? neonOfficial.alertLevel === "critical"
                    ? "bg-red-100 text-red-700"
                    : neonOfficial.alertLevel === "warning"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                  : neonOfficial.status === "not_configured"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {neonOfficial.status === "configured"
                ? neonOfficial.alertLevel === "critical"
                  ? "配额紧张"
                  : neonOfficial.alertLevel === "warning"
                  ? "黄色预警"
                  : "配额健康"
                : neonOfficial.status === "not_configured"
                ? "未配置官方凭证"
                : "查询不可用"}
            </span>
          </div>

          {neonOfficial.status === "configured" ? (
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-bold text-gray-900">
                  {formatBytes(neonOfficial.dataTransferBytes)}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  配额 {formatBytes(neonOfficial.limitBytes)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    neonOfficial.alertLevel === "critical"
                      ? "bg-red-500"
                      : neonOfficial.alertLevel === "warning"
                      ? "bg-yellow-500"
                      : "bg-indigo-600"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (Number(neonOfficial.dataTransferBytes || 0) /
                          Number(neonOfficial.limitBytes || 1)) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>周期: {neonOfficial.billingPeriod || "当前计费月"}</span>
                <span>采集: {formatDate(neonOfficial.capturedAt)}</span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <div className="font-medium text-gray-700">
                {neonOfficial.status === "not_configured"
                  ? "未配置 NEON_API_KEY / NEON_PROJECT_ID"
                  : "Neon 官方用量查询暂时不可用"}
              </div>
              <div className="text-[11px] text-gray-400">
                官方配额指标未激活，系统已安全回退。业务备份不受影响。
              </div>
            </div>
          )}

          <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 leading-relaxed">
            免费层全局出站流量上限 5GB，含网页访问与备份共同消耗。
          </div>
        </div>

        {/* 轨3：当月成功存储上传量 & 下次定时任务 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-800 text-sm">R2 存储净增</h3>
            </div>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-semibold">
              永久留存
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatBytes(storageUploaded.usedBytes)}
            </div>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>当月成功完成 {currentMonthStats.succeededRuns} 笔模块快照</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 text-xs text-gray-600 space-y-1">
            <div className="flex items-center space-x-1.5 text-gray-700 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>下次自动轻量备份:</span>
            </div>
            <div className="font-mono text-gray-500 pl-5">
              {formatDate(nextScheduledAt)}
            </div>
          </div>
        </div>
      </div>

      {/* 5 大模块健康矩阵 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-800 text-sm">
              模块备份健康度与基线检查点矩阵
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            5/5 核心业务模块独立生命周期
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {moduleHealth.map((item) => (
            <div
              key={item.module}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-800 text-sm">
                    {MODULE_NAMES[item.module] || item.module}
                  </span>
                  {item.lastRunStatus === "succeeded" ? (
                    <span className="inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                      运行正常
                    </span>
                  ) : item.lastRunStatus === "failed" ? (
                    <span className="inline-flex items-center text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded font-medium">
                      <XCircle className="w-3 h-3 mr-1 text-red-600" />
                      最近执行失败
                    </span>
                  ) : item.lastRunStatus === "skipped" ? (
                    <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium">
                      <Clock className="w-3 h-3 mr-1 text-gray-500" />
                      数据未变跳过
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                      <HelpCircle className="w-3 h-3 mr-1" />
                      暂无运行
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                  <span>最近任务: {formatDate(item.lastRunAt)}</span>
                  <span>最近成功快照: {formatDate(item.lastSuccessfulAt)}</span>
                </div>
              </div>

              <div className="text-xs text-right space-y-1 shrink-0">
                <div className="text-gray-400">最新基线指纹 (SHA-256):</div>
                <div className="font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded max-w-[200px] truncate text-[11px]">
                  {item.fingerprint || "未建立基线 Checkpoint"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
