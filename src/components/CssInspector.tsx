import type { ComponentNode, CssProperty } from '../types';
import { parseInlineStyle } from '../utils/api';

interface CssInspectorProps {
  selectedNode: ComponentNode | null;
}

export default function CssInspector({ selectedNode }: CssInspectorProps) {
  if (!selectedNode) {
    return (
      <div className="css-inspector">
        <div className="pane-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h10M4 17h6" />
          </svg>
          <span>Styles</span>
        </div>
        <div className="css-empty">
          <p>Select a component to inspect its styles</p>
        </div>
      </div>
    );
  }

  const inlineStyles = parseInlineStyle(selectedNode.inlineStyle);
  const properties: CssProperty[] = Object.entries(inlineStyles).map(([property, value]) => ({
    property,
    value,
  }));

  // Also show attributes that might be style-related
  const relevantAttrs: CssProperty[] = [];
  if (selectedNode.attributes.class) {
    relevantAttrs.push({ property: 'class', value: selectedNode.attributes.class });
  }
  if (selectedNode.attributes.id) {
    relevantAttrs.push({ property: 'id', value: selectedNode.attributes.id });
  }
  if (selectedNode.attributes.src) {
    relevantAttrs.push({ property: 'src', value: selectedNode.attributes.src });
  }
  if (selectedNode.attributes.href) {
    relevantAttrs.push({ property: 'href', value: selectedNode.attributes.href });
  }
  if (selectedNode.attributes.alt) {
    relevantAttrs.push({ property: 'alt', value: selectedNode.attributes.alt });
  }

  return (
    <div className="css-inspector">
      <div className="pane-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h10M4 17h6" />
        </svg>
        <span>Styles</span>
        <span className="element-badge">{selectedNode.tag}</span>
      </div>
      <div className="css-content">
        {relevantAttrs.length > 0 && (
          <div className="css-section">
            <div className="css-section-title">Attributes</div>
            {relevantAttrs.map((prop, i) => (
              <div key={i} className="css-row">
                <span className="css-prop">{prop.property}</span>
                <span className="css-val">{prop.value}</span>
              </div>
            ))}
          </div>
        )}
        {properties.length > 0 && (
          <div className="css-section">
            <div className="css-section-title">Inline Styles</div>
            {properties.map((prop, i) => (
              <div key={i} className="css-row">
                <span className="css-prop">{prop.property}</span>
                <span className="css-val">{prop.value}</span>
              </div>
            ))}
          </div>
        )}
        {properties.length === 0 && relevantAttrs.length === 0 && (
          <div className="css-no-styles">
            <p>No inline styles or relevant attributes for this element</p>
          </div>
        )}
      </div>
    </div>
  );
}
