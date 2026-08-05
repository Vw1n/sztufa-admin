import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Match } from '../../../../types';

interface MatchHeaderActionsProps {
  selectedMatch: Match;
  isEditing: boolean;
  isSaved: boolean;
  isLoading: boolean;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRecalculatePredictions?: (matchId: string) => void;
  onVoidPredictions?: (matchId: string) => void;
}

export const MatchHeaderActions: React.FC<MatchHeaderActionsProps> = ({
  selectedMatch,
  isEditing,
  isSaved,
  isLoading,
  onSaveEdit,
  onCancelEdit,
  onRecalculatePredictions,
  onVoidPredictions,
}) => {
  return (
    <div className="section-header">
      <h2 className="form-title">
        <span className="icon">📋</span>
        {isEditing ? '编辑比赛信息' : `${selectedMatch.matchName} - 详细信息`}
      </h2>
      {isEditing ? (
        <div className="form-actions">
          {isSaved && (
            <div className="save-success inline">
              <CheckCircle size={18} />
              保存成功
            </div>
          )}
          <button onClick={onSaveEdit} className="save-btn small" disabled={isLoading}>
            <CheckCircle size={16} />
            保存
          </button>
          <button onClick={onCancelEdit} className="cancel-btn">
            取消
          </button>
        </div>
      ) : (
        <div className="form-actions" style={{ gap: '8px', display: 'flex' }}>
          <button
            type="button"
            onClick={() => {
              if (confirm(`确认要重新结算比赛 "${selectedMatch.matchName}" 的竞猜得分吗？`)) {
                onRecalculatePredictions?.(selectedMatch.id);
              }
            }}
            className="save-btn small"
            style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
          >
            重算本场竞猜
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  `警告：作废竞猜将把比赛 "${selectedMatch.matchName}" 的所有预测设为 VOID 且归零，确认操作吗？`,
                )
              ) {
                onVoidPredictions?.(selectedMatch.id);
              }
            }}
            className="cancel-btn small"
            style={{ backgroundColor: '#dc3545', color: '#fff', borderColor: '#dc3545' }}
          >
            作废本场竞猜
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchHeaderActions;
