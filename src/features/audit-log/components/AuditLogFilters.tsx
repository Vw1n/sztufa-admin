import React from 'react';

interface AuditLogFiltersProps {
  filterUsername: string;
  filterAction: string;
  onUsernameChange: (val: string) => void;
  onActionChange: (val: string) => void;
}

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  filterUsername,
  filterAction,
  onUsernameChange,
  onActionChange,
}) => {
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', background: '#f8f9fa', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: 600 }}>操作人:</span>
        <input
          type="text"
          placeholder="输入用户名搜索..."
          value={filterUsername}
          onChange={(e) => onUsernameChange(e.target.value)}
          className="form-input inline"
          style={{ width: '150px', padding: '5px 10px', height: '32px', margin: 0, fontSize: '13px' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: 600 }}>操作类型:</span>
        <select
          value={filterAction}
          onChange={(e) => onActionChange(e.target.value)}
          className="form-select inline"
          style={{ width: '185px', padding: '5px 10px', height: '32px', margin: 0, fontSize: '13px' }}
        >
          <option value="all">🔍 全部操作类型</option>
          <option value="MATCH_ACTIONS">⚽ 比赛管理 (比分/录入)</option>
          <option value="PLAYER_ACTIONS">🏃‍♂️ 球员管理</option>
          <option value="TEAM_ACTIONS">👚 球队管理</option>
          <option value="USER_ACTIONS">👥 用户权限与账号</option>
          <option value="BACKUP_ACTIONS">💾 备份还原</option>
        </select>
      </div>
    </div>
  );
};
