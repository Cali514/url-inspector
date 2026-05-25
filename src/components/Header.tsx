import { useState } from 'react';
import type { ViewportMode } from '../types';

interface HeaderProps {
  onScan: (url: string) => void;
  loading: boolean;
  viewport: ViewportMode;
  onViewportChange: (v: ViewportMode) => void;
}

export default function Header({ onScan, loading, viewport, onViewportChange }: HeaderProps) {
  const [url, setUrl] = useState('https://example.com');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onScan(url.trim());
    }
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="brand-text">URL Inspector</span>
      </div>
      <form className="header-form" onSubmit={handleSubmit}>
        <div className="url-input-wrapper">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <input
            type="text"
            className="url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to inspect..."
            disabled={loading}
          />
        </div>
        <button type="submit" className="scan-btn" disabled={loading}>
          {loading ? (
            <span className="spinner" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          )}
          <span>{loading ? 'Scanning...' : 'Scan URL'}</span>
        </button>
      </form>
      <div className="viewport-toggle">
        <button
          className={`toggle-btn ${viewport.type === 'desktop' ? 'active' : ''}`}
          onClick={() => onViewportChange({ type: 'desktop', width: 1440 })}
          title="Desktop view"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </button>
        <button
          className={`toggle-btn ${viewport.type === 'mobile' ? 'active' : ''}`}
          onClick={() => onViewportChange({ type: 'mobile', width: 375 })}
          title="Mobile view"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
}
