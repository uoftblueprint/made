import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, X, Loader2 } from 'lucide-react';
import { itemsApi } from '../../api/items.api';
import { boxesApi } from '../../api/boxes.api';
import Modal from './Modal';
import Button from './Button';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ScanResult = 
  | { type: 'item'; id: number; title: string; itemCode: string }
  | { type: 'box'; id: number; boxCode: string; label: string }
  | { type: 'not_found' }
  | null;

const ScanModal: React.FC<ScanModalProps> = ({ isOpen, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleClose = () => {
    setInputValue('');
    setResult(null);
    setIsSearching(false);
    onClose();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputValue.trim();
    if (!code) return;

    setIsSearching(true);
    setResult(null);

    try {
      // Try to find an item first
      const item = await itemsApi.getByItemCode(code);
      if (item) {
        setResult({
          type: 'item',
          id: item.id,
          title: item.title,
          itemCode: item.item_code,
        });
        setIsSearching(false);
        return;
      }

      // Try to find a box
      const box = await boxesApi.getByBoxCode(code);
      if (box) {
        setResult({
          type: 'box',
          id: box.id,
          boxCode: box.box_code,
          label: box.label || '',
        });
        setIsSearching(false);
        return;
      }

      // Not found
      setResult({ type: 'not_found' });
    } catch (error) {
      console.error('Scan lookup failed:', error);
      setResult({ type: 'not_found' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleNavigate = () => {
    if (!result || result.type === 'not_found') return;

    if (result.type === 'item') {
      navigate(`/admin/catalogue/${result.id}`);
    } else if (result.type === 'box') {
      navigate(`/admin/boxes/${result.id}`);
    }
    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && result && result.type !== 'not_found') {
      handleNavigate();
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="Scan MADE ID">
      <form onSubmit={handleSearch} className="scan-modal-form">
        <p className="scan-modal-subtitle">
          Scan or enter a MADE ID to quickly find an item or box.
        </p>

        <div className="scan-modal-input-wrapper">
          <Scan size={20} className="scan-modal-icon" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setResult(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter MADE ID (e.g., 24.0001 or 24.01.A43)"
            className="scan-modal-input"
            autoFocus
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                setResult(null);
                inputRef.current?.focus();
              }}
              className="scan-modal-clear"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Result */}
        {isSearching && (
          <div className="scan-modal-result searching">
            <Loader2 size={20} className="scan-modal-spinner" />
            <span>Searching...</span>
          </div>
        )}

        {result?.type === 'not_found' && (
          <div className="scan-modal-result not-found">
            <span className="scan-modal-result-icon">⚠️</span>
            <span>No item or box found with ID "{inputValue}"</span>
          </div>
        )}

        {result?.type === 'item' && (
          <div className="scan-modal-result found" onClick={handleNavigate}>
            <div className="scan-modal-result-info">
              <span className="scan-modal-result-type">Item</span>
              <span className="scan-modal-result-title">{result.title}</span>
              <span className="scan-modal-result-code">{result.itemCode}</span>
            </div>
            <span className="scan-modal-result-action">Press Enter or click to view →</span>
          </div>
        )}

        {result?.type === 'box' && (
          <div className="scan-modal-result found" onClick={handleNavigate}>
            <div className="scan-modal-result-info">
              <span className="scan-modal-result-type">Box</span>
              <span className="scan-modal-result-title">{result.label || result.boxCode}</span>
              <span className="scan-modal-result-code">{result.boxCode}</span>
            </div>
            <span className="scan-modal-result-action">Press Enter or click to view →</span>
          </div>
        )}

        <div className="scan-modal-actions">
          <Button variant="outline-gray" size="md" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={!inputValue.trim() || isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ScanModal;
