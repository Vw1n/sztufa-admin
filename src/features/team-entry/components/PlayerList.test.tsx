// @jest-environment jsdom
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, jest } from '@jest/globals';
import PlayerList from './PlayerList';
import { Player } from '../../../types';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
if (typeof window.URL.createObjectURL !== 'function') {
  window.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/fake-photo-url');
}

describe('PlayerList Component', () => {
  const mockPlayer: Player = {
    id: 'p-1',
    name: '张三',
    studentId: '2021001',
    jerseyNumber: '10',
    photo: null,
    teamId: 't-1',
  };

  it('mobile card photo change passes photoFile to onUpdatePlayer on save', async () => {
    const handleUpdatePlayer = jest.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PlayerList
          players={[mockPlayer]}
          onAddPlayer={jest.fn()}
          onRemovePlayer={jest.fn()}
          onUpdatePlayer={handleUpdatePlayer}
          disabled={false}
        />,
      );
    });

    // 点击移动端列表项打开卡片
    const listItem = container.querySelector('.player-list-item') as HTMLElement;
    expect(listItem).toBeTruthy();

    await act(async () => {
      listItem.click();
    });

    // 弹窗出现，找 photo input
    const overlay = container.querySelector('.player-card-overlay');
    expect(overlay).toBeTruthy();

    const photoInput = container.querySelector('.player-card-photo-picker input[type="file"]') as HTMLInputElement;
    expect(photoInput).toBeTruthy();

    const fakeFile = new File(['fake photo'], 'photo.png', { type: 'image/png' });

    await act(async () => {
      Object.defineProperty(photoInput, 'files', {
        value: [fakeFile],
      });
      photoInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // 点击保存修改
    const saveBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('保存修改'),
    );
    expect(saveBtn).toBeTruthy();

    await act(async () => {
      saveBtn!.click();
    });

    expect(handleUpdatePlayer).toHaveBeenCalledWith(
      'p-1',
      expect.objectContaining({
        photoFile: fakeFile,
      }),
    );
  });

  it('prevents opening card and hides delete buttons when disabled is true', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PlayerList
          players={[mockPlayer]}
          onAddPlayer={jest.fn()}
          onRemovePlayer={jest.fn()}
          onUpdatePlayer={jest.fn()}
          disabled={true}
        />,
      );
    });

    // 点击移动端列表项
    const listItem = container.querySelector('.player-list-item') as HTMLElement;
    await act(async () => {
      listItem.click();
    });

    // 不打开弹窗
    const overlay = container.querySelector('.player-card-overlay');
    expect(overlay).toBeNull();

    // 不存在删除按钮
    const deleteBtns = container.querySelectorAll('.delete-btn, .player-mobile-delete');
    expect(deleteBtns.length).toBe(0);
  });
});
