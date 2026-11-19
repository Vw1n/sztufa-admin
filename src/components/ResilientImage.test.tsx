import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { it, expect } from '@jest/globals';
import { ResilientImage, TeamLogo } from './ResilientImage';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

it('uses team initials for missing/broken logos and retries a replacement URL', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    await act(async () => root.render(<TeamLogo name="26新材能新生" />));
    expect(host.textContent).toBe('26');
    expect((host.querySelector('span') as HTMLElement).style.background).toBe('rgb(26, 86, 219)');
    await act(async () => root.render(<TeamLogo name="26新材能新生" src="bad.jpg" />));
    await act(async () => host.querySelector('img')!.dispatchEvent(new Event('error')));
    expect(host.querySelector('img')).toBeNull();
    expect(host.textContent).toBe('26');
    await act(async () => root.render(<TeamLogo name="26新材能新生" src="new.jpg" />));
    expect(host.querySelector('img')!.getAttribute('src')).toBe('new.jpg');
  } finally { await act(async () => root.unmount()); }
});

it('replaces a failed cover with a placeholder and hides an absent jersey', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    await act(async () => root.render(<ResilientImage src="bad.jpg" alt="封面" fallback={<span>无封面</span>} />));
    await act(async () => host.querySelector('img')!.dispatchEvent(new Event('error')));
    expect(host.textContent).toBe('无封面');
    await act(async () => root.render(<ResilientImage src={null} alt="球衣" fallback={null} />));
    expect(host.innerHTML).toBe('');
  } finally { await act(async () => root.unmount()); }
});
