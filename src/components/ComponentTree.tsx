import { useState } from 'react';
import type { ComponentNode } from '../types';

interface ComponentTreeProps {
  tree: ComponentNode[];
  selectedId: string | null;
  onSelect: (node: ComponentNode) => void;
}

function ComponentNodeItem({ node, depth, selectedId, onSelect }: {
  node: ComponentNode;
  depth: number;
  selectedId: string | null;
  onSelect: (node: ComponentNode) => void;
}) {
  const [isOpen, setIsOpen] = useState(depth < 3);

  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  const getTagColor = (tag: string) => {
    if (tag.startsWith('#')) return '#94a3b8';
    const htmlTags = ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'main', 'section', 'article', 'nav', 'header', 'footer', 'aside'];
    const formTags = ['form', 'input', 'button', 'select', 'textarea', 'label'];
    const tableTags = ['table', 'thead', 'tbody', 'tr', 'td', 'th'];

    if (htmlTags.includes(tag.toLowerCase())) return '#34d399';
    if (formTags.includes(tag.toLowerCase())) return '#f472b6';
    if (tableTags.includes(tag.toLowerCase())) return '#a78bfa';
    return '#38bdf8';
  };

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
    onSelect(node);
  };

  return (
    <div className="component-node">
      <div
        className={`comp-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        onClick={handleClick}
      >
        {hasChildren && (
          <span className="chevron">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {isOpen ? (
                <polyline points="6 9 12 15 18 9" />
              ) : (
                <polyline points="9 6 15 12 9 18" />
              )}
            </svg>
          </span>
        )}
        {!hasChildren && <span className="chevron-placeholder" />}
        {node.tag === '#text' ? (
          <span className="text-node">"{node.text}"</span>
        ) : (
          <>
            <span style={{ color: getTagColor(node.tag) }}>&lt;{node.tag}</span>
            {node.attributes.id && (
              <span className="attr-id">#{node.attributes.id}</span>
            )}
            {node.attributes.class && (
              <span className="attr-class">.{node.attributes.class.split(' ')[0]}</span>
            )}
            <span style={{ color: getTagColor(node.tag) }}>&gt;</span>
          </>
        )}
      </div>
      {isOpen && hasChildren && node.children.map((child) => (
        <ComponentNodeItem
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default function ComponentTree({ tree, selectedId, onSelect }: ComponentTreeProps) {
  return (
    <div className="component-tree">
      <div className="pane-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
        <span>Components</span>
      </div>
      <div className="comp-tree-content">
        {tree.length === 0 ? (
          <div className="empty-state small">
            <p>No components to display</p>
          </div>
        ) : (
          tree.map((node) => (
            <ComponentNodeItem
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
