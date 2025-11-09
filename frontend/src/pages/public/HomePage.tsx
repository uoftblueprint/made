import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to the Collection Catalog</h1>
      <p>Browse our available items and see what's currently on the floor.</p>
      
      <div className="search-filter-section" style={{ margin: '2rem 0' }}>
        <h2>Search & Filter</h2>
        <input 
          type="text" 
          placeholder="Search by item name, ID, or tag..." 
          style={{ width: '100%', maxWidth: '500px', padding: '10px' }}
        />
      </div>

      <div className="catalog-results-section">
        <h2>Collection Items</h2>
        <p><i>[A grid or list of CollectionItem components will be mapped and displayed here]</i></p>
      </div>
    </div>
  );
};

export default HomePage;