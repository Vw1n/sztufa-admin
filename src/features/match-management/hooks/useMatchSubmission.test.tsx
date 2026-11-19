import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { useMatchSubmission } from './useMatchSubmission';
import { formDraftApi } from '../../../api/form-draft.service';
import { MatchFormData } from '../../../types';

jest.mock('../../../api/service', () => ({ matchApi: { create: jest.fn() }, teamApi: { getById: jest.fn() } }));
jest.mock('../../../api/form-draft.service', () => ({ formDraftApi: { saveDraft: jest.fn(), materializeDraft: jest.fn() } }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });
const form = { seasonId: 'season-1', homeTeamScore: '0', awayTeamScore: '0' } as MatchFormData;

async function withSubmission(run: (get: () => ReturnType<typeof useMatchSubmission>) => Promise<void>) {
  let result: ReturnType<typeof useMatchSubmission>;
  const root = createRoot(document.createElement('div'));
  function Harness() { result = useMatchSubmission(); return null; }
  try { await act(async () => root.render(<Harness />)); await run(() => result!); }
  finally { await act(async () => root.unmount()); }
}

it('超管草稿也拒绝小数比分，不把1.5保存成1', async () => {
  await withSubmission(async (get) => {
    await act(async () => get().handleSubmit({ preventDefault() {} } as React.FormEvent, { ...form, homeTeamScore: '1.5' }, []));
    expect(formDraftApi.saveDraft).not.toHaveBeenCalled();
    expect(get().error).toBe('主队得分必须是非负整数');
  });
});

it('只保存了草稿时不提示正式录入成功，也不清空阵容', async () => {
  jest.mocked(formDraftApi.saveDraft).mockResolvedValue({ draftId: 'draft-1' } as never);
  jest.mocked(formDraftApi.materializeDraft).mockResolvedValue({ success: false, error: '信息不完整，已保存为草稿' });
  await withSubmission(async (get) => {
    const onSuccess = jest.fn();
    await act(async () => get().handleSubmit({ preventDefault() {} } as React.FormEvent, form, [], onSuccess));
    expect(get().isSaved).toBe(false);
    expect(get().error).toContain('已保存为草稿');
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
