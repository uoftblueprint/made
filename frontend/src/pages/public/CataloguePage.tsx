import { useState } from 'react';
import { useItems } from '../../actions';
import type { ItemFilter } from '../../lib/filters';
import { CatalogueSearchBar, ItemList } from '../../components/items'
import './CataloguePage.css';

const CataloguePage: React.FC = () => {

  const [filters, setFilters] = useState<ItemFilter>({
    search: null,
    platform: null,
    is_on_floor: null,
    ordering: null,
  });

  const { data: items = [], isLoading, isError } = useItems(filters);

  const handleAddItem = () => {
    
  }

  return (
    <div className="catalogue-public-layout">
      <div className="catalogue-public-header">
        <h1>Collection Catalogue</h1>
        <p className="catalogue-public-header-subtitle">Browse our collection</p>
      </div>

      <div className="catalogue-public-filters">
        <CatalogueSearchBar filters={filters} setFilters={setFilters} />
      </div>

      <div className="catalogue-public-results">
        {isLoading && <p className="catalogue-public-message">Loading...</p>}
        {isError && <p className="catalogue-public-message error">Failed to load items.</p>}
        {!isLoading && !isError && items?.length === 0 && <p className="catalogue-public-message">No items found.</p>}
        {items && items.length > 0 && <ItemList items={items} />}
      </div>
    </>
  );
};

export default CataloguePage;