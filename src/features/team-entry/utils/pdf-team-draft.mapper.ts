import { ParsedPlayer, ParsedTeam } from '../../../api/pdf-import.service';
import { Player, TeamFormData } from '../../../types';

/**
 * 纯数据映射：将 PDF 解析出的 ParsedTeam 文本字段映射为表单字段。
 * 不执行任何 IO（不下载图片、不创建 object URL、不访问浏览器 API）。
 *
 * 球队图片（logo/homeJersey/awayJersey）和球员照片由调用方（usePdfTeamDraftQueue）
 * 负责下载并组装到最终的 TeamFormData / Player 中。
 */

export type TeamFormTextFields = Omit<TeamFormData, 'teamLogo' | 'homeJersey' | 'awayJersey'>;
export type PlayerTextFields = Pick<Player, 'name' | 'studentId' | 'jerseyNumber'>;

export interface PdfDraftMappingContext {
  gender: string;
  seasonId: string;
}

/**
 * 将 ParsedTeam 的文本字段映射为 TeamFormData 文本字段（不含文件类型字段）。
 */
export function mapTeamFormFields(
  team: ParsedTeam,
  ctx: PdfDraftMappingContext,
): TeamFormTextFields {
  return {
    teamName: team.teamName.value || '',
    teamDoctor: team.teamDoctor.value || '',
    headCoach: team.headCoach.value || '',
    teamLeader: team.teamLeader.value || '',
    coachPhone: team.coachPhone.value || '',
    leaderPhone: team.leaderPhone.value || '',
    homeJerseyColor: team.homeJerseyColor.value || '',
    awayJerseyColor: team.awayJerseyColor.value || '',
    gender: ctx.gender,
    seasonId: ctx.seasonId,
  };
}

/**
 * 将 ParsedPlayer 的文本字段映射为 Player 文本字段（不含 id/photo/photoFile/teamId）。
 */
export function mapPlayerFields(player: ParsedPlayer): PlayerTextFields {
  return {
    name: player.name.value || '',
    studentId: player.studentId.value || '',
    jerseyNumber: player.jerseyNumber.value || '',
  };
}

/**
 * 批量映射一支球队的全部球员文本字段。
 */
export function mapPlayerFieldsList(players: ParsedPlayer[]): PlayerTextFields[] {
  return players.map(mapPlayerFields);
}
