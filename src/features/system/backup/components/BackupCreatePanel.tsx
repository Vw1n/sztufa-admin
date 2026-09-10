import React, { useState } from "react";
import { Database, ShieldCheck, AlertCircle, CheckCircle, RotateCw } from "lucide-react";
import { backupApi, BackupCreateRequest } from "../../../../api/backup.service";

interface BackupCreatePanelProps {
  onSuccess?: () => void;
  activeSeasonId?: string | null;
}

export const BackupCreatePanel: React.FC<BackupCreatePanelProps> = ({
  onSuccess,
  activeSeasonId,
}) => {
  const [scope, setScope] = useState<"module" | "full">("module");
  const [moduleType, setModuleType] = useState<"season" | "staff" | "members" | "content" | "operations">("season");
  const [seasonId, setSeasonId] = useState<string>(activeSeasonId || "");
  const [purpose, setPurpose] = useState<"manual" | "archive">("manual");
  const [isProtected, setIsProtected] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResultMessage(null);

    if (scope === "full") {
      const ok = window.confirm(
        "⚠️ 警告：全量备份将导出全库所有业务表，可能产生大量 Neon 流量消耗（免费版月出口上限 5GB）。\n\n是否确认继续？",
      );
      if (!ok) return;
    }

    if (scope === "module" && moduleType === "season" && !seasonId.trim()) {
      setErrorMessage("分赛季模块备份必须提供非空 seasonId");
      return;
    }

    let request: BackupCreateRequest;
    if (scope === "full") {
      request = { scope: "full", protected: isProtected };
    } else if (moduleType === "season") {
      request = {
        scope: "module",
        module: "season",
        selector: { seasonId: seasonId.trim() },
        purpose,
        protected: isProtected,
      };
    } else {
      request = {
        scope: "module",
        module: moduleType,
        selector: {},
        protected: isProtected,
      };
    }

    setLoading(true);
    try {
      const res = await backupApi.create(request);
      if (res.success) {
        setResultMessage(`备份创建成功: ${res.data.key}`);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage("备份创建失败");
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "请求执行异常",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
      <div className="flex items-center space-x-2">
        <Database className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800 text-sm">按需创建即时备份</h3>
      </div>

      {resultMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <span className="font-mono">{resultMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* 备份范围 */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">备份范围 (Scope)</label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                scope === "module"
                  ? "border-blue-500 bg-blue-50/50 text-blue-900"
                  : "border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <input
                type="radio"
                name="scope"
                checked={scope === "module"}
                onChange={() => setScope("module")}
                className="text-blue-600"
              />
              <div>
                <div className="font-semibold">模块轻量快照 (推荐)</div>
                <div className="text-[11px] text-gray-500">仅读取目标业务表，极低流量消耗</div>
              </div>
            </label>

            <label
              className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                scope === "full"
                  ? "border-blue-500 bg-blue-50/50 text-blue-900"
                  : "border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <input
                type="radio"
                name="scope"
                checked={scope === "full"}
                onChange={() => setScope("full")}
                className="text-blue-600"
              />
              <div>
                <div className="font-semibold">全站灾备基线</div>
                <div className="text-[11px] text-gray-500">导出全库所有表，仅用于灾备与采样</div>
              </div>
            </label>
          </div>
        </div>

        {/* 模块选择 */}
        {scope === "module" && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <label className="block font-medium text-gray-700 mb-1">选择目标模块</label>
              <select
                value={moduleType}
                onChange={(e) =>
                  setModuleType(
                    e.target.value as
                      | "season"
                      | "staff"
                      | "members"
                      | "content"
                      | "operations",
                  )
                }
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="season">赛季数据 (Season)</option>
                <option value="staff">工作人员与权限组织 (Staff)</option>
                <option value="members">普通会员账号 (Members)</option>
                <option value="content">新闻动态与图文 (Content)</option>
                <option value="operations">操作日志与导入批次 (Operations)</option>
              </select>
            </div>

            {moduleType === "season" && (
              <>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    赛季 ID (seasonId)
                  </label>
                  <input
                    type="text"
                    value={seasonId}
                    onChange={(e) => setSeasonId(e.target.value)}
                    placeholder="例如: cmroeexdz00018js1kmbmyog5"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    备份用途 (Purpose)
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) =>
                      setPurpose(e.target.value as "manual" | "archive")
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="manual">常规即时快照 (manual)</option>
                    <option value="archive">赛季归档封存快照 (archive)</option>
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {/* 高级选项 */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer text-gray-700">
            <input
              type="checkbox"
              checked={isProtected}
              onChange={(e) => setIsProtected(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="font-medium">永久锁定保护 (防止轮转保留策略自动清理)</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>正在导出并上传...</span>
              </>
            ) : (
              <span>开始执行备份</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
