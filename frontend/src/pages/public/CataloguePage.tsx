import React from 'react';
import { useState } from 'react';
import { useItems, useTestItems } from '../../actions';
import type { ItemFilter } from '../../lib/filters';
import SearchBar from '../../components/items/CatalogueSearchBar';
import ItemList from '../../components/items/ItemList';

const CataloguePage: React.FC = () => {

  const items = useTestItems();
  const firstItem = items.at(0);
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
        {items && <ItemList items={items}/>}
      </div>
    </div>
  );
};

export default CataloguePage;