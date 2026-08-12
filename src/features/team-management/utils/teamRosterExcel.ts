import { Player } from '../../../types';
import { generateId } from '../../../utils';
import * as XLSX from 'xlsx';

export interface MergeImportResult {
  mergedPlayers: Player[];
  importedCount: number;
  studentIdDupCount: number;
  jerseyNumDupCount: number;
  message: string;
}

export function mergeImportedPlayers(
  existingPlayers: Player[],
  importedPlayers: Omit<Player, 'id'>[],
  teamId: string
): MergeImportResult {
  const mergedPlayers = [...existingPlayers];
  const studentIdDupCount = 0;
  const jerseyNumDupCount = 0;

  for (const p of importedPlayers) {
    const sId = String(p.studentId ?? '').trim();
    const jNum = String(p.jerseyNumber ?? '').trim();
    mergedPlayers.push({
      ...p,
      studentId: sId,
      jerseyNumber: jNum,
      id: generateId(),
      teamId: teamId,
    });
  }

  const successCount = importedPlayers.length;
  const message = `成功导入 ${successCount} 名球员。`;

  return {
    mergedPlayers,
    importedCount: successCount,
    studentIdDupCount,
    jerseyNumDupCount,
    message,
  };
}

export function exportPlayersToExcel(teamName: string, players: Player[]): void {
  const exportData = (players || []).map((p) => ({
    '姓名': p.name,
    '学号': p.studentId,
    '球衣号码': p.jerseyNumber,
    '照片': p.photo || '',
  }));
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '球员名单');
  XLSX.writeFile(workbook, `${teamName}_球员名单.xlsx`);
}
