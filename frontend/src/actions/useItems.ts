import { useQuery } from '@tanstack/react-query';
import { itemsApi } from '../api/items.api';
import type { ItemFilter } from '../lib/filters';

export const useItems = (filters?: ItemFilter) => {
  return useQuery({
    queryKey: ['items', 'list', filters],
    queryFn: () => itemsApi.getAll(filters), // Use the updated `itemsApi.getAll`
  });
};