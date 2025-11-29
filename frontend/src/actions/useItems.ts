import { useQuery } from '@tanstack/react-query';
import { itemsApi } from '../api/items.api';
import type { PublicCollectionItem } from '../lib/types';

// Hook to fetch all public items
export const useItems = (filters?: {
  platform?: string;
  is_on_floor?: boolean;
  search?: string;
  ordering?: string;
}) => {
  return useQuery({
    queryKey: ['items', 'list', filters], // unique key based on filters
    queryFn: () => itemsApi.getAll(filters),
  });
};

export const useTestItems = () => {

const mockPublicItems: PublicCollectionItem[] = [
    {
        id: 1,
        item_code: 'ITEM-001',
        title: 'Legend of Zelda: Breath of the Wild',
        platform: 'Switch',
        description: 'Open-world adventure game in Hyrule.',
        is_on_floor: true,
    },
    {
        id: 2,
        item_code: 'ITEM-002',
        title: 'Super Mario Odyssey',
        platform: 'Switch',
        description: 'Mario travels across various kingdoms to save Princess Peach.',
        is_on_floor: false,
    },
    {
        id: 3,
        item_code: 'ITEM-003',
        title: 'Halo Infinite',
        platform: 'Xbox',
        description: 'Master Chief returns in this first-person shooter.',
        is_on_floor: true,
    },
    {
        id: 4,
        item_code: 'ITEM-004',
        title: 'Minecraft',
        platform: 'PC',
        description: 'Sandbox building and survival game.',
        is_on_floor: true,
    },
    {
        id: 5,
        item_code: 'ITEM-005',
        title: 'Cyberpunk 2077',
        platform: 'PC',
        description: 'Futuristic open-world RPG in Night City.',
        is_on_floor: false,
    },
    {
        id: 6,
        item_code: 'ITEM-006',
        title: 'God of War',
        platform: 'PS5',
        description: 'Kratos embarks on a journey with his son Atreus.',
        is_on_floor: true,
    },
    {
        id: 7,
        item_code: 'ITEM-007',
        title: 'Elden Ring',
        platform: 'PS5',
        description: 'Open-world action RPG with challenging combat.',
        is_on_floor: true,
    },
    {
        id: 8,
        item_code: 'ITEM-008',
        title: 'Forza Horizon 5',
        platform: 'Xbox',
        description: 'Open-world racing game set in Mexico.',
        is_on_floor: false,
    },
    {
        id: 9,
        item_code: 'ITEM-009',
        title: 'Stardew Valley',
        platform: 'PC',
        description: 'Farming simulation',
        is_on_floor: false,
    }
    ]
    return mockPublicItems
}
