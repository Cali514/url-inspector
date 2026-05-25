import { useState, useEffect, useMemo } from 'react';
import type { ComponentNode } from '../types';
import { parseInlineStyle } from '../utils/api';

interface DesignToolProps {
  selectedNode: ComponentNode | null;
}

const GRADIENT_PRESETS = [
  { name: 'Sunset', from: '#ee9ca7', to: '#ffdde1' },
  { name: 'Ocean', from: '#2193b0', to: '#6dd5ed' },
  { name: 'Purple', from: '#8e2de2', to: '#4a00e0' },
  { name: 'Forest', from: '#134e5e', to: '#71b280' },
  { name: 'Night', from: '#0f0c29', to: '#302b63' },
  { name: 'Warm', from: '#f5af19', to: '#f12711' },
];

const DIRECTION_PRESETS = [
  { label: '→', angle: 90 },
  { label: '↓', angle: 180 },
  { label: '↘', angle: 135 },
  { label: '↗', angle: 45 },
];

export default function DesignTool({ selectedNode }: DesignToolProps) {
  const [bgColor, setBgColor] = useState('#1e2744');
  const [bgMode, setBgMode] = useState<'solid' | 'gradient'>('solid');
  const [gradientFrom, setGradientFrom] = useState('#ee9ca7');
  const [gradientTo, setGradientTo] = useState('#ffdde1');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [padding, setPadding] = useState(0);
  const [margin, setMargin] = useState(0);
  const [width, setWidth] = useState('auto');
  const [height, setHeight] = useState('auto');
  const [minHeight, setMinHeight] = useState('0');
  const [copied, setCopied] = useState(false);

  // Re-initialize when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      const styles = parseInlineStyle(selectedNode.inlineStyle);

      if (styles['background-color']) {
        setBgColor(styles['background-color']);
        setBgMode('solid');
      }
      if (styles['background']) {
        // Check if it's a gradient
        if (styles['background'].includes('gradient')) {
          setBgMode('gradient');
          // Try to extract gradient colors and angle
          const angleMatch = styles['background'].match(/(\d+)deg/);
          if (angleMatch) setGradientAngle(parseInt(angleMatch[1]));
          const colorMatches = styles['background'].match(/#[0-9a-fA-F]{3,8}/g);
          if (colorMatches && colorMatches.length >= 2) {
            setGradientFrom(colorMatches[0]);
            setGradientTo(colorMatches[1]);
          }
        } else {
          setBgColor(styles['background']);
          setBgMode('solid');
        }
      }
      if (styles['background-image'] && styles['background-image'].includes('gradient')) {
        setBgMode('gradient');
        const angleMatch = styles['background-image'].match(/(\d+)deg/);
        if (angleMatch) setGradientAngle(parseInt(angleMatch[1]));
        const colorMatches = styles['background-image'].match(/#[0-9a-fA-F]{3,8}/g);
        if (colorMatches && colorMatches.length >= 2) {
          setGradientFrom(colorMatches[0]);
          setGradientTo(colorMatches[1]);
        }
      }

      if (styles['padding']) {
        const pVal = parseInt(styles['padding']);
        if (!isNaN(pVal)) setPadding(pVal);
      }
      if (styles['margin']) {
        const mVal = parseInt(styles['margin']);
        if (!isNaN(mVal)) setMargin(mVal);
      }
      if (styles['width']) setWidth(styles['width']);
      if (styles['height']) setHeight(styles['height']);
      if (styles['min-height']) setMinHeight(styles['min-height']);
    } else {
      // Reset to defaults
      setBgColor('#1e2744');
      setBgMode('solid');
      setGradientFrom('#ee9ca7');
      setGradientTo('#ffdde1');
      setGradientAngle(135);
      setPadding(0);
      setMargin(0);
      setWidth('auto');
      setHeight('auto');
      setMinHeight('0');
    }
  }, [selectedNode]);

  const previewStyle = useMemo(() => {
    const base: React.CSSProperties = {
      padding: `${padding}px`,
      margin: `${margin}px`,
      width: width === 'auto' ? undefined : width,
      height: height === 'auto' ? undefined : height,
      minHeight: minHeight === '0' ? undefined : minHeight,
    };
    if (bgMode === 'solid') {
      base.background = bgColor;
    } else {
      base.background = `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`;
    }
    return base;
  }, [bgColor, bgMode, gradientFrom, gradientTo, gradientAngle, padding, margin, width, height, minHeight]);

  const generatedCss = useMemo(() => {
    const lines: string[] = [];
    if (bgMode === 'solid') {
      lines.push(`  background: ${bgColor};`);
    } else {
      lines.push(`  background: linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo});`);
    }
    if (padding !== 0) lines.push(`  padding: ${padding}px;`);
    if (margin !== 0) lines.push(`  margin: ${margin}px;`);
    if (width !== 'auto') lines.push(`  width: ${width};`);
    if (height !== 'auto') lines.push(`  height: ${height};`);
    if (minHeight !== '0') lines.push(`  min-height: ${minHeight};`);
    return `element {\n${lines.join('\n')}\n}`;
  }, [bgColor, bgMode, gradientFrom, gradientTo, gradientAngle, padding, margin, width, height, minHeight]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCss);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!selectedNode) {
    return (
      <div className="design-tool">
        <div className="pane-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>Design Tool</span>
        </div>
        <div className="design-empty">
          <p>Select a component to use the design tool</p>
        </div>
      </div>
    );
  }

  return (
    <div className="design-tool">
      <div className="pane-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <span>Design Tool</span>
        <span className="element-badge">{selectedNode.tag}</span>
      </div>
      <div className="design-content">
        {/* PREVIEW */}
        <div className="design-section">
          <div className="design-section-title">Preview</div>
          <div className="design-preview" style={previewStyle}>
            <span className="preview-tag">&lt;{selectedNode.tag}&gt;</span>
          </div>
        </div>

        {/* BACKGROUND */}
        <div className="design-section">
          <div className="design-section-title">Background</div>
          <div className="design-toggle">
            <button
              className={`toggle-option ${bgMode === 'solid' ? 'active' : ''}`}
              onClick={() => setBgMode('solid')}
            >
              Solid
            </button>
            <button
              className={`toggle-option ${bgMode === 'gradient' ? 'active' : ''}`}
              onClick={() => setBgMode('gradient')}
            >
              Gradient
            </button>
          </div>

          {bgMode === 'solid' ? (
            <div className="color-picker-row">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="native-color-picker"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="hex-input"
                placeholder="#000000"
              />
            </div>
          ) : (
            <>
              <div className="gradient-grid">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    className={`gradient-swatch ${gradientFrom === preset.from && gradientTo === preset.to ? 'active' : ''}`}
                    style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
                    onClick={() => { setGradientFrom(preset.from); setGradientTo(preset.to); }}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className="color-picker-row" style={{ marginTop: 8 }}>
                <input
                  type="color"
                  value={gradientFrom}
                  onChange={(e) => setGradientFrom(e.target.value)}
                  className="native-color-picker"
                />
                <input
                  type="text"
                  value={gradientFrom}
                  onChange={(e) => setGradientFrom(e.target.value)}
                  className="hex-input"
                />
                <span className="gradient-arrow">→</span>
                <input
                  type="color"
                  value={gradientTo}
                  onChange={(e) => setGradientTo(e.target.value)}
                  className="native-color-picker"
                />
                <input
                  type="text"
                  value={gradientTo}
                  onChange={(e) => setGradientTo(e.target.value)}
                  className="hex-input"
                />
              </div>
              <div className="direction-btns">
                {DIRECTION_PRESETS.map((dir) => (
                  <button
                    key={dir.angle}
                    className={`direction-btn ${gradientAngle === dir.angle ? 'active' : ''}`}
                    onClick={() => setGradientAngle(dir.angle)}
                    title={`${dir.angle}deg`}
                  >
                    {dir.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* SPACING */}
        <div className="design-section">
          <div className="design-section-title">Spacing</div>
          <div className="spacing-row">
            <label>Padding</label>
            <input
              type="number"
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              className="num-input"
              min={0}
            />
            <span className="unit-label">px</span>
          </div>
          <div className="spacing-row">
            <label>Margin</label>
            <input
              type="number"
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="num-input"
              min={0}
            />
            <span className="unit-label">px</span>
          </div>
        </div>

        {/* SIZE */}
        <div className="design-section">
          <div className="design-section-title">Size</div>
          <div className="size-row">
            <label>Width</label>
            <input
              type="text"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="text-input"
            />
          </div>
          <div className="size-row">
            <label>Height</label>
            <input
              type="text"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="text-input"
            />
          </div>
          <div className="size-row">
            <label>Min Height</label>
            <input
              type="text"
              value={minHeight}
              onChange={(e) => setMinHeight(e.target.value)}
              className="text-input"
            />
          </div>
        </div>

        {/* CSS OUTPUT */}
        <div className="design-section">
          <div className="design-section-title">CSS Output</div>
          <div className="css-output">
            <pre>{generatedCss}</pre>
            <button className="copy-btn" onClick={handleCopy} title="Copy CSS">
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
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
