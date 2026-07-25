// @jest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { AuditLogTable } from './AuditLogTable';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('AuditLogTable 组件行为测试', () => {
  const mockLogs = [
    {
      id: 'log-1',
      username: 'admin',
      action: 'UPDATE_TEAM',
      details: '更新球队信息',
      createdAt: '2026-07-25T10:00:00Z',
    },
  ];

  it('正确渲染审计日志列表及页码', async () => {
    const onPageChange = jest.fn();

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <AuditLogTable
          logs={mockLogs}
          page={1}
          totalPages={2}
          onPageChange={onPageChange}
        />
      );
    });

    expect(container.textContent).toContain('admin');
    expect(container.textContent).toContain('更新球队信息');
    expect(container.textContent).toContain('第 1 页 / 共 2 页');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
