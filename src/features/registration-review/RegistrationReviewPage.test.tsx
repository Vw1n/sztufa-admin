// @jest-environment jsdom
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, jest } from '@jest/globals';
import RegistrationReviewPage from './RegistrationReviewPage';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockUseRegistrationReview = jest.fn() as any;
jest.mock('./useRegistrationReview', () => ({
  useRegistrationReview: () => mockUseRegistrationReview(),
}));

describe('RegistrationReviewPage Component', () => {
  const baseMockHook = {
    loading: false,
    error: null,
    seasons: [{ id: 'season-1', name: '2026 联赛', status: 'active' }],
    selectedSeasonId: '',
    setSelectedSeasonId: jest.fn(),
    statusFilter: '',
    setStatusFilter: jest.fn(),
    page: 1,
    setPage: jest.fn(),
    listData: {
      items: [
        {
          id: 'reg-1',
          seasonId: 'season-1',
          seasonName: '2026 联赛',
          teamId: 'team-1',
          teamName: '计算机足球队',
          gender: 'MALE',
          teamLogo: null,
          status: 'SUBMITTED',
          playerCount: 16,
          submittedAt: '2026-08-20T10:00:00Z',
          updatedAt: '2026-08-20T10:00:00Z',
        },
      ],
      total: 1,
      totalPages: 1,
    },
    selectedId: null,
    detail: null,
    detailLoading: false,
    reviewComment: '',
    setReviewComment: jest.fn(),
    actionLoading: false,
    openDetail: jest.fn(),
    closeDetail: jest.fn(),
    handleApprove: jest.fn(),
    handleRequestChanges: jest.fn(),
  };

  it('renders summary list with team name and status badge', async () => {
    mockUseRegistrationReview.mockReturnValue(baseMockHook);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<RegistrationReviewPage />);
    });

    expect(container.textContent).toContain('赛季领队报名审核');
    expect(container.textContent).toContain('计算机足球队');
    expect(container.textContent).toContain('16 人');
    expect(container.textContent).toContain('已提交 (待审核)');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('triggers openDetail when clicking 查看详情', async () => {
    const openDetailMock = jest.fn();
    mockUseRegistrationReview.mockReturnValue({
      ...baseMockHook,
      openDetail: openDetailMock,
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<RegistrationReviewPage />);
    });

    const detailBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('查看详情'),
    );
    await act(async () => {
      detailBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(openDetailMock).toHaveBeenCalledWith('reg-1');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('renders detail modal and action buttons when detail is loaded', async () => {
    const handleApproveMock = jest.fn();
    const handleRequestChangesMock = jest.fn();

    mockUseRegistrationReview.mockReturnValue({
      ...baseMockHook,
      detail: {
        id: 'reg-1',
        seasonId: 'season-1',
        teamId: 'team-1',
        status: 'SUBMITTED',
        teamData: {
          teamName: '计算机足球队',
          headCoach: '张教练',
          homeJerseyColor: '蓝色',
          awayJerseyColor: '白色',
          gender: 'MALE',
        },
        players: [{ id: 'p-1', name: '李明', studentId: '202101', jerseyNumber: '10' }],
      },
      handleApprove: handleApproveMock,
      handleRequestChanges: handleRequestChangesMock,
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<RegistrationReviewPage />);
    });

    expect(container.textContent).toContain('报名球员名单 (1 人)');
    expect(container.textContent).toContain('李明');
    expect(container.textContent).toContain('审核通过 (物化数据)');
    expect(container.textContent).toContain('退回修改');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
