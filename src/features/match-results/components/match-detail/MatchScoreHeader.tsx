import React from 'react';
import { Match } from '../../../../types';
import { getMatchPenaltyScore } from '../../../../utils/matchEvents';

interface MatchScoreHeaderProps {
  selectedMatch: Match;
  editData: Match | null;
  isEditing: boolean;
  onFieldChange: (field: keyof Match, value: string | number) => void;
  onSetEditData: (data: Match) => void;
}

export const MatchScoreHeader: React.FC<MatchScoreHeaderProps> = ({
  selectedMatch,
  editData,
  isEditing,
  onFieldChange,
  onSetEditData,
}) => {
  const displayedMatch = isEditing && editData ? editData : selectedMatch;
  const penaltyScore = getMatchPenaltyScore(displayedMatch);

  return (
    <>
      <div className="match-score-container">
        <div className="team-column home-team">
          <div className="team-label">主队</div>
          {isEditing ? (
            <>
              <div className="team-input-wrapper">
                <input
                  type="text"
                  value={editData?.homeTeamName || ''}
                  onChange={(e) => onFieldChange('homeTeamName', e.target.value)}
                  className="form-input team-name-input"
                  placeholder="主队名称"
                />
              </div>
              <div className="team-id-wrapper">
                <input
                  type="text"
                  value={editData?.homeTeamId || ''}
                  onChange={(e) => onFieldChange('homeTeamId', e.target.value)}
                  className="form-input team-id-input"
                  placeholder="主队ID（可选）"
                />
              </div>
            </>
          ) : (
            <>
              <div className="team-name-display">{selectedMatch.homeTeamName}</div>
              {selectedMatch.homeTeamId && (
                <div className="team-id-display">ID: {selectedMatch.homeTeamId}</div>
              )}
            </>
          )}
          <div className="score-input-wrapper">
            {isEditing ? (
              <input
                type="number"
                value={editData?.homeTeamScore || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  if (editData) onSetEditData({ ...editData, homeTeamScore: val, homeScore: val });
                }}
                className="form-input score-input"
                min="0"
              />
            ) : (
              <div className="score-value-display">{selectedMatch.homeTeamScore}</div>
            )}
          </div>
        </div>

        <div className="vs-divider">
          <div className="vs-circle">
            <span className="vs-text">VS</span>
          </div>
        </div>

        <div className="team-column away-team">
          <div className="team-label">客队</div>
          {isEditing ? (
            <>
              <div className="team-input-wrapper">
                <input
                  type="text"
                  value={editData?.awayTeamName || ''}
                  onChange={(e) => onFieldChange('awayTeamName', e.target.value)}
                  className="form-input team-name-input"
                  placeholder="客队名称"
                />
              </div>
              <div className="team-id-wrapper">
                <input
                  type="text"
                  value={editData?.awayTeamId || ''}
                  onChange={(e) => onFieldChange('awayTeamId', e.target.value)}
                  className="form-input team-id-input"
                  placeholder="客队ID（可选）"
                />
              </div>
            </>
          ) : (
            <>
              <div className="team-name-display">{selectedMatch.awayTeamName}</div>
              {selectedMatch.awayTeamId && (
                <div className="team-id-display">ID: {selectedMatch.awayTeamId}</div>
              )}
            </>
          )}
          <div className="score-input-wrapper">
            {isEditing ? (
              <input
                type="number"
                value={editData?.awayTeamScore || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  if (editData) onSetEditData({ ...editData, awayTeamScore: val, awayScore: val });
                }}
                className="form-input score-input"
                min="0"
              />
            ) : (
              <div className="score-value-display">{selectedMatch.awayTeamScore}</div>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div
          className="quick-forfeit-wrapper"
          style={{
            marginTop: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>快捷弃赛选项：</span>
          <button
            type="button"
            className="btn-quick-forfeit"
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              color: '#d97706',
              backgroundColor: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onClick={() => {
              if (editData) {
                onSetEditData({
                  ...editData,
                  homeTeamScore: 3,
                  homeScore: 3,
                  awayTeamScore: 0,
                  awayScore: 0,
                  events: [],
                });
              }
            }}
          >
            主胜 (弃赛 3:0)
          </button>
          <button
            type="button"
            className="btn-quick-forfeit"
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              color: '#d97706',
              backgroundColor: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onClick={() => {
              if (editData) {
                onSetEditData({
                  ...editData,
                  homeTeamScore: 0,
                  homeScore: 0,
                  awayTeamScore: 3,
                  awayScore: 3,
                  events: [],
                });
              }
            }}
          >
            客胜 (弃赛 0:3)
          </button>
        </div>
      )}

      {penaltyScore && (
        <div className="admin-penalty-score">
          <span>点球大战</span>
          <strong>
            {penaltyScore.home}-{penaltyScore.away}
          </strong>
        </div>
      )}
    </>
  );
};

export default MatchScoreHeader;
