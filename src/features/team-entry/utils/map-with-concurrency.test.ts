import { describe, expect, it } from '@jest/globals';
import { mapWithConcurrency } from './map-with-concurrency';

describe('mapWithConcurrency', () => {
  it('空数组立即返回空数组', async () => {
    const mapper = jest.fn(async () => 1);
    const result = await mapWithConcurrency([], 4, mapper);
    expect(result).toEqual([]);
    expect(mapper).not.toHaveBeenCalled();
  });

  it('保持输入顺序', async () => {
    const result = await mapWithConcurrency([1, 2, 3], 2, async (item) => item * 10);
    expect(result).toEqual([10, 20, 30]);
  });

  it('并发度不超过 items 长度', async () => {
    let active = 0;
    let maxActive = 0;
    const result = await mapWithConcurrency([1, 2, 3], 10, async (item) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active--;
      return item;
    });
    expect(result).toEqual([1, 2, 3]);
    expect(maxActive).toBe(3);
  });

  it('限制并发数', async () => {
    let active = 0;
    let maxActive = 0;
    await mapWithConcurrency([1, 2, 3, 4, 5], 2, async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active--;
    });
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('mapper 抛出错误时整体 reject', async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (item) => {
        if (item === 2) throw new Error('fail at 2');
        return item;
      }),
    ).rejects.toThrow('fail at 2');
  });

  it('items 非数组时抛 TypeError', async () => {
    await expect(mapWithConcurrency(null as unknown as [], 2, async () => 1)).rejects.toThrow(
      'items must be an array',
    );
  });

  it('concurrency 非正数时抛 RangeError', async () => {
    await expect(mapWithConcurrency([1], 0, async () => 1)).rejects.toThrow(
      'concurrency must be a positive number',
    );
    await expect(mapWithConcurrency([1], -1, async () => 1)).rejects.toThrow(
      'concurrency must be a positive number',
    );
  });

  it('mapper 非函数时抛 TypeError', async () => {
    await expect(
      mapWithConcurrency([1], 2, 'not-a-function' as unknown as () => Promise<number>),
    ).rejects.toThrow('mapper must be a function');
  });
});
