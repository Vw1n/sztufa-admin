import React from "react";
import { X, ShieldCheck, Database, HardDrive, Cpu, FileText, Info } from "lucide-react";
import { BackupDTO } from "../../../../api/types";

interface BackupDetailDrawerProps {
  backup: BackupDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

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

export const BackupDetailDrawer: React.FC<BackupDetailDrawerProps> = ({
  backup,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !backup) return null;

  const metrics = backup.runMetrics;
  const hasMetrics = metrics !== null && metrics !== undefined;

  let compressionPercent: string | null = null;
  if (hasMetrics && metrics.uploadedBytes && metrics.uncompressedBytes) {
    const uploaded = Number(metrics.uploadedBytes);
    const uncompressed = Number(metrics.uncompressedBytes);
    if (uncompressed > 0 && uploaded > 0) {
      const ratio = ((1 - uploaded / uncompressed) * 100).toFixed(1);
      compressionPercent = `${ratio}%`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-all duration-300">
        {/* 顶部标题栏 */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800 text-base">备份详情与三段指标</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 基本元数据 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              基础元数据
            </h4>
            <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-2 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">文件名:</span>
                <span className="font-mono text-gray-700 font-medium truncate max-w-[200px]" title={backup.filename}>
                  {backup.filename}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">存储对象 Key:</span>
                <span className="font-mono text-gray-600 truncate max-w-[200px]" title={backup.key}>
                  {backup.key}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">备份范围:</span>
                <span className="font-medium text-gray-700">
                  {backup.scope === "full" ? "全量灾备" : `模块备份 (${backup.module || "-"})`}
                </span>
              </div>
              {backup.selector && Object.keys(backup.selector).length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">选择器参数:</span>
                  <span className="font-mono text-gray-600">
                    {JSON.stringify(backup.selector)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">格式版本:</span>
                <span className="text-gray-700">V{backup.formatVersion || "3.0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">用途:</span>
                <span className="text-gray-700">{backup.purpose || "manual"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">受保护状态:</span>
                <span>
                  {backup.protected ? (
                    <span className="inline-flex items-center text-green-600 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> 已锁定
                    </span>
                  ) : (
                    <span className="text-gray-400">常规清理</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">生成时间:</span>
                <span className="text-gray-700">{backup.lastModified || "-"}</span>
              </div>
            </div>
          </div>

          {/* 完整性校验 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              完整性校验
            </h4>
            <div className="bg-gray-50 rounded-lg p-3 text-xs border border-gray-100">
              <span className="text-gray-500 block mb-1">SHA-256 校验和:</span>
              <span className="font-mono text-gray-700 break-all select-all block bg-white p-2 rounded border border-gray-200">
                {backup.checksum || "未计算或校验未通过"}
              </span>
            </div>
          </div>

          {/* 三段流量指标审计 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              三段流量与性能审计
            </h4>

            {hasMetrics ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3">
                    <div className="flex items-center space-x-1.5 text-blue-700 mb-1">
                      <Database className="w-4 h-4" />
                      <span className="text-xs font-medium">数据库估算出口</span>
                    </div>
                    <div className="text-base font-bold text-blue-900">
                      {formatBytes(metrics.databaseBytesEstimated)}
                    </div>
                    <div className="text-[11px] text-blue-600/80 mt-0.5">
                      UTF-8 JSON 数据载荷
                    </div>
                  </div>

                  <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-3">
                    <div className="flex items-center space-x-1.5 text-purple-700 mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-medium">未压缩全流载荷</span>
                    </div>
                    <div className="text-base font-bold text-purple-900">
                      {formatBytes(metrics.uncompressedBytes)}
                    </div>
                    <div className="text-[11px] text-purple-600/80 mt-0.5">
                      GZIP 压缩前全流大小
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50/60 border border-green-100 rounded-lg p-3">
                    <div className="flex items-center space-x-1.5 text-green-700 mb-1">
                      <HardDrive className="w-4 h-4" />
                      <span className="text-xs font-medium">R2 实际上传大小</span>
                    </div>
                    <div className="text-base font-bold text-green-900">
                      {formatBytes(metrics.uploadedBytes)}
                    </div>
                    <div className="text-[11px] text-green-600/80 mt-0.5">
                      {compressionPercent ? `节省 ${compressionPercent} 存储空间` : "R2 压缩后体积"}
                    </div>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-3">
                    <div className="flex items-center space-x-1.5 text-amber-700 mb-1">
                      <Cpu className="w-4 h-4" />
                      <span className="text-xs font-medium">执行峰值内存</span>
                    </div>
                    <div className="text-base font-bold text-amber-900">
                      {formatBytes(metrics.peakRssBytes)}
                    </div>
                    <div className="text-[11px] text-amber-600/80 mt-0.5">
                      进程多点采样 RSS
                    </div>
                  </div>
                </div>

                {metrics.databaseRowsRead !== null && metrics.databaseRowsRead !== undefined && (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs flex justify-between items-center">
                    <span className="text-gray-500">累计读取数据行数:</span>
                    <span className="font-semibold text-gray-700">
                      {metrics.databaseRowsRead.toLocaleString()} 行
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold mb-0.5">历史备份未采集三段指标</div>
                  <div className="text-amber-700/90 leading-relaxed">
                    该备份生成于流量指标体系上线前，未持久化 UTF-8 数据出口与未压缩字节。系统已安全将指标标记为未采集，绝不以 0 字节伪装。
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部关闭按钮 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            关闭详情
          </button>
        </div>
      </div>
    </div>
  );
};
