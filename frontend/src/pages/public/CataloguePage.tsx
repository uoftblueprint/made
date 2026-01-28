import { useState } from 'react';
import { useItems } from '../../actions';
import type { ItemFilter } from '../../lib/filters';
import { CatalogueSearchBar, ItemList } from '../../components/items'

const CataloguePage: React.FC = () => {

  const [filters, setFilters] = useState<ItemFilter>({
    search: null,
    platform: null,
    is_on_floor: null,
    ordering: null,
  });

  const { data: items = [], isLoading, isError } = useItems(filters);
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to the Collection Catalog</h1>
      <p>Browse our available items and see what's currently on the floor.</p>
      <div className="search-filter-section" style={{ margin: '2rem 0', width: "auto" }}>
        <h2>Search & Filter</h2>
        <CatalogueSearchBar filters={filters} setFilters={setFilters} />
      </div>
      <div className="catalog-results-section">
        <h2>Collection Items</h2>
        {isLoading && <p>Loading items...</p>}
        {isError && <p>Failed to load items.</p>}
        {!isLoading && items?.length === 0 && <p>No items found.</p>}
        {items && items.length > 0 && <ItemList items={items} />}
      </div>
    </div>
  );
};

export default CataloguePage;