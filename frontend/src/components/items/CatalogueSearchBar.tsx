import React, { useState, useEffect } from 'react';
import { CATALOGUE_ORDERING_OPTIONS } from '../../lib/constants';
import type { ItemFilter } from '../../lib/filters';

interface SearchBarProps {
  filters: ItemFilter;
  setFilters: React.Dispatch<React.SetStateAction<ItemFilter>>;
}

const CatalogueSearchBar: React.FC<SearchBarProps> = ({ filters, setFilters }) => {

  const [searchValue, setSearchValue] = useState(filters.search ?? '');

  useEffect(() => { // debounce the search feature
    const handler = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchValue.trim() || null
      }));
    }, 300);

    return () => clearTimeout(handler);
  }, [searchValue, setFilters]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setSearchValue(value);
  };

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value.trim();
    setFilters(prev => ({ ...prev, platform: value || null }));
  };

  const handleFloorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      is_on_floor: e.target.checked ? true : null,
    }));
  };

  const handleOrderingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value.trim();
    setFilters(prev => ({ ...prev, ordering: value || null }));
  };


  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '600px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="catalogue-search-input" style={{ fontSize: '14px' }}>
          Search items
        </label>
        <input
          id="catalogue-search-input"
          type="text"
          placeholder="Search items..."
          value={searchValue}
          onChange={handleSearchChange}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '16px',
            borderRadius: '6px',
            border: '1px solid #ccc',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="catalogue-platform-select" style={{ fontSize: '14px' }}>
          Platform
        </label>
        <select
          id="catalogue-platform-select"
          value={filters.platform ?? ''}
          onChange={handlePlatformChange}
          style={{
            padding: '10px 12px',
            fontSize: '16px',
            borderRadius: '6px',
            border: '1px solid #ccc',
          }}
        >
          <option value="">All Platforms</option>
          <option value="PC">PC</option>
          <option value="Switch">Switch</option>
          <option value="Xbox">Xbox</option>
          <option value="PS5">PS5</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="catalogue-ordering-select" style={{ fontSize: '14px' }}>
          Sort by
        </label>
        <select
          id="catalogue-ordering-select"
          value={filters.ordering ?? ''}
          onChange={handleOrderingChange}
          style={{
            padding: '10px 12px',
            fontSize: '16px',
            borderRadius: '6px',
            border: '1px solid #ccc',
          }}
        >
          <option value="">Default Order</option>
          {CATALOGUE_ORDERING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
        <input
          type="checkbox"
          checked={filters.is_on_floor ?? false}
          onChange={handleFloorChange}
        />
        On Floor
      </label>
    </div>
  );
}

export default CatalogueSearchBar;