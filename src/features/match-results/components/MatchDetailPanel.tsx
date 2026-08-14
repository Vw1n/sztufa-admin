import React from 'react';
import { PlayerDTO, SeasonDTO } from '../../../api/types';
import { Match, MatchEvent, MatchEventValue } from '../../../types';
import { MatchEventTable } from './MatchEventTable';
import { MatchLineupPanel } from './MatchLineupPanel';
import MatchBasicFields from './match-detail/MatchBasicFields';
import MatchHeaderActions from './match-detail/MatchHeaderActions';
import MatchScoreHeader from './match-detail/MatchScoreHeader';
import MatchStageGroupFields from './match-detail/MatchStageGroupFields';

interface MatchDetailPanelProps {
  selectedMatch: Match;
  isEditing: boolean;
  isSaved: boolean;
  isLoading: boolean;
  editData: Match | null;
  seasons: SeasonDTO[];
  selectedSeasonId: string;
  homeTeamPlayers: PlayerDTO[];
  awayTeamPlayers: PlayerDTO[];
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onFieldChange: (field: keyof Match, value: string | number) => void;
  onSetEditData: (data: Match) => void;
  onLineupChange: (
    playerId: string,
    teamType: 'home' | 'away',
    type: 'starting' | 'substitute' | 'none',
  ) => void;
  onEventChange: (index: number, field: keyof MatchEvent, value: MatchEventValue) => void;
  onEventPlayerSelect: (index: number, playerId: string) => void;
  onSubPlayerSelect: (index: number, playerId: string) => void;
  onAssistPlayerSelect: (index: number, playerId: string) => void;
  onAddEvent: (team: 'home' | 'away') => void;
  onRemoveEvent: (index: number) => void;
  onRecalculatePredictions?: (matchId: string) => void;
  onVoidPredictions?: (matchId: string) => void;
}

export const MatchDetailPanel: React.FC<MatchDetailPanelProps> = ({
  selectedMatch,
  isEditing,
  isSaved,
  isLoading,
  editData,
  seasons,
  selectedSeasonId,
  homeTeamPlayers,
  awayTeamPlayers,
  onSaveEdit,
  onCancelEdit,
  onFieldChange,
  onSetEditData,
  onLineupChange,
  onEventChange,
  onEventPlayerSelect,
  onSubPlayerSelect,
  onAssistPlayerSelect,
  onAddEvent,
  onRemoveEvent,
  onRecalculatePredictions,
  onVoidPredictions,
}) => {
  const currentSeason = seasons.find(
    (s) => s.id === (editData?.seasonId || selectedMatch?.seasonId || selectedSeasonId),
  );
  const isCup = currentSeason?.type === 'CUP';

  return (
    <>
      {/* 比赛基本信息面板 */}
      <div className="form-section">
        <MatchHeaderActions
          selectedMatch={selectedMatch}
          isEditing={isEditing}
          isSaved={isSaved}
          isLoading={isLoading}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onRecalculatePredictions={onRecalculatePredictions}
          onVoidPredictions={onVoidPredictions}
        />

        {/* 杯赛阶段字段（仅 CUP 赛季） */}
        {isCup && (
          <MatchStageGroupFields
            selectedMatch={selectedMatch}
            editData={editData}
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            onSetEditData={onSetEditData}
          />
        )}

        {/* 基本字段 */}
        <MatchBasicFields
          selectedMatch={selectedMatch}
          editData={editData}
          isEditing={isEditing}
          homeTeamPlayers={homeTeamPlayers}
          awayTeamPlayers={awayTeamPlayers}
          onFieldChange={onFieldChange}
          onSetEditData={onSetEditData}
        />

        {/* 比分及快捷弃赛 */}
        <MatchScoreHeader
          selectedMatch={selectedMatch}
          editData={editData}
          isEditing={isEditing}
          onFieldChange={onFieldChange}
          onSetEditData={onSetEditData}
        />
      </div>

      {/* 阵容配置面板 */}
      <div className="form-section">
        <div className="section-header">
          <h2 className="form-title">
            <span className="icon">🏃‍♂️</span>
            首发与替补名单配置
          </h2>
        </div>
        <div
          className="lineups-admin-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}
        >
          <MatchLineupPanel
            teamType="home"
            selectedMatch={selectedMatch}
            editData={editData}
            isEditing={isEditing}
            players={homeTeamPlayers}
            onLineupChange={onLineupChange}
          />
          <MatchLineupPanel
            teamType="away"
            selectedMatch={selectedMatch}
            editData={editData}
            isEditing={isEditing}
            players={awayTeamPlayers}
            onLineupChange={onLineupChange}
          />
        </div>
      </div>

      {/* 事件表格：主队 */}
      <MatchEventTable
        teamType="home"
        events={editData?.events || selectedMatch.events || []}
        isEditing={isEditing}
        players={homeTeamPlayers}
        onAddEvent={() => onAddEvent('home')}
        onRemoveEvent={onRemoveEvent}
        onEventChange={onEventChange}
        onEventPlayerSelect={onEventPlayerSelect}
        onSubPlayerSelect={onSubPlayerSelect}
        onAssistPlayerSelect={onAssistPlayerSelect}
      />

      {/* 事件表格：客队 */}
      <MatchEventTable
        teamType="away"
        events={editData?.events || selectedMatch.events || []}
        isEditing={isEditing}
        players={awayTeamPlayers}
        onAddEvent={() => onAddEvent('away')}
        onRemoveEvent={onRemoveEvent}
        onEventChange={onEventChange}
        onEventPlayerSelect={onEventPlayerSelect}
        onSubPlayerSelect={onSubPlayerSelect}
        onAssistPlayerSelect={onAssistPlayerSelect}
      />
    </>
  );
};
