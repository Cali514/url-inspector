import { useState } from 'react';
import type { FileNode } from '../types';

interface FileTreeProps {
  files: FileNode[];
  selectedFile: FileNode | null;
  onSelectFile: (file: FileNode) => void;
}

function getFileIcon(fileType?: string) {
  switch (fileType) {
    case 'html':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 'css':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
          <path d="M4 7h16M4 12h10M4 17h6" />
        </svg>
      );
    case 'js':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    case 'svg':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
  }
}

function FolderIcon({ isOpen }: { isOpen: boolean }) {
  return isOpen ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return isOpen ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function FileTreeNode({ node, depth, selectedFile, onSelectFile }: {
  node: FileNode;
  depth: number;
  selectedFile: FileNode | null;
  onSelectFile: (file: FileNode) => void;
}) {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? false);

  const isSelected = selectedFile?.name === node.name && selectedFile?.type === node.type;

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node);
    }
  };

  return (
    <div className="file-tree-node">
      <div
        className={`tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' && (
          <span className="chevron">
            <ChevronIcon isOpen={isOpen} />
          </span>
        )}
        {node.type === 'folder' ? (
          <span className="item-icon">
            <FolderIcon isOpen={isOpen} />
          </span>
        ) : (
          <span className="item-icon">
            {getFileIcon(node.fileType)}
          </span>
        )}
        <span className="item-name">{node.name}</span>
      </div>
      {node.type === 'folder' && isOpen && node.children?.map((child, idx) => (
        <FileTreeNode
          key={`${child.name}-${idx}`}
          node={child}
          depth={depth + 1}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  );
}

export default function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
  return (
    <div className="file-tree">
      <div className="pane-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span>Explorer</span>
      </div>
      <div className="file-tree-content">
        {files.length === 0 ? (
          <div className="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p>Enter a URL and click Scan to explore files</p>
          </div>
        ) : (
          files.map((node, idx) => (
            <FileTreeNode
              key={`${node.name}-${idx}`}
              node={node}
              depth={0}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          ))
        )}
      </div>
    </div>
  );
}
