import { useState, useEffect, useMemo } from 'react';
import type { ComponentNode } from '../types';

interface ComponentTreeProps {
  tree: ComponentNode[];
  selectedId: string | null;
  onSelect: (node: ComponentNode | null) => void;
}

// Build a Set of node IDs on the path from root to the selected node
function findAncestorPath(tree: ComponentNode[], targetId: string): Set<string> {
  const path = new Set<string>();
  function walk(nodes: ComponentNode[]): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        path.add(node.id);
        return true;
      }
      if (node.children && walk(node.children)) {
        path.add(node.id);
        return true;
      }
    }
    return false;
  }
  walk(tree);
  return path;
}

// Find a node and its parent
function findNodeAndParent(
  nodes: ComponentNode[],
  targetId: string,
  parent: ComponentNode | null = null
): { node: ComponentNode; parent: ComponentNode | null } | null {
  for (const n of nodes) {
    if (n.id === targetId) return { node: n, parent };
    if (n.children) {
      const result = findNodeAndParent(n.children, targetId, n);
      if (result) return result;
    }
  }
  return null;
}

function ComponentNodeItem({
  node,
  depth,
  selectedId,
  onSelect,
  ancestorPath,
  focused,
}: {
  node: ComponentNode;
  depth: number;
  selectedId: string | null;
  onSelect: (node: ComponentNode | null) => void;
  ancestorPath: Set<string>;
  focused: boolean;
}) {
  const isInPath = ancestorPath.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  // Default open for shallow nodes; when focused, only path nodes are open
  const [isOpen, setIsOpen] = useState(depth < 3);

  // Sync open state when ancestor path changes
  useEffect(() => {
    if (focused) {
      // Expand nodes on the path, collapse others
      setIsOpen(isInPath);
    }
  }, [focused, isInPath, node.id]);

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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
    // Toggle: clicking the already-selected node deselects it
    if (isSelected) {
      onSelect(null);
    } else {
      onSelect(node);
    }
  };

  // Dim nodes not on the path when focused
  const dimmed = focused && !isInPath;

  return (
    <div className="component-node">
      <div
        className={`comp-item ${isSelected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}`}
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
          ancestorPath={ancestorPath}
          focused={focused}
        />
      ))}
    </div>
  );
}

export default function ComponentTree({ tree, selectedId, onSelect }: ComponentTreeProps) {
  const focused = selectedId !== null;

  const ancestorPath = useMemo(() => {
    if (!selectedId) return new Set<string>();
    return findAncestorPath(tree, selectedId);
  }, [tree, selectedId]);

  const selectedInfo = useMemo(() => {
    if (!selectedId) return null;
    return findNodeAndParent(tree, selectedId);
  }, [tree, selectedId]);

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
        {focused && selectedInfo && (
          <span className="focus-badge">
            {selectedInfo.parent
              ? `<${selectedInfo.parent.tag}> → <${selectedInfo.node.tag}>`
              : `<${selectedInfo.node.tag}>`}
          </span>
        )}
        {focused && (
          <button
            className="clear-selection-btn"
            onClick={(e) => { e.stopPropagation(); onSelect(null); }}
            title="Clear selection — show full tree"
          >
            ×
          </button>
        )}
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
              ancestorPath={ancestorPath}
              focused={focused}
            />
          ))
        )}
      </div>
    </div>
  );
}
