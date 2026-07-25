import React from 'react';
import { Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuditLogDTO } from '../../../api/types';
import { formatDate, getActionTagClass, getActionLabel } from '../utils/auditLogFormatter';
import { AuditLogDetails } from './AuditLogDetails';

interface AuditLogTableProps {
  logs: AuditLogDTO[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  page,
  totalPages,
  onPageChange,
}) => {
  return (
    <>
      {/* 桌面端表格 */}
      <div className="player-table-wrapper desktop-audit-view">
        <table className="player-table audit-logs-table">
          <thead>
            <tr>
              <th style={{ width: '160px', whiteSpace: 'nowrap' }}>操作时间</th>
              <th style={{ width: '110px', whiteSpace: 'nowrap' }}>操作人员</th>
              <th style={{ width: '110px', whiteSpace: 'nowrap' }}>操作类型</th>
              <th>具体行为描述</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ color: '#666', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={12} />
                    {formatDate(log.createdAt)}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                    <User size={12} />
                    {log.username}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span className={`badge ${getActionTagClass(log.action)}`} style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
                    {getActionLabel(log.action)}
                  </span>
                </td>
                <td style={{ fontSize: '14px', lineHeight: '1.4', color: '#333' }}>
                  <AuditLogDetails log={log} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 移动端卡片列表 */}
      <div className="mobile-audit-view">
        {logs.map((log) => (
          <div key={log.id} className="mobile-audit-card">
            <div className="mobile-audit-card-header">
              <div className="mobile-audit-user-tag">
                <User size={12} />
                <span>{log.username}</span>
              </div>
              <span className={`badge ${getActionTagClass(log.action)}`} style={{ whiteSpace: 'nowrap' }}>
                {getActionLabel(log.action)}
              </span>
            </div>
            <div className="mobile-audit-time">
              <Calendar size={12} />
              <span>{formatDate(log.createdAt)}</span>
            </div>
            <div className="mobile-audit-body">
              <AuditLogDetails log={log} />
            </div>
          </div>
        ))}
      </div>

      {/* 分页控制 */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>
          第 {page} 页 / 共 {totalPages} 页
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="add-btn small btn-secondary"
            style={{ padding: '6px 12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            <ChevronLeft size={14} />
            上一页
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="add-btn small btn-secondary"
            style={{ padding: '6px 12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            下一页
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
};
