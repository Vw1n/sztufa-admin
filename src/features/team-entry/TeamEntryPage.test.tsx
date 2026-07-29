// @jest-environment jsdom
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, jest } from '@jest/globals';
import TeamEntryPage from './TeamEntryPage';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'super_admin', username: 'admin' },
  }),
}));

jest.mock('../../api/service', () => ({
  seasonApi: {
    getAll: jest.fn(async () => []),
  },
}));

jest.mock('./components/TeamForm', () => () => <div>单球队手工表单</div>);
jest.mock('./components/PlayerList', () => () => <div>球员表单</div>);
jest.mock('../../components/ExcelImporter', () => () => <div>Excel 导入</div>);
jest.mock('../../components/SuccessToast', () => ({ message }: { message: string }) => (
  <div>{message}</div>
));
jest.mock('../../components/PdfImporter', () => ({
  __esModule: true,
  default: ({ onImportSuccess }: any) => (
    <div>
      <span>多球队 PDF 预览器</span>
      <button
        type="button"
        onClick={() =>
          onImportSuccess({
            teams: [{
              teamName: { value: '测试球队', confidence: 1, page: 1 },
              teamDoctor: { value: '队医', confidence: 1, page: 1 },
              headCoach: { value: '教练', confidence: 1, page: 1 },
              teamLeader: { value: '领队', confidence: 1, page: 1 },
              coachPhone: { value: '13800138000', confidence: 1, page: 1 },
              leaderPhone: { value: '13900139000', confidence: 1, page: 1 },
              homeJerseyColor: { value: '白', confidence: 1, page: 1 },
              awayJerseyColor: { value: '黑', confidence: 1, page: 1 },
              players: [],
            }],
          })
        }
      >
        模拟完成导入
      </button>
    </div>
  ),
}));

describe('TeamEntryPage PDF 批量导入入口', () => {
  it('允许超级管理员打开多球队 PDF 导入并显示批量结果', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<TeamEntryPage />);
    });

    expect(container.textContent).toContain('PDF 报名表批量导入');
    expect(container.textContent).toContain('上传多球队 PDF');

    const openButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('上传多球队 PDF'),
    );
    await act(async () => {
      openButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('多球队 PDF 预览器');

    const completeButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('模拟完成导入'),
    );
    await act(async () => {
      completeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('PDF 信息已回填到球队录入表单');
    expect(container.textContent).not.toContain('多球队 PDF 预览器');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
