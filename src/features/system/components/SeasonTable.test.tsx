// @jest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { SeasonTable } from './SeasonTable';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('SeasonTable 组件行为测试', () => {
  const mockSeasons = [
    { id: 'season-1', name: '2026 联赛', type: 'LEAGUE', status: 'active' },
    { id: 'season-2', name: '2025 杯赛', type: 'CUP', status: 'archived' },
  ];

  it('正确渲染赛季数据列表及按钮状态', async () => {
    const onUpdateSeasonStatus = jest.fn();
    const onRenameSeason = jest.fn() as any;
    const onDeleteSeason = jest.fn();

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <SeasonTable
          seasons={mockSeasons}
          isUpdatingStatusId={null}
          isRenamingSeasonId={null}
          isDeletingSeasonId={null}
          onUpdateSeasonStatus={onUpdateSeasonStatus}
          onRenameSeason={onRenameSeason}
          onDeleteSeason={onDeleteSeason}
        />
      );
    });

    expect(container.textContent).toContain('2026 联赛');
    expect(container.textContent).toContain('2025 杯赛');
    expect(container.textContent).toContain('活跃中');
    expect(container.textContent).toContain('已归档');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
