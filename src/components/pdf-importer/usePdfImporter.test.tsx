// @jest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, jest } from '@jest/globals';
import { usePdfImporter } from './usePdfImporter';
import { pdfImportApi } from '../../api/pdf-import.service';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../api/pdf-import.service', () => ({
  pdfImportApi: {
    preview: jest.fn(async () => ({
      batchId: 'batch-123',
      hasLowConfidence: true,
      teams: [
        {
          teamName: { value: '测试工程学院', confidence: 1.0, page: 1 },
          headCoach: { value: '教练张', confidence: 1.0, page: 1 },
          coachPhone: { value: '13800138000', confidence: 1.0, page: 1 },
          teamLeader: { value: '领队李', confidence: 1.0, page: 1 },
          leaderPhone: { value: '13900139000', confidence: 1.0, page: 1 },
          teamDoctor: { value: '队医王', confidence: 1.0, page: 1 },
          homeJerseyColor: { value: '红', confidence: 1.0, page: 1 },
          awayJerseyColor: { value: '白', confidence: 1.0, page: 1 },
          players: [
            {
              name: { value: '球员甲', confidence: 0.7, page: 1 },
              studentId: { value: '2026101', confidence: 0.7, page: 1 },
              jerseyNumber: { value: '7', confidence: 0.7, page: 1 },
              photo: { value: '', confidence: 0.7, page: 1, manuallyConfirmed: false },
              needsManualConfirm: true,
            },
          ],
        },
      ],
    })),
    cancel: jest.fn(async () => ({ success: true })),
    uploadPhoto: jest.fn(async () => ({ url: 'https://example.com/photo.jpg' })),
  },
}));

function TestContainer({
  onImportSuccess,
  onClose,
  onHook,
}: {
  onImportSuccess: any;
  onClose: any;
  onHook: (hook: ReturnType<typeof usePdfImporter>) => void;
}) {
  const hook = usePdfImporter({ onImportSuccess, onClose });
  onHook(hook);
  return null;
}

describe('usePdfImporter Hook 单元测试', () => {
  it('应能够拒绝非 PDF 文件并处理合法 PDF 识别预检', async () => {
    const onImportSuccess = jest.fn();
    const onClose = jest.fn();
    let latestHook: ReturnType<typeof usePdfImporter> | null = null;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <TestContainer
          onImportSuccess={onImportSuccess}
          onClose={onClose}
          onHook={(h) => (latestHook = h)}
        />,
      );
    });

    // 尝试传入非 PDF 文件
    await act(async () => {
      const invalidEvent = {
        target: { files: [new File(['dummy'], 'test.txt', { type: 'text/plain' })] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      latestHook!.handleFileChange(invalidEvent);
    });

    expect(latestHook!.error).toContain('只支持上传 PDF 格式');
    expect(latestHook!.file).toBeNull();

    // 传入合法 PDF 文件
    const pdfFile = new File(['pdf data'], 'registration.pdf', { type: 'application/pdf' });
    await act(async () => {
      const validEvent = {
        target: { files: [pdfFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      latestHook!.handleFileChange(validEvent);
    });

    expect(latestHook!.error).toBeNull();
    expect(latestHook!.file).toBe(pdfFile);

    // 执行解析
    await act(async () => {
      await latestHook!.handleUploadAndPreview();
    });

    expect(pdfImportApi.preview).toHaveBeenCalledWith(pdfFile);
    expect(latestHook!.previewData?.batchId).toBe('batch-123');
    expect(latestHook!.currentTeam?.teamName.value).toBe('测试工程学院');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('在包含未人工确认的低置信度数据时，应阻止提交并支持手动勾选确认后放行', async () => {
    const onImportSuccess = jest.fn();
    const onClose = jest.fn();
    let latestHook: ReturnType<typeof usePdfImporter> | null = null;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <TestContainer
          onImportSuccess={onImportSuccess}
          onClose={onClose}
          onHook={(h) => (latestHook = h)}
        />,
      );
    });

    const pdfFile = new File(['pdf data'], 'registration.pdf', { type: 'application/pdf' });
    await act(async () => {
      latestHook!.handleFileChange({
        target: { files: [pdfFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await latestHook!.handleUploadAndPreview();
    });

    expect(latestHook!.previewData).not.toBeNull();

    // 未勾选确认时尝试提交 -> 应拦截并给出提示
    await act(async () => {
      await latestHook!.handleCommit();
    });

    expect(latestHook!.error).toContain('低置信度数据未确认');
    expect(onImportSuccess).not.toHaveBeenCalled();

    // 勾选核对确认
    await act(async () => {
      latestHook!.handleTogglePlayerConfirm(0);
    });

    // 再次提交 -> 应放行并回调成功
    await act(async () => {
      await latestHook!.handleCommit();
    });

    expect(onImportSuccess).toHaveBeenCalledWith({
      batchId: 'batch-123',
      teams: [
        expect.objectContaining({
          teamName: expect.objectContaining({ value: '测试工程学院' }),
        }),
      ],
    });

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
