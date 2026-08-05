import React from 'react';
import { MapPin } from 'lucide-react';
import { Match } from '../../../../types';
import { PlayerDTO } from '../../../../api/types';

interface MatchBasicFieldsProps {
  selectedMatch: Match;
  editData: Match | null;
  isEditing: boolean;
  homeTeamPlayers: PlayerDTO[];
  awayTeamPlayers: PlayerDTO[];
  onFieldChange: (field: keyof Match, value: string | number) => void;
  onSetEditData: (data: Match) => void;
}

const formatMatchTime = (time: string) => {
  try {
    const date = new Date(time);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return time;
  }
};

const formatForDateTimeLocal = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const cleaned = dateStr.replace(/\//g, '-');
    const date = new Date(cleaned);
    if (isNaN(date.getTime())) return '';
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours(),
    )}:${pad(date.getMinutes())}`;
  } catch {
    return '';
  }
};

export const MatchBasicFields: React.FC<MatchBasicFieldsProps> = ({
  selectedMatch,
  editData,
  isEditing,
  homeTeamPlayers,
  awayTeamPlayers,
  onFieldChange,
  onSetEditData,
}) => {
  return (
    <div className="form-row">
      <div className="form-group">
        <label>比赛名称</label>
        {isEditing ? (
          <select
            value={editData?.matchName || ''}
            onChange={(e) => onFieldChange('matchName', e.target.value)}
            className="form-select"
          >
            <option value="">请选择比赛名称</option>
            {[
              '小组赛第一轮',
              '小组赛第二轮',
              '小组赛第三轮',
              '小组赛第四轮',
              '小组赛第五轮',
              '八分之一决赛',
              '四分之一决赛',
              '半决赛',
              '季军赛',
              '决赛',
            ].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        ) : (
          <div className="form-value">{selectedMatch.matchName}</div>
        )}
      </div>
      <div className="form-group">
        <label>比赛时间</label>
        {isEditing ? (
          <input
            type="datetime-local"
            value={formatForDateTimeLocal(editData?.matchTime || '')}
            onChange={(e) => onFieldChange('matchTime', e.target.value)}
            className="form-input"
          />
        ) : (
          <div className="form-value">{formatMatchTime(selectedMatch.matchTime)}</div>
        )}
      </div>
      <div className="form-group">
        <label>比赛地点</label>
        {isEditing ? (
          <select
            value={editData?.location || ''}
            onChange={(e) => onFieldChange('location', e.target.value)}
            className="form-input"
          >
            <option value="">请选择比赛地点</option>
            <option value="五人场">五人场</option>
            <option value="北区">北区</option>
            <option value="南区">南区</option>
            {editData?.location && !['五人场', '北区', '南区'].includes(editData.location) && (
              <option value={editData.location}>{editData.location}</option>
            )}
          </select>
        ) : (
          <div className="form-value">
            <MapPin size={14} style={{ marginRight: '6px' }} />
            {selectedMatch.location || '-'}
          </div>
        )}
      </div>
      <div className="form-group">
        <label>全场最佳球员 (MVP)</label>
        {isEditing ? (
          <select
            value={editData?.mvpPlayerId || ''}
            onChange={(e) => {
              const allPlayers = [...homeTeamPlayers, ...awayTeamPlayers];
              const selected = allPlayers.find((p) => p.id === e.target.value);
              if (editData) {
                onSetEditData({
                  ...editData,
                  mvpPlayerId: selected?.id || '',
                  mvpPlayerName: selected?.name || '',
                });
              }
            }}
            className="form-select"
          >
            <option value="">请选择本场 MVP (选填)</option>
            <optgroup label={editData?.homeTeamName || '主队'}>
              {homeTeamPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.jerseyNumber}号)
                </option>
              ))}
            </optgroup>
            <optgroup label={editData?.awayTeamName || '客队'}>
              {awayTeamPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.jerseyNumber}号)
                </option>
              ))}
            </optgroup>
          </select>
        ) : (
          <div className="form-value" style={{ fontWeight: 'bold', color: '#f57c00' }}>
            🏆 {selectedMatch.mvpPlayerName || '未评选'}
          </div>
        )}
      </div>
      <div className="form-group">
        <label>比赛状态</label>
        {isEditing ? (
          <select
            value={editData?.status || 'scheduled'}
            onChange={(e) => onFieldChange('status', e.target.value)}
            className="form-select"
          >
            <option value="scheduled">即将开始</option>
            <option value="ongoing">进行中</option>
            <option value="finished">已结束</option>
          </select>
        ) : (
          <div className="form-value">
            {selectedMatch.status === 'scheduled' && '即将开始'}
            {selectedMatch.status === 'ongoing' && '进行中'}
            {selectedMatch.status === 'finished' && '已结束'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchBasicFields;
