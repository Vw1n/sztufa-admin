import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

interface SeasonManagementPanelProps {
  newSeasonName: string;
  newSeasonType: string;
  isArchivingSeason: boolean;
  onNewSeasonNameChange: (val: string) => void;
  onNewSeasonTypeChange: (val: string) => void;
  onCreateSeason: (e: React.FormEvent) => void;
}

export const SeasonManagementPanel: React.FC<SeasonManagementPanelProps> = ({
  newSeasonName,
  newSeasonType,
  isArchivingSeason,
  onNewSeasonNameChange,
  onNewSeasonTypeChange,
  onCreateSeason,
}) => {
  return (
    <div className="form-section" style={{ marginBottom: '30px' }}>
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h2 className="form-title" style={{ margin: 0 }}>
          <span className="icon">⚡</span>
          创建新赛季
        </h2>
      </div>
      <div className="season-card">
        <form onSubmit={onCreateSeason} className="season-form">
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#495057', marginBottom: '8px' }}>
              新赛季名称：
            </label>
            <input
              type="text"
              placeholder="例如：2026秋季杯赛"
              value={newSeasonName}
              onChange={(e) => onNewSeasonNameChange(e.target.value)}
              disabled={isArchivingSeason}
              className="season-input-field"
            />
          </div>
          <div style={{ width: '220px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#495057', marginBottom: '8px' }}>
              赛制类型：
            </label>
            <select
              value={newSeasonType}
              onChange={(e) => onNewSeasonTypeChange(e.target.value)}
              disabled={isArchivingSeason}
              className="season-input-field"
            >
              <option value="LEAGUE">单循环联赛 (League)</option>
              <option value="CUP">杯赛 (Cup - 小组+淘汰赛)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isArchivingSeason || !newSeasonName.trim()}
            className="save-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', height: '40px', margin: 0 }}
          >
            {isArchivingSeason ? (
              <>
                <RefreshCw size={18} className="spinning" />
                正在创建中...
              </>
            ) : (
              <>
                <Plus size={18} />
                创建新赛季
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
