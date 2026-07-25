import { useState } from 'react';
import { Team, Player } from '../../../types';
import { mergeImportedPlayers, exportPlayersToExcel } from '../utils/teamRosterExcel';

export function useTeamRosterImport(setError: (msg: string | null) => void) {
  const [showImporter, setShowImporter] = useState(false);

  const handleExcelImport = (
    editData: Team | null,
    setEditData: (team: Team | null) => void,
    importedPlayers: Omit<Player, 'id'>[],
  ) => {
    if (editData) {
      const result = mergeImportedPlayers(editData.players || [], importedPlayers, editData.id);
      setEditData({ ...editData, players: result.mergedPlayers });
      setShowImporter(false);
      setError(result.message);
    }
  };

  const handleExportPlayers = (selectedTeam: Team | null) => {
    if (!selectedTeam) return;
    exportPlayersToExcel(selectedTeam.teamName, selectedTeam.players || []);
  };

  return {
    showImporter,
    setShowImporter,
    handleExcelImport,
    handleExportPlayers,
  };
}
