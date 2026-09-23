/**
 * 带参数校验的通用并发映射工具。
 *
 * 与原 useTeamEntry 内联实现行为一致：
 * - 保持输入顺序，结果数组索引与 items 一一对应；
 * - 任一 mapper 抛错时，整体 reject（fail-fast 语义由 Promise.all 保证）；
 * - 空数组立即返回空数组，不启动 worker。
 *
 * 新增：参数校验，避免 concurrency 为 0 / 负数 / 非数字时静默异常。
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Array.isArray(items)) {
    throw new TypeError('mapWithConcurrency: items must be an array');
  }
  if (!Number.isFinite(concurrency) || concurrency < 1) {
    throw new RangeError('mapWithConcurrency: concurrency must be a positive number');
  }
  if (typeof mapper !== 'function') {
    throw new TypeError('mapWithConcurrency: mapper must be a function');
  }
  if (items.length === 0) {
    return [];
  }

  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}
