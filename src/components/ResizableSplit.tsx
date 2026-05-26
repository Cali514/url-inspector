import { useRef, useCallback, useState, useEffect } from 'react';

interface ResizableSplitProps {
  children: React.ReactNode[];
  direction?: 'horizontal' | 'vertical';
  initialSizes?: number[];
  minSizes?: number[];
  className?: string;
}

export default function ResizableSplit({
  children,
  direction = 'horizontal',
  initialSizes,
  minSizes,
  className = '',
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultSizes = children.map(() => 1 / children.length);
  const [sizes, setSizes] = useState(initialSizes || defaultSizes);
  const draggingIndex = useRef<number | null>(null);
  const startRef = useRef({ x: 0, sizes: [] as number[] });

  // Re-initialize sizes when initialSizes prop changes
  useEffect(() => {
    if (initialSizes) {
      setSizes(initialSizes);
    }
  }, [initialSizes]);

  const getMinSize = (i: number) => (minSizes ? minSizes[i] : 0.08);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (draggingIndex.current === null || !containerRef.current) return;

      const i = draggingIndex.current;
      const rect = containerRef.current.getBoundingClientRect();
      const totalSize = direction === 'horizontal' ? rect.width : rect.height;
      const delta = (direction === 'horizontal' ? e.clientX : e.clientY) - startRef.current.x;
      const deltaRatio = delta / totalSize;

      setSizes((prev) => {
        const newSizes = [...prev];
        let a = startRef.current.sizes[i] + deltaRatio;
        let b = startRef.current.sizes[i + 1] - deltaRatio;
        const minA = getMinSize(i);
        const minB = getMinSize(i + 1);

        if (a < minA) {
          b -= minA - a;
          a = minA;
        }
        if (b < minB) {
          a -= minB - b;
          b = minB;
        }

        if (a >= minA && b >= minB) {
          newSizes[i] = a;
          newSizes[i + 1] = b;
        }
        return newSizes;
      });
    },
    [direction]
  );

  const handleMouseUp = useCallback(() => {
    draggingIndex.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const onMouseDown = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      draggingIndex.current = index;
      startRef.current = {
        x: direction === 'horizontal' ? e.clientX : e.clientY,
        sizes: [...sizes],
      };
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [sizes, direction]
  );

  const isDragging = draggingIndex.current !== null;

  return (
    <div
      ref={containerRef}
      className={`resizable-split ${direction} ${className} ${isDragging ? 'dragging' : ''}`}
    >
      {children.map((child, i) => (
        <div key={i} className="split-pane" style={{ flex: sizes[i] }}>
          {child}
          {i < children.length - 1 && (
            <div
              className={`resize-handle ${direction}`}
              onMouseDown={(e) => onMouseDown(i, e)}
            >
              <div className="handle-line" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
