import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<K extends string> {
  key: K;
  direction: SortDirection;
}

export function useSort<T, K extends string>(
  items: T[],
  getValueForKey: (item: T, key: K) => string | number | boolean | null | undefined,
  defaultSort?: SortConfig<K>
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<K> | null>(defaultSort ?? null);

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;

    return [...items].sort((a, b) => {
      const aVal = getValueForKey(a, sortConfig.key);
      const bVal = getValueForKey(b, sortConfig.key);

      // nulls/undefined last
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp: number;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
      } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        cmp = (aVal === bVal) ? 0 : aVal ? -1 : 1;
      } else {
        cmp = Number(aVal) - Number(bVal);
      }

      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [items, sortConfig, getValueForKey]);

  const requestSort = (key: K) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  return { sortedItems, sortConfig, requestSort };
}
