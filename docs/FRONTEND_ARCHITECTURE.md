# Frontend Architecture

This document outlines the frontend architecture and folder structure for the MADE inventory management system.

## Technology Stack

- **Framework**: React 19+ with TypeScript
- **Build Tool**: Vite
- **State Management**: React Query (@tanstack/react-query)
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Testing**: Vitest + React Testing Library

## Project Structure

```
frontend/src/
├── api/                    # API service layer
│   ├── apiClient.ts       # Axios instance with interceptors
│   ├── auth.api.ts        # Authentication endpoints
│   ├── locations.api.ts   # Locations endpoints
│   ├── boxes.api.ts       # Boxes endpoints
│   ├── items.api.ts       # Collection items endpoints
│   ├── requests.api.ts    # Movement requests endpoints
│   └── index.ts           # Centralized exports
│
├── actions/                # Data actions (React Query hooks)
│   ├── useAuth.ts         # Auth queries & mutations
│   ├── useLocations.ts    # Locations queries & mutations
│   ├── useBoxes.ts        # Boxes queries & mutations
│   ├── useItems.ts        # Items queries & mutations
│   ├── useRequests.ts     # Requests queries & mutations
│   └── index.ts           # Centralized exports
│
├── contexts/               # React Context providers
│   ├── AuthContext.tsx    # Authentication context
│   └── index.ts           # Centralized exports
│
├── components/             # React components
│   ├── common/            # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   ├── layout/            # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── index.ts
│   ├── items/             # Item-specific components
│   │   ├── ItemCard.tsx
│   │   ├── ItemList.tsx
│   │   ├── ItemForm.tsx
│   │   └── index.ts
│   └── requests/          # Request-specific components
│       ├── RequestCard.tsx
│       ├── RequestList.tsx
│       ├── RequestForm.tsx
│       └── index.ts
│
├── pages/                  # Page components
│   ├── admin/             # Admin-only pages
│   │   └── AdminDashboard.tsx
│   └── public/            # Public pages
│       └── HomePage.tsx
│
├── lib/                    # Shared library code
│   ├── types.ts           # TypeScript type definitions
│   └── constants.ts       # Application constants
│
├── utils/                  # Utility functions
│   ├── formatters.ts      # Date, number formatting
│   ├── validators.ts      # Form validation
│   ├── helpers.ts         # General helpers
│   └── index.ts           # Centralized exports
│
├── assets/                 # Static assets
│   └── react.svg
│
└── test/                   # Test utilities
    └── setup.ts
```

## Architecture Patterns

### 1. **API Service Layer** (`src/api/`)

Encapsulates all HTTP requests to the backend. Each domain has its own API file.

**Pattern:**
```typescript
// api/items.api.ts
export const itemsApi = {
  getAll: async (params) => { /* ... */ },
  getById: async (id) => { /* ... */ },
  create: async (data) => { /* ... */ },
  update: async (id, data) => { /* ... */ },
  delete: async (id) => { /* ... */ },
};
```

**Benefits:**
- Centralized API logic
- Easy to mock for testing
- Type-safe with TypeScript
- Reusable across components

### 2. **Actions** (`src/actions/`)

React Query hooks for data fetching and mutations (called "actions" to emphasize their role in performing data operations). Handles caching, loading states, and error handling.

**Pattern:**
```typescript
// actions/useItems.ts
export const useItems = (params) => {
  return useQuery({
    queryKey: ['items', 'list', params],
    queryFn: () => itemsApi.getAll(params),
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => itemsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};
```

**Benefits:**
- Automatic caching and refetching
- Loading and error states handled
- Optimistic updates support
- Cache invalidation on mutations

### 3. **Context Providers** (`src/contexts/`)

Global state management using React Context API.

**Pattern:**
```typescript
// contexts/AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const { data: user, isLoading } = useCurrentUser();
  
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
```

**Benefits:**
- Avoids prop drilling
- Centralized auth state
- Easy to consume with hooks

### 4. **Component Organization**

Components are organized by domain and reusability:

- **common/**: Reusable UI components (buttons, inputs, modals)
- **layout/**: Page layout components (header, footer, sidebar)
- **items/**: Item-specific business logic components
- **requests/**: Request-specific business logic components

**Pattern:**
```typescript
// components/items/ItemCard.tsx
export const ItemCard = ({ item }) => {
  // Component logic
};

// components/items/index.ts
export { ItemCard } from './ItemCard';
export { ItemList } from './ItemList';
export { ItemForm } from './ItemForm';
```

### 5. **Type Definitions** (`src/lib/types.ts`)

Centralized TypeScript interfaces matching backend models.

**Pattern:**
```typescript
export interface CollectionItem {
  id: number;
  item_code: string;
  title: string;
  // ... other fields
}

export interface CreateCollectionItemDto {
  item_code: string;
  title: string;
  // ... other fields
}
```

### 6. **Utility Functions** (`src/utils/`)

Pure functions for common operations:

- **formatters.ts**: Date/time formatting, currency, etc.
- **validators.ts**: Form validation logic
- **helpers.ts**: General utility functions

## Data Flow

```
Component
    ↓
Action (React Query Hook)
    ↓
API Service Layer
    ↓
Axios Client (with interceptors)
    ↓
Backend API
```

**Example:**
```typescript
// In a component
const ItemsList = () => {
  const { data, isLoading, error } = useItems({ page: 1 });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data.results.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
};
```

## Authentication Flow

1. User logs in via `useLogin()` hook
2. Token stored in localStorage
3. `apiClient` interceptor adds token to all requests
4. `AuthProvider` fetches current user on mount
5. Components use `useAuth()` to access user state

## State Management Strategy

- **Server State**: Managed by React Query (API data)
- **Global State**: Managed by Context API (auth, theme)
- **Local State**: Managed by useState (form inputs, UI state)

## Best Practices

### 1. **Always use actions for data fetching**
```typescript
// ✅ Good
const { data } = useItems();

// ❌ Bad
const [data, setData] = useState([]);
useEffect(() => {
  itemsApi.getAll().then(setData);
}, []);
```

### 2. **Invalidate queries after mutations**
```typescript
const { mutate } = useCreateItem();

const handleCreate = (data) => {
  mutate(data, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};
```

### 3. **Use TypeScript interfaces**
```typescript
// ✅ Good
const createItem = (data: CreateCollectionItemDto) => { /* ... */ };

// ❌ Bad
const createItem = (data: any) => { /* ... */ };
```

### 4. **Centralize exports**
```typescript
// actions/index.ts
export * from './useAuth';
export * from './useItems';

// Usage
import { useAuth, useItems } from '@/actions';
```

### 5. **Keep components focused**
- One component per file
- Single responsibility
- Extract complex logic to actions
- Keep render logic clean

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

## Testing Strategy

- **Unit Tests**: Test utility functions and actions
- **Component Tests**: Test component rendering and interactions
- **Integration Tests**: Test full user flows

```typescript
// Example test
describe('useItems', () => {
  it('should fetch items', async () => {
    const { result } = renderHook(() => useItems());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

## Key Concepts

### React Query Query Keys

Query keys are used for caching and invalidation:

```typescript
['items']                          // All items queries
['items', 'list']                  // List queries
['items', 'list', { page: 1 }]     // Specific list query
['items', 123]                     // Single item query
['items', 123, 'history']          // Item history query
```

### API Client Interceptors

The `apiClient` automatically:
- Adds authentication token to requests
- Handles common error responses
- Logs requests in development

### Role-Based Access

Use the `useAuth` hook to check permissions:

```typescript
const { isAdmin, isAuthenticated } = useAuth();

if (!isAuthenticated) return <LoginPage />;
if (!isAdmin) return <AccessDenied />;
```

## Future Enhancements

- [ ] Add error boundary components
- [ ] Implement optimistic updates
- [ ] Add loading skeletons
- [ ] Implement infinite scroll with React Query
- [ ] Add toast notifications
- [ ] Implement form validation with react-hook-form
- [ ] Add E2E tests with Playwright

## Related Documentation

- [Backend API Documentation](../backend/README.md)
- [Contributing Guidelines](../contribution_guidelines.md)
- [Docker Setup](../docker-compose.yml)
