import { teamApi } from '../../api/service';
import { Player, TeamFormData } from '../../types';
import { uploadImageFile } from '../../utils/imageUpload';
import { createTeam, TeamCreationProgress } from './createTeam';

jest.mock('../../api/service', () => ({
  teamApi: { createWithPlayers: jest.fn() },
}));
jest.mock('../../utils/imageUpload', () => ({
  uploadImageFile: jest.fn(),
}));

const file = (name: string): File => ({ name } as File);

const form: TeamFormData = {
  teamName: '测试队',
  teamDoctor: '王医生',
  headCoach: '张教练',
  teamLeader: '李领队',
  coachPhone: '13800138000',
  leaderPhone: '13900139000',
  homeJerseyColor: '蓝色',
  awayJerseyColor: '白色',
  teamLogo: file('logo.png'),
  homeJersey: file('home.png'),
  awayJersey: file('away.png'),
  gender: 'MALE',
  seasonId: 'season-1',
};

const player: Player = {
  id: 'local-player',
  name: '张三',
  studentId: '20260001',
  jerseyNumber: '10',
  photo: 'blob:preview',
  photoFile: file('player.png'),
  teamId: '',
};

describe('team-create workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads images in order and submits one complete atomic payload', async () => {
    (uploadImageFile as jest.Mock)
      .mockResolvedValueOnce('https://images.example/logo.webp')
      .mockResolvedValueOnce('https://images.example/home.webp')
      .mockResolvedValueOnce('https://images.example/away.webp')
      .mockResolvedValueOnce('https://images.example/player.webp');
    (teamApi.createWithPlayers as jest.Mock).mockResolvedValue({
      id: 'team-1',
      ...form,
      teamLogo: 'https://images.example/logo.webp',
      homeJersey: 'https://images.example/home.webp',
      awayJersey: 'https://images.example/away.webp',
      players: [{
        id: 'player-1',
        name: player.name,
        studentId: player.studentId,
        jerseyNumber: player.jerseyNumber,
        photo: 'https://images.example/player.webp',
        teamId: 'team-1',
      }],
    });
    const progress: TeamCreationProgress[] = [];

    const result = await createTeam(form, [player], (value) => progress.push(value));

    expect((uploadImageFile as jest.Mock).mock.calls.map((call) => call[1])).toEqual([
      '队徽',
      '主场球衣',
      '客场球衣',
      '球员 张三 的照片',
    ]);
    expect(teamApi.createWithPlayers).toHaveBeenCalledWith(expect.objectContaining({
      seasonId: 'season-1',
      teamLogo: 'https://images.example/logo.webp',
      homeJersey: 'https://images.example/home.webp',
      awayJersey: 'https://images.example/away.webp',
      players: [expect.objectContaining({
        studentId: '20260001',
        photo: 'https://images.example/player.webp',
      })],
    }));
    expect(result.id).toBe('team-1');
    expect(result.players?.[0].teamId).toBe('team-1');
    expect(progress.at(-1)).toEqual({
      current: 5,
      total: 5,
      message: '同步完成！正在重新渲染...',
    });
  });

  it('does not upload images and removes a local-only preview without a file', async () => {
    (teamApi.createWithPlayers as jest.Mock).mockResolvedValue({
      id: 'team-1',
      teamName: form.teamName,
      homeJerseyColor: form.homeJerseyColor,
      awayJerseyColor: form.awayJerseyColor,
      players: [],
    });
    const noImages = {
      ...form,
      teamLogo: null,
      homeJersey: null,
      awayJersey: null,
    };
    const previewOnlyPlayer = { ...player, photoFile: null };

    await createTeam(noImages, [previewOnlyPlayer], jest.fn());

    expect(uploadImageFile).not.toHaveBeenCalled();
    expect(teamApi.createWithPlayers).toHaveBeenCalledWith(expect.objectContaining({
      players: [expect.objectContaining({ photo: null })],
    }));
  });

  it('stops before database creation when an image upload fails', async () => {
    (uploadImageFile as jest.Mock).mockRejectedValue(new Error('上传失败'));

    await expect(createTeam(form, [player], jest.fn())).rejects.toThrow('上传失败');
    expect(teamApi.createWithPlayers).not.toHaveBeenCalled();
  });

  it('keeps the missing team ID error', async () => {
    (uploadImageFile as jest.Mock).mockResolvedValue('https://images.example/image.webp');
    (teamApi.createWithPlayers as jest.Mock).mockResolvedValue({
      teamName: form.teamName,
      homeJerseyColor: form.homeJerseyColor,
      awayJerseyColor: form.awayJerseyColor,
      players: [],
    });

    await expect(createTeam(form, [player], jest.fn())).rejects.toThrow(
      '服务器保存球队信息失败，未返回有效的球队ID',
    );
  });
});
