import { useState, useCallback } from 'react';
import Header from './components/Header';
import FileTree from './components/FileTree';
import CodeViewer from './components/CodeViewer';
import ComponentTree from './components/ComponentTree';
import CssInspector from './components/CssInspector';
import ResizableSplit from './components/ResizableSplit';
import type { FileNode, ComponentNode, ViewportMode, ParsedResult } from './types';
import { fetchUrl, parseHtml, buildFileTree } from './utils/api';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportMode>({ type: 'desktop', width: 1440 });
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [componentTree, setComponentTree] = useState<ComponentNode[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ComponentNode | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  const handleScan = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setSelectedFile(null);
    setSelectedComponent(null);
    setComponentTree([]);
    setFiles([]);

    try {
      const fetchResult = await fetchUrl(url);
      setCurrentUrl(fetchResult.url);

      let parsed: ParsedResult;
      try {
        parsed = await parseHtml(fetchResult.html);
        console.log('[App] Parse success, component tree nodes:', parsed.componentTree?.length);
      } catch (parseErr) {
        // If server parse fails, build minimal structure on client
        console.warn('[App] Parse failed, falling back to empty tree:', parseErr);
        parsed = {
          fileTree: { cssFiles: [], jsFiles: [], inlineStyles: [], inlineScripts: [] },
          componentTree: [],
        };
      }

      const fileTree = buildFileTree(fetchResult.html, parsed);
      setFiles(fileTree);
      setComponentTree(parsed.componentTree);

      // Auto-select the HTML file
      if (fileTree.length > 0 && fileTree[0].type === 'file') {
        setSelectedFile(fileTree[0]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className={`app ${viewport.type}`}>
      <Header
        onScan={handleScan}
        loading={loading}
        viewport={viewport}
        onViewportChange={setViewport}
      />
      {error && (
        <div className="error-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">&times;</button>
        </div>
      )}
      {currentUrl && (
        <div className="url-bar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span className="url-display">{currentUrl}</span>
        </div>
      )}
      <div className="workspace">
        <ResizableSplit
          direction="horizontal"
          initialSizes={[0.2, 0.45, 0.35]}
          minSizes={[0.12, 0.2, 0.15]}
        >
          <FileTree
            files={files}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />
          <CodeViewer file={selectedFile} />
          <ResizableSplit
            direction="vertical"
            initialSizes={[0.6, 0.4]}
            minSizes={[0.2, 0.15]}
            className="right-column-split"
          >
            <ComponentTree
              tree={componentTree}
              selectedId={selectedComponent?.id ?? null}
              onSelect={setSelectedComponent}
            />
            <CssInspector selectedNode={selectedComponent} />
          </ResizableSplit>
        </ResizableSplit>
      </div>
    </div>
  );
}
