import React, { useState } from 'react';
import { RefreshCw, Pencil, Trash2, Check, X } from 'lucide-react';

interface SeasonTableProps {
  seasons: any[];
  isUpdatingStatusId: string | null;
  isRenamingSeasonId: string | null;
  isDeletingSeasonId: string | null;
  onUpdateSeasonStatus: (id: string, currentStatus: string) => void;
  onRenameSeason: (id: string, currentName: string, newName: string) => Promise<void>;
  onDeleteSeason: (id: string, name: string) => void;
}

export const SeasonTable: React.FC<SeasonTableProps> = ({
  seasons,
  isUpdatingStatusId,
  isRenamingSeasonId,
  isDeletingSeasonId,
  onUpdateSeasonStatus,
  onRenameSeason,
  onDeleteSeason,
}) => {
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [editingSeasonName, setEditingSeasonName] = useState('');
  const [pendingDeleteSeasonId, setPendingDeleteSeasonId] = useState<string | null>(null);

  const startRenaming = (id: string, name: string) => {
    setEditingSeasonId(id);
    setEditingSeasonName(name);
  };

  const cancelRenaming = () => {
    setEditingSeasonId(null);
    setEditingSeasonName('');
  };

  const saveSeasonName = async (id: string, currentName: string) => {
    const newName = editingSeasonName.trim();
    if (!newName || newName === currentName) {
      cancelRenaming();
      return;
    }
    await onRenameSeason(id, currentName, newName);
    cancelRenaming();
  };

  return (
    <div className="form-section" style={{ marginBottom: '30px' }}>
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h2 className="form-title" style={{ margin: 0 }}>
          <span className="icon">📅</span>
          赛季状态管理
        </h2>
      </div>
      <div className="season-card">
        <div className="season-table-wrapper">
          <table className="season-table">
            <thead>
              <tr>
                <th>赛季名称</th>
                <th>类型</th>
                <th>状态</th>
                <th style={{ textAlign: 'center', width: '300px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '500', color: '#333' }}>
                    {editingSeasonId === s.id ? (
                      <input
                        type="text"
                        value={editingSeasonName}
                        onChange={(event) => setEditingSeasonName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') void saveSeasonName(s.id, s.name);
                          if (event.key === 'Escape') cancelRenaming();
                        }}
                        disabled={isRenamingSeasonId === s.id}
                        className="season-input-field"
                        style={{ minWidth: '180px' }}
                        autoFocus
                      />
                    ) : s.name}
                  </td>
                  <td style={{ color: '#666' }}>
                    {s.type === 'CUP' ? (
                      <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>🏆 杯赛</span>
                    ) : (
                      <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>⚽ 联赛</span>
                    )}
                  </td>
                  <td>
                    {s.status === 'active' ? (
                      <span style={{ background: '#e6fffa', color: '#00a389', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #b2f5ea' }}>活跃中</span>
                    ) : (
                      <span style={{ background: '#f7fafc', color: '#718096', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #e2e8f0' }}>已归档</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => onUpdateSeasonStatus(s.id, s.status)}
                        disabled={isUpdatingStatusId === s.id}
                        className="add-btn small"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 12px',
                          height: 'auto',
                          cursor: 'pointer',
                          background: s.status === 'active' ? '#fff0f0' : '#00a389',
                          color: s.status === 'active' ? '#d93838' : '#ffffff',
                          borderColor: s.status === 'active' ? '#ffd1d1' : '#00a389',
                          borderStyle: 'solid',
                          borderWidth: '1px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {isUpdatingStatusId === s.id ? (
                          <>
                            <RefreshCw size={12} className="spinning" />
                            处理中...
                          </>
                        ) : s.status === 'active' ? (
                          <>归档赛季</>
                        ) : (
                          <>重新激活</>
                        )}
                      </button>
                      {editingSeasonId === s.id ? (
                        <>
                          <button
                            onClick={() => void saveSeasonName(s.id, s.name)}
                            disabled={isRenamingSeasonId === s.id || !editingSeasonName.trim()}
                            className="add-btn small"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', height: 'auto', background: '#00a389', color: '#fff' }}
                          >
                            {isRenamingSeasonId === s.id ? <RefreshCw size={12} className="spinning" /> : <Check size={12} />}
                            保存
                          </button>
                          <button
                            onClick={cancelRenaming}
                            disabled={isRenamingSeasonId === s.id}
                            className="add-btn small"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', height: 'auto' }}
                          >
                            <X size={12} />
                            取消
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startRenaming(s.id, s.name)}
                          disabled={editingSeasonId !== null || isDeletingSeasonId === s.id}
                          className="add-btn small"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', height: 'auto' }}
                        >
                          <Pencil size={12} />
                          修改名称
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (pendingDeleteSeasonId === s.id) {
                            onDeleteSeason(s.id, s.name);
                            setPendingDeleteSeasonId(null);
                          } else {
                            setPendingDeleteSeasonId(s.id);
                          }
                        }}
                        disabled={isDeletingSeasonId === s.id || isRenamingSeasonId === s.id}
                        className="add-btn small"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', height: 'auto', background: '#d93838', color: '#fff', borderColor: '#d93838' }}
                      >
                        {isDeletingSeasonId === s.id ? <RefreshCw size={12} className="spinning" /> : <Trash2 size={12} />}
                        {pendingDeleteSeasonId === s.id ? '确认同意删除' : '删除赛季'}
                      </button>
                      {pendingDeleteSeasonId === s.id && (
                        <button
                          onClick={() => setPendingDeleteSeasonId(null)}
                          className="add-btn small"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', height: 'auto' }}
                        >
                          <X size={12} />
                          取消
                        </button>
                      )}
                    </div>
                    {pendingDeleteSeasonId === s.id && (
                      <div style={{ marginTop: '8px', color: '#d93838', fontSize: '12px' }}>
                        将同时删除该赛季的比赛、阵容、进球、事件、名单和分组；球队、球员及其他赛季不受影响。
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {seasons.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>暂无赛季数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
