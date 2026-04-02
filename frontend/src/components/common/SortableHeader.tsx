import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortConfig } from '../../hooks/useSort';

interface SortableHeaderProps<K extends string> {
  label: string;
  sortKey: K;
  sortConfig: SortConfig<K> | null;
  onSort: (key: K) => void;
}

function SortableHeader<K extends string>({
  label,
  sortKey,
  sortConfig,
  onSort,
}: SortableHeaderProps<K>) {
  const isActive = sortConfig?.key === sortKey;

  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {isActive ? (
          sortConfig.direction === 'asc' ? (
            <ArrowUp size={12} />
          ) : (
            <ArrowDown size={12} />
          )
        ) : (
          <ArrowUpDown size={12} style={{ opacity: 0.3 }} />
        )}
      </span>
    </th>
  );
}

export default SortableHeader as <K extends string>(
  props: SortableHeaderProps<K>
) => React.ReactElement;
