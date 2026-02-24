import { useState } from 'react';
import { useItems } from '../../actions';
import type { ItemFilter } from '../../lib/filters';
import { CatalogueSearchBar, ItemList } from '../../components/items'
import Button from '../../components/common/Button';
import LabelledText from '../../components/common/LabelledText';

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
    <>
      <div className='flex justify-between'>
        <div>
          <h1 className='title pb-2'>Collection Catalog</h1>
          <p className='subtitle pb-5'>Browse our available items and see what's currently on the floor.</p>
        </div>
        <Button icon='plus' variant='primary' size="lg" onClick={handleAddItem}>Add New Item</Button>
      </div>
      <LabelledText
        stats={[
          { label: "On Floor", value: 2045 },
          { label: "In Storage", value: 43000 },
          { label: "Checked Out", value: 1502 },
          { label: "Total Items", value: 50000 },
        ]}
      />
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
    </>
  );
};

export default CataloguePage;