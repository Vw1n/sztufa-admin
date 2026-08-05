import React from 'react';
import { Match } from '../../../../types';

interface MatchStageGroupFieldsProps {
  selectedMatch: Match;
  editData: Match | null;
  isEditing: boolean;
  onFieldChange: (field: keyof Match, value: string | number) => void;
  onSetEditData: (data: Match) => void;
}

export const MatchStageGroupFields: React.FC<MatchStageGroupFieldsProps> = ({
  selectedMatch,
  editData,
  isEditing,
  onFieldChange,
  onSetEditData,
}) => {
  return (
    <div
      className="form-row"
      style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '15px' }}
    >
      <div className="form-group">
        <label>比赛阶段</label>
        {isEditing ? (
          <select
            value={editData?.stage || 'GROUP'}
            onChange={(e) => {
              const stage = e.target.value;
              if (editData) {
                onSetEditData({
                  ...editData,
                  stage,
                  groupName: stage === 'GROUP' ? 'A' : '',
                  knockoutRound: stage === 'KNOCKOUT' ? 'QF' : '',
                  knockoutMatchIndex: stage === 'KNOCKOUT' ? 1 : undefined,
                });
              }
            }}
            className="form-select"
          >
            <option value="GROUP">小组赛 (Group Stage)</option>
            <option value="KNOCKOUT">淘汰赛 (Knockout Stage)</option>
          </select>
        ) : (
          <div className="form-value">
            {selectedMatch.stage === 'GROUP'
              ? '小组赛'
              : selectedMatch.stage === 'KNOCKOUT'
              ? '淘汰赛'
              : '未设定'}
          </div>
        )}
      </div>

      {(isEditing ? editData?.stage : selectedMatch.stage) === 'GROUP' && (
        <div className="form-group">
          <label>小组</label>
          {isEditing ? (
            <select
              value={editData?.groupName || 'A'}
              onChange={(e) => onFieldChange('groupName', e.target.value)}
              className="form-select"
            >
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((g) => (
                <option key={g} value={g}>
                  {g} 组
                </option>
              ))}
            </select>
          ) : (
            <div className="form-value">{selectedMatch.groupName || '-'} 组</div>
          )}
        </div>
      )}

      {(isEditing ? editData?.stage : selectedMatch.stage) === 'KNOCKOUT' && (
        <>
          <div className="form-group">
            <label>淘汰赛轮次</label>
            {isEditing ? (
              <select
                value={editData?.knockoutRound || 'QF'}
                onChange={(e) => onFieldChange('knockoutRound', e.target.value)}
                className="form-select"
              >
                <option value="R16">1/8 决赛 (16强)</option>
                <option value="QF">1/4 决赛 (8强)</option>
                <option value="SF">半决赛 (4强)</option>
                <option value="F">决赛</option>
                <option value="3RD">三四名决赛</option>
                <option value="5TH">五六名排位赛</option>
                <option value="7TH">七八名排位赛</option>
              </select>
            ) : (
              <div className="form-value">
                {selectedMatch.knockoutRound === 'R16'
                  ? '1/8 决赛'
                  : selectedMatch.knockoutRound === 'QF'
                  ? '1/4 决赛'
                  : selectedMatch.knockoutRound === 'SF'
                  ? '半决赛'
                  : selectedMatch.knockoutRound === 'F'
                  ? '决赛'
                  : selectedMatch.knockoutRound === '3RD'
                  ? '三四名决赛'
                  : ['5TH', 'FIFTH_PLACE'].includes(selectedMatch.knockoutRound || '')
                  ? '五六名排位赛'
                  : ['7TH', 'SEVENTH_PLACE'].includes(selectedMatch.knockoutRound || '')
                  ? '七八名排位赛'
                  : '-'}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>对阵序号</label>
            {isEditing ? (
              <select
                value={editData?.knockoutMatchIndex || '1'}
                onChange={(e) => onFieldChange('knockoutMatchIndex', parseInt(e.target.value, 10))}
                className="form-select"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    对阵 #{n}
                  </option>
                ))}
              </select>
            ) : (
              <div className="form-value">对阵 #{selectedMatch.knockoutMatchIndex || '-'}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MatchStageGroupFields;
