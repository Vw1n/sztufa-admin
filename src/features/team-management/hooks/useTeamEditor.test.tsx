import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { useTeamEditor } from './useTeamEditor';
import { teamApi } from '../../../api/service';
import { Team } from '../../../types';

jest.mock('../../../api/service', () => ({ teamApi: { updateWithPlayers: jest.fn(), update: jest.fn() } }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => { jest.clearAllMocks(); jest.useFakeTimers(); });
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
const team: Team = { id: 'team-1', teamName: '测试队', players: [{ id: 'p1', name: '甲', studentId: '', jerseyNumber: '', photo: null, teamId: 'team-1' }] } as Team;

async function withEditor(run: (get: () => ReturnType<typeof useTeamEditor>, setError: ReturnType<typeof jest.fn>) => Promise<void>) {
  const root = createRoot(document.createElement('div'));
  const setError = jest.fn();
  let result: ReturnType<typeof useTeamEditor>;
  function Harness() { result = useTeamEditor(setError, jest.fn()); return null; }
  try {
    await act(async () => root.render(<Harness />));
    await act(async () => result!.handleEditTeam(team));
    await run(() => result!, setError);
  } finally { await act(async () => root.unmount()); }
}

it('批量更新404时明确失败，不回退为仅保存球队信息或报告成功', async () => {
  jest.mocked(teamApi.updateWithPlayers).mockRejectedValue(new Error('Cannot PATCH 404'));
  await withEditor(async (get, setError) => {
    const onSuccess = jest.fn();
    await act(async () => get().handleSaveEdit(team, 'season-1', onSuccess));
    expect(teamApi.update).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(get().isSaved).toBe(false);
    expect(setError).toHaveBeenLastCalledWith(expect.stringContaining('球队和球员未保存'));
  });
});

it('兼容旧服务响应时保留球队ID与名单，新球员请求不带临时ID', async () => {
  jest.mocked(teamApi.updateWithPlayers).mockResolvedValue({ id: 'profile-id', teamName: '测试队' } as never);
  await withEditor(async (get) => {
    await act(async () => get().setEditData({ ...team, players: [...team.players!, { ...team.players![0], id: 'temp_new', name: '乙' }] }));
    const onSuccess = jest.fn();
    await act(async () => get().handleSaveEdit(team, 'season-1', onSuccess));
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 'team-1', players: expect.arrayContaining([expect.objectContaining({ name: '乙' })]) }));
    expect(jest.mocked(teamApi.updateWithPlayers).mock.calls[0][1].players![1].id).toBeUndefined();
  });
});
