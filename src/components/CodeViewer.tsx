import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import type { FileNode } from '../types';

interface CodeViewerProps {
  file: FileNode | null;
}

export default function CodeViewer({ file }: CodeViewerProps) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  const language = file?.fileType === 'css' ? 'css' : file?.fileType === 'js' ? 'javascript' : 'markup';
  const content = file?.content || '';

  useEffect(() => {
    if (codeRef.current && content) {
      try {
        const grammar = Prism.languages[language];
        if (grammar) {
          codeRef.current.innerHTML = Prism.highlight(content, grammar, language);
        }
      } catch {
        codeRef.current.textContent = content;
      }
    }
  }, [content, language]);

  const handleCopy = async () => {
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = content.split('\n');

  if (!file) {
    return (
      <div className="code-viewer">
        <div className="pane-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span>Code Viewer</span>
        </div>
        <div className="code-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="1.5">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <p>Select a file from the explorer to view its source code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="code-viewer">
      <div className="pane-header">
        <div className="header-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span>{file.name}</span>
        </div>
        <button className="copy-btn" onClick={handleCopy} title="Copy code">
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>
      <div className="code-content">
        <div className="line-numbers">
          {lines.map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <pre className="code-pre"><code ref={codeRef} className={`language-${language}`}>{content}</code></pre>
      </div>
    </div>
  );
}
