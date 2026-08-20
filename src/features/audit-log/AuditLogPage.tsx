import React from 'react';
import { ShieldAlert, RefreshCw, Activity } from 'lucide-react';
import { useAuditLogs } from './hooks/useAuditLogs';
import { AuditLogFilters } from './components/AuditLogFilters';
import { AuditLogTable } from './components/AuditLogTable';

const AuditLogPage: React.FC = () => {
  const {
    logs,
    total,
    page,
    setPage,
    totalPages,
    isLoading,
    error,
    filterUsername,
    setFilterUsername,
    filterAction,
    setFilterAction,
    loadLogs,
  } = useAuditLogs();

  return (
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <ShieldAlert className="trophy-icon" />
            系统操作审计日志
          </h1>
          <p>记录管理员在后台录入比分、添加球队及管理数据的完整轨迹，确保数据透明安全</p>
        </div>
      </header>

      <main className="page-content">
        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}

        <div className="form-section">
          <div className="section-header" style={{ marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="form-title" style={{ margin: 0 }}>
              <span className="icon">📝</span>
              系统操作日志表 ({total}条记录)
            </h2>
            <button onClick={() => loadLogs()} className="add-btn refresh-btn" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto', margin: 0 }}>
              <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
              刷新日志
            </button>
          </div>

          <AuditLogFilters
            filterUsername={filterUsername}
            filterAction={filterAction}
            onUsernameChange={(val) => { setFilterUsername(val); setPage(1); }}
            onActionChange={(val) => { setFilterAction(val); setPage(1); }}
          />

          {isLoading ? (
            <div className="loading-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>加载中...</div>
          ) : logs.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>
              <Activity size={48} style={{ marginBottom: '10px', color: '#ccc' }} />
              <p>暂无符合筛选条件的日志记录</p>
            </div>
          ) : (
            <AuditLogTable
              logs={logs}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </main>

      <style>{`
        .desktop-audit-view {
          display: block;
        }
        .mobile-audit-view {
          display: none;
        }
        .audit-logs-table td {
          vertical-align: top;
          padding: 12px 14px;
        }
        .audit-logs-table .badge {
          white-space: nowrap !important;
          display: inline-block;
        }
        @media (max-width: 700px) {
          .desktop-audit-view {
            display: none;
          }
          .mobile-audit-view {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .mobile-audit-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          }
          .mobile-audit-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
          }
          .mobile-audit-user-tag {
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: 600;
            font-size: 13px;
            color: #2d3748;
          }
          .mobile-audit-time {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #718096;
            margin-bottom: 8px;
          }
          .mobile-audit-body {
            font-size: 13px;
            color: #2d3748;
            background: #f7fafc;
            padding: 8px 10px;
            border-radius: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditLogPage;
