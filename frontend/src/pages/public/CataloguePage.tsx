import React from 'react';
import { useState } from 'react';
import { useItems, useTestItems } from '../../actions';
import type { ItemFilter } from '../../lib/filters';
import SearchBar from '../../components/items/CatalogueSearchBar';

const CataloguePage: React.FC = () => {

  const items = useTestItems();
  const [filters, setFilters] = useState<ItemFilter>({
  search: null,
  platform: null,
  is_on_floor: null,
  ordering: null,
});
    
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to the Collection Catalog hi hi hi this is the catalogue page</h1>
      <p>Browse our available items and see what's currently on the floor.</p>
      
      <div className="search-filter-section" style={{ margin: '2rem 0', width: "auto" }}>
        <h2>Search & Filter</h2>
        <SearchBar filters={filters} setFilters={setFilters}></SearchBar>
      </div>

      <div className="catalog-results-section">
        <h2>Collection Items</h2>
        <p><i>[A grid or list of CollectionItem components will be mapped and displayed here]</i></p>
      </div>
    </div>
  );
};

export default CataloguePage;