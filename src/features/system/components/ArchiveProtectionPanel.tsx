import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  FileCheck2,
  HardDrive,
} from 'lucide-react';
import {
  backupApi,
  ArchiveCoverageSummary,
  ArchiveBackfillPreviewResult,
  ArchiveBackfillExecuteResult,
} from '../../../api/backup.service';

interface ArchiveProtectionPanelProps {
  onBackfillSuccess?: () => void;
}

export const ArchiveProtectionPanel: React.FC<ArchiveProtectionPanelProps> = ({
  onBackfillSuccess,
}) => {
  const [coverage, setCoverage] = useState<ArchiveCoverageSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected seasons for backfill
  const [selectedSeasonIds, setSelectedSeasonIds] = useState<string[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<ArchiveBackfillPreviewResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executeResult, setExecuteResult] = useState<ArchiveBackfillExecuteResult | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchCoverage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await backupApi.getArchiveCoverage();
      if (res.success && res.data) {
        setCoverage(res.data);
      }
    } catch (err: any) {
      setError(err.message || '获取归档保护覆盖状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoverage();
  }, [fetchCoverage]);

  const handleSelectAllUnprotected = () => {
    if (!coverage) return;
    const unprotected = coverage.seasons.filter((s) => !s.hasProtectedBackup).map((s) => s.id);
    if (unprotected.length > 10) {
      setSelectedSeasonIds(unprotected.slice(0, 10));
    } else {
      setSelectedSeasonIds(unprotected);
    }
  };

  const handleToggleSeason = (id: string) => {
    setSelectedSeasonIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 10) {
        alert('单次补建赛季数量不能超过 10 个，请分批次执行');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleOpenPreview = async () => {
    if (!coverage) return;
    setError(null);
    setPreviewing(true);
    try {
      const targetIds = selectedSeasonIds.length > 0 ? selectedSeasonIds : undefined;
      const res = await backupApi.previewArchiveBackfill(targetIds);
      if (res.success && res.data) {
        setPreviewData(res.data);
      }
    } catch (err: any) {
      setError(err.message || '获取补建预检信息失败');
    } finally {
      setPreviewing(false);
    }
  };

  const handleExecuteBackfill = async () => {
    if (!previewData) return;
    setError(null);
    setExecuting(true);
    try {
      const targetIds = previewData.missingSeasons.map((s) => s.id);
      const res = await backupApi.executeArchiveBackfill(previewData.backfillToken, targetIds);
      if (res.success && res.data) {
        setExecuteResult(res.data);
        setPreviewData(null);
        setSelectedSeasonIds([]);
        setSuccessMsg(
          `补建执行完成：成功 ${res.data.succeeded} 个，跳过 ${res.data.skipped} 个，失败 ${res.data.failed} 个`,
        );
        fetchCoverage();
        onBackfillSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || '执行补建备份失败');
    } finally {
      setExecuting(false);
    }
  };

  const handleRetrySingle = async (seasonId: string) => {
    setRetryingId(seasonId);
    setError(null);
    try {
      const res = await backupApi.retryArchiveSeasonBackfill(seasonId);
      if (res.success) {
        setSuccessMsg('已发起单赛季归档备份重试');
        fetchCoverage();
        onBackfillSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || '单赛季归档重试失败');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="form-section" style={{ marginTop: '24px' }}>
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2 className="form-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck className="icon" size={20} style={{ color: '#2563eb' }} />
            历史已归档赛季受保护备份管理
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
            扫描并保护所有已归档赛季数据，保障独立备份与免被清理，严格遵循 Neon 低出口流量原则。
          </p>
        </div>
        <button
          onClick={fetchCoverage}
          disabled={loading}
          className="add-btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          刷新覆盖率
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* 概览统计卡片 */}
      {coverage && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>已归档赛季总数</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginTop: '4px' }}>
              {coverage.total}
            </div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ fontSize: '12px', color: '#166534' }}>已受保护赛季</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803d', marginTop: '4px' }}>
              {coverage.protected}
            </div>
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ fontSize: '12px', color: '#854d0e' }}>待补建保护备份</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#b45309', marginTop: '4px' }}>
              {coverage.missing}
            </div>
          </div>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ fontSize: '12px', color: '#991b1b' }}>损坏/校验失败</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>
              {coverage.corrupt}
            </div>
          </div>
        </div>
      )}

      {/* 操作栏 */}
      {coverage && coverage.total > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
            <button
              onClick={handleSelectAllUnprotected}
              disabled={coverage.missing + coverage.corrupt === 0}
              className="add-btn btn-secondary"
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              勾选未保护赛季 (最多10个)
            </button>
            {selectedSeasonIds.length > 0 && (
              <span style={{ color: '#2563eb' }}>
                已选中 <strong>{selectedSeasonIds.length}</strong> / 10 个赛季
              </span>
            )}
          </div>
          <div>
            <button
              onClick={handleOpenPreview}
              disabled={previewing || (coverage.missing === 0 && coverage.corrupt === 0 && selectedSeasonIds.length === 0)}
              className="save-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '6px 14px',
                backgroundColor: '#2563eb',
              }}
            >
              <Play size={14} className={previewing ? 'spinning' : ''} />
              {previewing ? '正在生成预检凭据...' : '批量补建预检 (Preview)'}
            </button>
          </div>
        </div>
      )}

      {/* 赛季清单表格 */}
      {coverage && (
        <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '6px' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '8px 12px', width: '40px' }}>选择</th>
                <th style={{ padding: '8px 12px' }}>赛季名称</th>
                <th style={{ padding: '8px 12px' }}>归档时间</th>
                <th style={{ padding: '8px 12px' }}>保护状态</th>
                <th style={{ padding: '8px 12px' }}>备份信息 / 状态说明</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {coverage.seasons.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                    暂无已归档历史赛季
                  </td>
                </tr>
              ) : (
                coverage.seasons.map((season) => (
                  <tr key={season.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedSeasonIds.includes(season.id)}
                        onChange={() => handleToggleSeason(season.id)}
                        disabled={season.hasProtectedBackup}
                      />
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: '500' }}>{season.name}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>
                      {season.archivedAt ? new Date(season.archivedAt).toLocaleDateString('zh-CN') : '历史数据(未记录)'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {season.hasProtectedBackup ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#15803d',
                            backgroundColor: '#f0fdf4',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          <ShieldCheck size={14} />
                          已受保护
                        </span>
                      ) : season.isCorrupt ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#b91c1c',
                            backgroundColor: '#fef2f2',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          <ShieldAlert size={14} />
                          损坏/校验失败
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#b45309',
                            backgroundColor: '#fffbeb',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          <AlertTriangle size={14} />
                          缺失备份
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#4b5563', fontSize: '12px' }}>
                      {season.hasProtectedBackup ? (
                        <div>
                          <div>
                            对象: <code>{season.backupKey?.split('/').pop()}</code>
                          </div>
                          {season.objectSize !== null && season.objectSize !== undefined && (
                            <div style={{ color: '#6b7280' }}>
                              大小: {(Number(season.objectSize) / 1024).toFixed(1)} KB · 校验:{' '}
                              {season.verifiedAt ? new Date(season.verifiedAt).toLocaleDateString('zh-CN') : '-'}
                            </div>
                          )}
                        </div>
                      ) : season.isCorrupt ? (
                        <span style={{ color: '#dc2626' }}>{season.lastError || '对象损坏或校验和不匹配'}</span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>尚未生成受保护归档备份</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      {!season.hasProtectedBackup && (
                        <button
                          onClick={() => handleRetrySingle(season.id)}
                          disabled={retryingId === season.id}
                          className="add-btn btn-secondary"
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          {retryingId === season.id ? '正在重试...' : '立即补建'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview 确认对话框 */}
      {previewData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '560px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck2 size={20} color="#2563eb" />
              批量归档补建执行预检 (Preview)
            </h3>

            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1e40af',
                marginBottom: '16px',
                lineHeight: '1.4',
              }}
            >
              {previewData.notice}
            </div>

            <div style={{ marginBottom: '12px', fontSize: '13px' }}>
              <strong>本次拟补建赛季 ({previewData.missingSeasons.length} 个，最大硬限 10 个)：</strong>
              <div
                style={{
                  maxHeight: '120px',
                  overflowY: 'auto',
                  background: '#f9fafb',
                  padding: '8px',
                  borderRadius: '4px',
                  marginTop: '6px',
                }}
              >
                {previewData.missingSeasons.map((s) => (
                  <div key={s.id} style={{ padding: '3px 0' }}>
                    • {s.name} ({s.archivedAt ? new Date(s.archivedAt).toLocaleDateString('zh-CN') : '未记录归档时间'})
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '13px' }}>
              <strong>受影响数据表 ({previewData.affectedTables.length} 张业务及快照表)：</strong>
              <div
                style={{
                  background: '#f9fafb',
                  padding: '8px',
                  borderRadius: '4px',
                  marginTop: '6px',
                  fontSize: '12px',
                  color: '#4b5563',
                }}
              >
                {previewData.affectedTables.join(', ')}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setPreviewData(null)}
                disabled={executing}
                className="add-btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                取消
              </button>
              <button
                onClick={handleExecuteBackfill}
                disabled={executing}
                className="save-btn"
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  backgroundColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {executing ? (
                  <>
                    <RefreshCw size={14} className="spinning" />
                    正在执行补建...
                  </>
                ) : (
                  '确认执行补建 (Execute)'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
