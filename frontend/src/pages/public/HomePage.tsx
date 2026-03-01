import React from 'react';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-layout">
      <div className="home-header">
        <h1>Welcome to the Collection Catalog</h1>
        <p className="home-header-subtitle">Browse our available items and see what's currently on the floor.</p>
      </div>

      <div className="home-content">
        <div className="home-search-section">
          <h2>Search & Filter</h2>
          <input 
            type="text" 
            className="home-search-input"
            placeholder="Search by item name, ID, or tag..." 
          />
        </div>

        <div className="home-results-section">
          <h2>Collection Items</h2>
          <p className="home-placeholder-text">[A grid or list of CollectionItem components will be mapped and displayed here]</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;