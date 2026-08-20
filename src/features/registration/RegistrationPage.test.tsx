// @jest-environment jsdom
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, jest } from '@jest/globals';
import RegistrationPage from './RegistrationPage';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockUseRegistration = jest.fn() as any;
jest.mock('./useRegistration', () => ({
  useRegistration: () => mockUseRegistration(),
}));

describe('RegistrationPage Component', () => {
  const baseMockHook = {
    loading: false,
    saving: false,
    submitting: false,
    error: null,
    activeSeasons: [{ id: 'season-1', name: '2026 活跃赛季', status: 'active' }],
    selectedSeasonId: 'season-1',
    setSelectedSeasonId: jest.fn(),
    registration: null,
    teamForm: {
      teamName: '测试球队',
      teamDoctor: '',
      headCoach: '',
      teamLeader: '',
      coachPhone: '',
      leaderPhone: '',
      homeJerseyColor: '红色',
      awayJerseyColor: '白色',
      teamLogo: null,
      homeJersey: null,
      awayJersey: null,
      seasonId: 'season-1',
      gender: 'MALE',
    },
    setTeamForm: jest.fn(),
    players: [],
    isReadOnly: false,
    handleCreateDraft: jest.fn(),
    handleSaveDraft: jest.fn(),
    handleSubmit: jest.fn(),
    handleAddPlayer: jest.fn(),
    handleRemovePlayer: jest.fn(),
    handleUpdatePlayer: jest.fn(),
    handleImportPlayers: jest.fn(),
  };

  it('renders empty draft state when registration is null', async () => {
    mockUseRegistration.mockReturnValue({ ...baseMockHook, registration: null });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<RegistrationPage />);
    });

    expect(container.textContent).toContain('尚未创建本赛季报名信息');
    expect(container.textContent).toContain('开始填报本赛季报名');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('renders editable form and action buttons when in DRAFT status', async () => {
    mockUseRegistration.mockReturnValue({
      ...baseMockHook,
      registration: { id: 'reg-1', status: 'DRAFT', seasonId: 'season-1' },
      isReadOnly: false,
    });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<RegistrationPage />);
    });

    expect(container.textContent).toContain('草稿');
    expect(container.textContent).toContain('保存草稿');
    expect(container.textContent).toContain('提交报名');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('renders review comment alert when status is CHANGES_REQUESTED', async () => {
    mockUseRegistration.mockReturnValue({
      ...baseMockHook,
      registration: {
        id: 'reg-1',
        status: 'CHANGES_REQUESTED',
        seasonId: 'season-1',
        reviewComment: '请修改队长球衣号码并重新确认队医名字',
      },
      isReadOnly: false,
    });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<RegistrationPage />);
    });

    expect(container.textContent).toContain('管理员审核意见');
    expect(container.textContent).toContain('请修改队长球衣号码');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('locks form and shows readonly banner when status is SUBMITTED', async () => {
    mockUseRegistration.mockReturnValue({
      ...baseMockHook,
      registration: { id: 'reg-1', status: 'SUBMITTED', seasonId: 'season-1' },
      isReadOnly: true,
    });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<RegistrationPage />);
    });

    expect(container.textContent).toContain('已提交 (待审核)');
    expect(container.textContent).toContain('表单与球员名单已锁定只读');
    expect(container.textContent).not.toContain('保存草稿');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
