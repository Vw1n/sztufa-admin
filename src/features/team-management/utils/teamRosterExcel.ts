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
  let studentIdDupCount = 0;
  let jerseyNumDupCount = 0;

  for (const p of importedPlayers) {
    const sId = String(p.studentId ?? '').trim();
    const jNum = String(p.jerseyNumber ?? '').trim();
    if (mergedPlayers.some((mp) => mp.studentId === sId)) {
      studentIdDupCount++;
      continue;
    }
    if (mergedPlayers.some((mp) => String(mp.jerseyNumber ?? '') === jNum)) {
      jerseyNumDupCount++;
      continue;
    }
    mergedPlayers.push({
      ...p,
      studentId: sId,
      jerseyNumber: jNum,
      id: generateId(),
      teamId: teamId,
    });
  }

  const successCount = importedPlayers.length - studentIdDupCount - jerseyNumDupCount;
  let message = `成功导入 ${successCount} 名球员。`;
  if (studentIdDupCount > 0) message += `跳过了 ${studentIdDupCount} 名学号重复的球员。`;
  if (jerseyNumDupCount > 0) message += `跳过了 ${jerseyNumDupCount} 名球衣号码重复的球员。`;

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
  }));
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '球员名单');
  XLSX.writeFile(workbook, `${teamName}_球员名单.xlsx`);
}
