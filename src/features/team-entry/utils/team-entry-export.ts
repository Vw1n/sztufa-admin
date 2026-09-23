import * as XLSX from 'xlsx';
import { Team } from '../../../types';

/**
 * 可导出的球队快照类型。
 * 超级管理员草稿物化后 savedTeam 仅含 id/teamName，普通用户创建后含完整 Team，
 * 因此导出函数接受 Partial<Team> & { teamName: string }。
 */
export type ExportableTeam = Partial<Team> & Pick<Team, 'teamName'>;

/**
 * 将球队快照导出为 JSON 文件并触发浏览器下载。
 * 不读取 React state，调用方需自行保证 team 非空。
 */
export function exportTeamToJson(team: ExportableTeam): void {
  const dataStr = JSON.stringify(team, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${team.teamName}_球队信息.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 将球队快照导出为 Excel 文件（球队信息 + 球员名单两个 sheet）。
 * 不读取 React state，调用方需自行保证 team 非空。
 */
export function exportTeamToExcel(team: ExportableTeam): void {
  const teamInfo = [
    { '信息类型': '队伍名称', '内容': team.teamName },
    { '信息类型': '队医姓名', '内容': team.teamDoctor },
    { '信息类型': '主教练姓名', '内容': team.headCoach },
    { '信息类型': '领队姓名', '内容': team.teamLeader },
    { '信息类型': '主教练联系方式', '内容': team.coachPhone },
    { '信息类型': '领队联系方式', '内容': team.leaderPhone },
    { '信息类型': '主队球衣颜色', '内容': team.homeJerseyColor },
    { '信息类型': '客队球衣颜色', '内容': team.awayJerseyColor },
  ];

  const playerData =
    team.players?.map((player) => ({
      '姓名': player.name,
      '学号': player.studentId,
      '球衣号码': player.jerseyNumber,
    })) || [];

  const workbook = XLSX.utils.book_new();

  const teamSheet = XLSX.utils.json_to_sheet(teamInfo);
  XLSX.utils.book_append_sheet(workbook, teamSheet, '球队信息');

  const playerSheet = XLSX.utils.json_to_sheet(playerData);
  XLSX.utils.book_append_sheet(workbook, playerSheet, '球员名单');

  XLSX.writeFile(workbook, `${team.teamName}_球队信息.xlsx`);
}
