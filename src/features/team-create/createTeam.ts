import { teamApi } from '../../api/service';
import { CreateTeamPlayerDTO, CreateTeamWithPlayersDTO } from '../../api/types';
import { Player, Team, TeamFormData } from '../../types';
import { generateId } from '../../utils';
import { uploadImageFile } from '../../utils/imageUpload';

export interface TeamCreationProgress {
  current: number;
  total: number;
  message: string;
}

export type TeamCreationProgressHandler = (progress: TeamCreationProgress) => void;

export const createTeam = async (
  form: TeamFormData,
  players: Player[],
  onProgress: TeamCreationProgressHandler,
): Promise<Team> => {
  const imageCount = [
    form.teamLogo,
    form.homeJersey,
    form.awayJersey,
    ...players.map((player) => player.photoFile),
  ].filter(Boolean).length;
  const totalSteps = imageCount + 1;
  let currentStep = 0;

  const uploadImage = async (file: File, label: string): Promise<string> => {
    onProgress({
      current: currentStep,
      total: totalSteps,
      message: `正在上传${label}...`,
    });
    const url = await uploadImageFile(file, label);
    currentStep++;
    return url;
  };

  const teamLogoUrl = form.teamLogo
    ? await uploadImage(form.teamLogo, '队徽')
    : null;
  const homeJerseyUrl = form.homeJersey
    ? await uploadImage(form.homeJersey, '主场球衣')
    : null;
  const awayJerseyUrl = form.awayJersey
    ? await uploadImage(form.awayJersey, '客场球衣')
    : null;

  const playerPayloads: CreateTeamPlayerDTO[] = [];
  for (const player of players) {
    let photoUrl = player.photo;
    if (player.photoFile) {
      photoUrl = await uploadImage(player.photoFile, `球员 ${player.name} 的照片`);
    } else if (photoUrl?.startsWith('data:') || photoUrl?.startsWith('blob:')) {
      photoUrl = null;
    }

    playerPayloads.push({
      name: player.name,
      studentId: player.studentId,
      jerseyNumber: player.jerseyNumber,
      photo: photoUrl,
      status: player.status || 'active',
      yellowCards: Number(player.yellowCards) || 0,
      redCards: Number(player.redCards) || 0,
    });
  }

  onProgress({
    current: currentStep,
    total: totalSteps,
    message: '正在以事务方式保存球队和全部球员...',
  });

  const teamDTO: CreateTeamWithPlayersDTO = {
    teamName: form.teamName,
    teamDoctor: form.teamDoctor,
    headCoach: form.headCoach,
    teamLeader: form.teamLeader,
    coachPhone: form.coachPhone,
    leaderPhone: form.leaderPhone,
    homeJerseyColor: form.homeJerseyColor,
    awayJerseyColor: form.awayJerseyColor,
    teamLogo: teamLogoUrl,
    homeJersey: homeJerseyUrl,
    awayJersey: awayJerseyUrl,
    gender: form.gender,
    seasonId: form.seasonId,
    players: playerPayloads,
  };

  const savedTeam = await teamApi.createWithPlayers(teamDTO);
  const teamId = savedTeam.id;
  if (!teamId) {
    throw new Error('服务器保存球队信息失败，未返回有效的球队ID');
  }
  currentStep++;

  const savedPlayers: Player[] = (savedTeam.players || []).map((player) => ({
    id: player.id || generateId(),
    name: player.name,
    studentId: player.studentId,
    jerseyNumber: player.jerseyNumber,
    photo: player.photo || null,
    status: player.status || 'active',
    yellowCards: player.yellowCards || 0,
    redCards: player.redCards || 0,
    teamId: player.teamId || teamId,
  }));

  onProgress({
    current: totalSteps,
    total: totalSteps,
    message: '同步完成！正在重新渲染...',
  });

  return {
    id: teamId,
    teamName: savedTeam.teamName,
    teamDoctor: savedTeam.teamDoctor,
    headCoach: savedTeam.headCoach,
    teamLeader: savedTeam.teamLeader,
    coachPhone: savedTeam.coachPhone,
    leaderPhone: savedTeam.leaderPhone,
    homeJerseyColor: savedTeam.homeJerseyColor,
    awayJerseyColor: savedTeam.awayJerseyColor,
    teamLogo: savedTeam.teamLogo || null,
    homeJersey: savedTeam.homeJersey || null,
    awayJersey: savedTeam.awayJersey || null,
    gender: savedTeam.gender || form.gender,
    players: savedPlayers,
  };
};
