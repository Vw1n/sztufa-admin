import { mapTeamDtoToModel, mapPlayerDtoToModel, buildPlayerPayload, calculateDeletedPlayerIds } from './teamMapper';
import { TeamDTO } from '../../../api/types';
import { Player } from '../../../types';

describe('teamMapper', () => {
  it('mapPlayerDtoToModel should transform PlayerDTO correctly', () => {
    const dto = {
      id: 'p1',
      name: '张三',
      studentId: '2023001',
      jerseyNumber: '9',
      photo: 'http://example.com/photo.jpg',
      status: 'active',
      yellowCards: 1,
      redCards: 0,
      teamId: 't1',
    };
    const player = mapPlayerDtoToModel(dto);
    expect(player.id).toBe('p1');
    expect(player.name).toBe('张三');
    expect(player.yellowCards).toBe(1);
  });

  it('mapTeamDtoToModel should transform TeamDTO correctly', () => {
    const dto: TeamDTO = {
      id: 't1',
      teamName: '战狼队',
      homeJerseyColor: '红',
      awayJerseyColor: '白',
      players: [
        { id: 'p1', name: '张三', studentId: '2023001', jerseyNumber: '9' },
      ],
    };
    const team = mapTeamDtoToModel(dto);
    expect(team.id).toBe('t1');
    expect(team.teamName).toBe('战狼队');
    expect(team.players?.length).toBe(1);
    expect(team.players?.[0].name).toBe('张三');
  });

  it('buildPlayerPayload should strip temp_ ids and convert types', () => {
    const players: Player[] = [
      { id: 'p1', name: '老球员', studentId: '1001', jerseyNumber: '1', photo: null, teamId: 't1' },
      { id: 'temp_12345', name: '新球员', studentId: '1002', jerseyNumber: '2', photo: null, teamId: 't1' },
    ];
    const payload = buildPlayerPayload(players);
    expect(payload[0].id).toBe('p1');
    expect(payload[1].id).toBeUndefined();
    expect(payload[1].name).toBe('新球员');
  });

  it('calculateDeletedPlayerIds should identify removed player IDs', () => {
    const original: Player[] = [
      { id: 'p1', name: '球员一', studentId: '1001', jerseyNumber: '1', photo: null, teamId: 't1' },
      { id: 'p2', name: '球员二', studentId: '1002', jerseyNumber: '2', photo: null, teamId: 't1' },
    ];
    const current: Player[] = [
      { id: 'p1', name: '球员一', studentId: '1001', jerseyNumber: '1', photo: null, teamId: 't1' },
    ];
    const deleted = calculateDeletedPlayerIds(original, current);
    expect(deleted).toEqual(['p2']);
  });
});
