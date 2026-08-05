import React from 'react';
import { ParsedTeam } from '../../api/pdf-import.service';

interface PdfTeamSelectorTabsProps {
  teams: ParsedTeam[];
  activeTeamIndex: number;
  onSelectTeam: (index: number) => void;
}

export const PdfTeamSelectorTabs: React.FC<PdfTeamSelectorTabsProps> = ({
  teams,
  activeTeamIndex,
  onSelectTeam,
}) => {
  if (teams.length <= 1) return null;

  return (
    <div
      className="team-tabs"
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '10px',
        marginBottom: '16px',
        borderBottom: '1px solid #e9ecef',
      }}
    >
      {teams.map((t, idx) => (
        <button
          key={idx}
          onClick={() => onSelectTeam(idx)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid',
            borderColor: activeTeamIndex === idx ? '#228be6' : '#dee2e6',
            background: activeTeamIndex === idx ? '#e7f5ff' : '#f8f9fa',
            color: activeTeamIndex === idx ? '#1c7ed6' : '#495057',
            fontWeight: activeTeamIndex === idx ? 600 : 400,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {t.teamName.value || `球队 #${idx + 1}`} ({t.players.length}人)
        </button>
      ))}
    </div>
  );
};

export default PdfTeamSelectorTabs;
