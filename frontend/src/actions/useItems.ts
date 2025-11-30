import { useQuery } from '@tanstack/react-query';
import { itemsApi } from '../api/items.api';
import type { ItemFilter } from '../lib/filters';

// Hook to fetch all public items
export const useItems = (filters?: ItemFilter) => {
  return useQuery({
    queryKey: ['items', 'list', filters],
    queryFn: () => itemsApi.getAll(filters),
  });
};