// @jest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, jest } from '@jest/globals';
import { useExcelImporter } from './useExcelImporter';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../utils/imageUpload', () => ({
  uploadImageFile: jest.fn(async () => 'https://example.com/uploaded.jpg'),
}));

function TestContainer({
  onImport,
  onHook,
}: {
  onImport: any;
  onHook: (hook: ReturnType<typeof useExcelImporter>) => void;
}) {
  const hook = useExcelImporter({ onImport });
  onHook(hook);
  return null;
}

describe('useExcelImporter Hook 单元测试', () => {
  it('应能够正确验证 .xlsx 与 .xls Excel 文件类型并拒绝非法类型', async () => {
    const onImport = jest.fn();
    let latestHook: ReturnType<typeof useExcelImporter> | null = null;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<TestContainer onImport={onImport} onHook={(h) => (latestHook = h)} />);
    });

    // 非 Excel 文件 (.png)
    await act(async () => {
      latestHook!.handleFileChange({
        target: { files: [new File(['dummy'], 'test.png', { type: 'image/png' })] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(latestHook!.error).not.toBeNull();
    expect(latestHook!.file).toBeNull();

    // 合法 .xlsx 文件
    const xlsxFile = new File(['excel data'], 'players.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await act(async () => {
      latestHook!.handleFileChange({
        target: { files: [xlsxFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(latestHook!.error).toBeNull();
    expect(latestHook!.file).toBe(xlsxFile);

    // 合法 .xls 文件 (旧版 Excel)
    const xlsFile = new File(['excel legacy data'], 'players.xls', {
      type: 'application/vnd.ms-excel',
    });
    await act(async () => {
      latestHook!.handleFileChange({
        target: { files: [xlsFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(latestHook!.error).toBeNull();
    expect(latestHook!.file).toBe(xlsFile);

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('批量选择非图片文件时应给出明确提示', async () => {
    const onImport = jest.fn();
    let latestHook: ReturnType<typeof useExcelImporter> | null = null;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<TestContainer onImport={onImport} onHook={(h) => (latestHook = h)} />);
    });

    await act(async () => {
      await latestHook!.handleBatchPhotosUpload({
        target: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })], value: '' },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(latestHook!.batchMatchingStatus).toContain('均非有效图片格式');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
