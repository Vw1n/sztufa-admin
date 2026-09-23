// @jest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { useTeamEntryForm } from './useTeamEntryForm';
import { useTeamEntrySave } from './useTeamEntrySave';
import { usePdfTeamDraftQueue } from './usePdfTeamDraftQueue';
import { seasonApi } from '../../../api/service';
import { formDraftApi } from '../../../api/form-draft.service';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../../api/service', () => ({
  seasonApi: {
    getAll: jest.fn(async () => [
      { id: 'season-1', name: '2026 男子足球联赛', status: 'active', gender: 'MALE' },
      { id: 'season-2', name: '2026 女子足球联赛', status: 'active', gender: 'FEMALE' },
    ]),
  },
  teamApi: {
    createWithPlayers: jest.fn(),
  },
}));

jest.mock('../../../api/pdf-import.service', () => ({
  pdfImportApi: {
    downloadAsset: jest.fn(async () => new Blob(['dummy'], { type: 'image/webp' })),
  },
}));

jest.mock('../../../api/form-draft.service', () => ({
  formDraftApi: {
    saveDraft: jest.fn(),
    materializeDraft: jest.fn(),
  },
}));

jest.mock('../../team-create', () => {
  const actual = jest.requireActual('../../team-create') as Record<string, unknown>;
  return {
    createTeam: jest.fn(),
    getCompatibleActiveSeasons: actual.getCompatibleActiveSeasons,
    selectActiveSeasonId: actual.selectActiveSeasonId,
    validateTeamCreation: jest.fn(() => null),
  };
});

import { createTeam } from '../../team-create';

type AnyMock = jest.Mock<any>;
const saveDraftMock = formDraftApi.saveDraft as unknown as AnyMock;
const materializeDraftMock = formDraftApi.materializeDraft as unknown as AnyMock;
const createTeamMock = createTeam as unknown as AnyMock;

/**
 * 测试容器：在组件内组合三个拆分后的 Hook，还原原 useTeamEntry 门面的对外接口，
 * 用于验证拆分前后行为一致（characterization test）。
 */
function TestContainer({
  onHook,
  userRole,
}: {
  onHook: (hook: Record<string, unknown>) => void;
  userRole?: string;
}) {
  const form = useTeamEntryForm();
  const pdfQueue = usePdfTeamDraftQueue({
    setTeamFormData: form.setTeamFormData,
    setPlayers: form.setPlayers,
    gender: form.teamFormData.gender,
    seasonId: form.teamFormData.seasonId,
    setError: form.setError,
  });
  const save = useTeamEntrySave({
    teamFormData: form.teamFormData,
    players: form.players,
    userRole,
    validate: form.validateForm,
    setError: form.setError,
    onSaveSuccess: pdfQueue.advanceQueue,
  });

  onHook({
    teamFormData: form.teamFormData,
    setTeamFormData: form.setTeamFormData,
    players: form.players,
    compatibleActiveSeasons: form.compatibleActiveSeasons,
    isSaved: save.isSaved,
    isLoading: save.isLoading,
    error: form.error,
    saveProgress: save.saveProgress,
    showPdfImporter: pdfQueue.showPdfImporter,
    setShowPdfImporter: pdfQueue.setShowPdfImporter,
    pdfImportMessage: pdfQueue.pdfImportMessage,
    setPdfImportMessage: pdfQueue.setPdfImportMessage,
    handleAddPlayer: form.handleAddPlayer,
    handleRemovePlayer: form.handleRemovePlayer,
    handleUpdatePlayer: form.handleUpdatePlayer,
    handleImportPlayers: form.handleImportPlayers,
    handleSave: save.handleSave,
    handlePdfTeamsRecognized: pdfQueue.handlePdfTeamsRecognized,
    savedTeam: save.savedTeam,
  });
  return null;
}

interface HookResult {
  readonly hook: Record<string, any>;
  render: () => Promise<void>;
  cleanup: () => Promise<void>;
}

function renderHook(userRole?: string): HookResult {
  let latestHook: Record<string, any> | null = null;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return {
    get hook() {
      return latestHook!;
    },
    render: async () => {
      await act(async () => {
        root.render(<TestContainer userRole={userRole} onHook={(h) => (latestHook = h)} />);
      });
    },
    cleanup: async () => {
      await act(async () => {
        root.unmount();
      });
      document.body.removeChild(container);
    },
  };
}

describe('team-entry 三 Hook 组合集成测试（拆分后行为回归基准）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应能够正确初始化并获取活跃赛季', async () => {
    const result = renderHook('super_admin');
    await result.render();

    expect(seasonApi.getAll).toHaveBeenCalled();
    expect(result.hook.compatibleActiveSeasons.length).toBeGreaterThan(0);
    expect(result.hook.players).toEqual([]);

    await result.cleanup();
  });

  it('应能够添加球员并允许存在同名、同学号或同号码球员', async () => {
    const result = renderHook('super_admin');
    await result.render();

    await act(async () => {
      result.hook.handleAddPlayer({
        name: '张三',
        studentId: '2026001',
        jerseyNumber: '10',
        teamId: '',
        photo: null,
      });
    });
    expect(result.hook.players.length).toBe(1);
    expect(result.hook.players[0].name).toBe('张三');

    await act(async () => {
      result.hook.handleAddPlayer({
        name: '李四',
        studentId: '2026001',
        jerseyNumber: '11',
        teamId: '',
        photo: null,
      });
    });
    expect(result.hook.players.length).toBe(2);

    await act(async () => {
      result.hook.handleAddPlayer({
        name: '王五',
        studentId: '2026002',
        jerseyNumber: '10',
        teamId: '',
        photo: null,
      });
    });
    expect(result.hook.players.length).toBe(3);

    await result.cleanup();
  });

  it('应能够正确更新与删除球员信息', async () => {
    const result = renderHook('super_admin');
    await result.render();

    await act(async () => {
      result.hook.handleAddPlayer({
        name: '赵六',
        studentId: '2026009',
        jerseyNumber: '9',
        teamId: '',
        photo: null,
      });
    });

    const targetId = result.hook.players[0].id;

    await act(async () => {
      result.hook.handleUpdatePlayer(targetId, { jerseyNumber: '99' });
    });
    expect(result.hook.players[0].jerseyNumber).toBe('99');

    await act(async () => {
      result.hook.handleRemovePlayer(targetId);
    });
    expect(result.hook.players.length).toBe(0);

    await result.cleanup();
  });

  it('超级管理员保存应调用 saveDraft + materializeDraft', async () => {
    saveDraftMock.mockResolvedValue({
      draftId: 'draft-1',
      saveStatus: 'DRAFT',
      draft: { id: 'draft-1', formType: 'TEAM', payload: {} },
    });
    materializeDraftMock.mockResolvedValue({
      success: true,
      officialRecordId: 'team-official-1',
    });

    const result = renderHook('super_admin');
    await result.render();

    await act(async () => {
      await result.hook.handleSave();
    });

    expect(saveDraftMock).toHaveBeenCalledTimes(1);
    expect(materializeDraftMock).toHaveBeenCalledWith('draft-1');
    expect(result.hook.savedTeam).toEqual({ id: 'team-official-1', teamName: '' });
    expect(result.hook.isSaved).toBe(true);

    await result.cleanup();
  });

  it('普通用户保存应调用 createTeam 而非 formDraftApi', async () => {
    createTeamMock.mockResolvedValue({
      id: 'team-1',
      teamName: '测试队',
      homeJerseyColor: '红',
      awayJerseyColor: '蓝',
      teamLogo: null,
      homeJersey: null,
      awayJersey: null,
      players: [],
    });

    const result = renderHook('coach');
    await result.render();

    await act(async () => {
      await result.hook.handleSave();
    });

    expect(createTeamMock).toHaveBeenCalledTimes(1);
    expect(saveDraftMock).not.toHaveBeenCalled();
    expect(materializeDraftMock).not.toHaveBeenCalled();
    expect(result.hook.savedTeam?.teamName).toBe('测试队');

    await result.cleanup();
  });

  it('物化失败时应设置错误提示但 isSaved 仍为 true', async () => {
    saveDraftMock.mockResolvedValue({
      draftId: 'draft-2',
      saveStatus: 'DRAFT',
      draft: { id: 'draft-2', formType: 'TEAM', payload: {} },
    });
    materializeDraftMock.mockResolvedValue({
      success: false,
      error: '球员信息不完整',
    });

    const result = renderHook('super_admin');
    await result.render();

    await act(async () => {
      await result.hook.handleSave();
    });

    expect(result.hook.isSaved).toBe(true);
    expect(result.hook.error).toBe('球员信息不完整');

    await result.cleanup();
  });
});
