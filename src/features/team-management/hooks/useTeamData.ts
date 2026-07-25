import { useTeamDirectory } from './useTeamDirectory';
import { useTeamEditor } from './useTeamEditor';
import { useTeamRosterImport } from './useTeamRosterImport';
import { Team, Player } from '../../../types';

export function useTeamData(user: any) {
  const directory = useTeamDirectory(user);
  const editor = useTeamEditor(directory.setError, directory.setIsLoading);
  const rosterImport = useTeamRosterImport(directory.setError);

  const handleSeasonChange = (seasonId: string) => {
    directory.handleSeasonChange(seasonId);
    editor.handleCancelEdit();
  };

  const handleViewTeam = (team: Team) => {
    directory.handleViewTeam(team);
    editor.handleCancelEdit();
  };

  const handleEditTeam = (team: Team) => {
    directory.setSelectedTeam(team);
    editor.handleEditTeam(team);
  };

  const handleSaveEdit = async () => {
    await editor.handleSaveEdit(directory.selectedTeam, (updatedTeam) => {
      directory.setSelectedTeam(updatedTeam);
      directory.loadTeams();
    });
  };

  const handleDeleteTeam = async (teamId: string) => {
    await editor.handleDeleteTeam(teamId, async (deletedId) => {
      const nextPage = directory.teams.length === 1 && directory.currentPage > 1 ? directory.currentPage - 1 : directory.currentPage;
      if (nextPage !== directory.currentPage) {
        directory.setCurrentPage(nextPage);
      } else {
        await directory.loadTeams(nextPage, directory.filterSeasonId);
      }
      if (directory.selectedTeam?.id === deletedId) {
        directory.setSelectedTeam(null);
      }
    });
  };

  const handleExcelImport = (importedPlayers: Omit<Player, 'id'>[]) => {
    rosterImport.handleExcelImport(editor.editData, editor.setEditData, importedPlayers);
  };

  const handleExportPlayers = () => {
    rosterImport.handleExportPlayers(directory.selectedTeam);
  };

  return {
    teams: directory.teams,
    selectedTeam: directory.selectedTeam,
    isEditing: editor.isEditing,
    isLoading: directory.isLoading,
    error: directory.error,
    isSaved: editor.isSaved,
    saveProgress: editor.saveProgress,
    editData: editor.editData,
    showImporter: rosterImport.showImporter,
    allMatches: directory.allMatches,
    activeSeasonId: directory.activeSeasonId,
    activeSeasonName: directory.activeSeasonName,
    seasons: directory.seasons,
    filterSeasonId: directory.filterSeasonId,
    currentPage: directory.currentPage,
    totalTeams: directory.totalTeams,
    pageSize: directory.pageSize,
    handleSeasonChange,
    handlePageChange: directory.handlePageChange,
    setShowImporter: rosterImport.setShowImporter,
    setError: directory.setError,
    loadTeams: directory.loadTeams,
    handleViewTeam,
    handleEditTeam,
    handleSaveEdit,
    handleDeleteTeam,
    handleCancelEdit: editor.handleCancelEdit,
    handleFieldChange: editor.handleFieldChange,
    handlePlayerFieldChange: editor.handlePlayerFieldChange,
    handleDeletePlayerRow: editor.handleDeletePlayerRow,
    handleAddPlayerRow: editor.handleAddPlayerRow,
    handleExcelImport,
    handleExportPlayers,
  };
}
