import { useState, useEffect } from 'react';
import { auditLogApi } from '../../../api/service';
import { AuditLogDTO } from '../../../api/types';

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterUsername, setFilterUsername] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    loadLogs();
  }, [page, filterUsername, filterAction]);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await auditLogApi.getAll(page, limit, filterUsername, filterAction);
      setLogs(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error('加载审计日志失败:', err);
      setError(err instanceof Error ? err.message : '无法连接服务器，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    logs,
    total,
    page,
    setPage,
    limit,
    totalPages,
    isLoading,
    error,
    filterUsername,
    setFilterUsername,
    filterAction,
    setFilterAction,
    loadLogs,
  };
}
