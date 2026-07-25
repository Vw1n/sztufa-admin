// @jest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useMatchForm } from './useMatchForm';
import { teamApi, seasonApi } from '../../../api/service';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../../api/service', () => ({
  teamApi: {
    getAll: jest.fn().mockResolvedValue({ data: [] }),
    getPlayers: jest.fn().mockResolvedValue([]),
    getById: jest.fn(),
  },
  seasonApi: {
    getAll: jest.fn().mockResolvedValue([]),
    getGroups: jest.fn().mockResolvedValue([]),
  },
  matchApi: {
    create: jest.fn(),
  },
}));

describe('useMatchForm - 门面 Hook 完整集成测试', () => {
  const mockTeams = [
    { id: 'team-1', teamName: 'A组球队1', homeJerseyColor: '红', awayJerseyColor: '白' },
    { id: 'team-2', teamName: 'A组球队2', homeJerseyColor: '蓝', awayJerseyColor: '白' },
    { id: 'team-3', teamName: 'B组球队1', homeJerseyColor: '黄', awayJerseyColor: '黑' },
  ];

  const mockSeasonGroups = [
    { groupName: 'A', teamId: 'team-1' },
    { groupName: 'A', teamId: 'team-2' },
    { groupName: 'B', teamId: 'team-3' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (teamApi.getAll as jest.Mock).mockResolvedValue({ data: mockTeams });
    (seasonApi.getAll as jest.Mock).mockResolvedValue([
      { id: 'season-cup-1', name: '2026杯赛', status: 'active', type: 'CUP' },
    ]);
    (seasonApi.getGroups as jest.Mock).mockResolvedValue(mockSeasonGroups);
  });

  it('直接调用 useMatchForm() 无参 getFilteredTeams() 时，能够从门面正确提取活跃杯赛与分组信息并进行过滤', async () => {
    let hookResult: ReturnType<typeof useMatchForm> | null = null;

    function TestComponent() {
      hookResult = useMatchForm();
      return null;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(TestComponent));
    });

    for (let i = 0; i < 20; i++) {
      if (hookResult?.activeSeason) break;
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });
    }

    expect(hookResult!.activeSeason?.type).toBe('CUP');
    expect(hookResult!.seasonGroups.length).toBe(3);

    // 直接调用门面上的无参 getFilteredTeams()
    const filteredA = hookResult!.getFilteredTeams();
    expect(filteredA.map(t => t.id)).toEqual(['team-1', 'team-2']);

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
