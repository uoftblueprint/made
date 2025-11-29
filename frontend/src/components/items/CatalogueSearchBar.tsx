import React from 'react';
import { CATALOGUE_ORDERING_OPTIONS } from '../../lib/constants';
import type { ItemFilter } from '../../lib/filters';

interface SearchBarProps {
    filters: ItemFilter;
    setFilters: React.Dispatch<React.SetStateAction<Partial<ItemFilter>>>;
}

const SearchBar: React.FC<SearchBarProps> = ({ filters, setFilters }) => {

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        setFilters(prev => ({ ...prev, search: value || null }));
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
      <input
        type="text"
        placeholder="Search items..."
        value={filters.search ?? ''}
        onChange={handleSearchChange}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '16px',
          borderRadius: '6px',
          border: '1px solid #ccc',
        }}
      />

      <select
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
        <select
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

export default SearchBar;