import { useQuery } from '@tanstack/react-query';
import { publicItemsApi, itemsApi } from '../api/items.api';
import type { ItemFilter } from '../lib/filters';

export const usePublicItems = (filters?: ItemFilter) => {
  return useQuery({
    queryKey: ['public-items', filters],
    queryFn: () => publicItemsApi.getAll(filters),
  });
};

export const useAdminItems = (filters?: ItemFilter) => {
  return useQuery({
    queryKey: ['admin-items', filters],
    queryFn: () => itemsApi.getAll(filters),
  });
};