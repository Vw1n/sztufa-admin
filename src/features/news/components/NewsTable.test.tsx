// @jest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { NewsTable } from './NewsTable';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('NewsTable 组件行为测试', () => {
  const mockNews = [
    {
      id: 'news-1',
      title: '深技大足球联赛拉开帷幕',
      category: '赛事',
      description: '精彩赛事即将开启',
      wechatUrl: 'https://mp.weixin.qq.com',
      date: '2026-07-25',
    },
  ];

  it('正确渲染资讯标题与分类', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <NewsTable
          newsList={mockNews}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );
    });

    expect(container.textContent).toContain('深技大足球联赛拉开帷幕');
    expect(container.textContent).toContain('赛事');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
