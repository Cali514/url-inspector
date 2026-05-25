import type { FetchResult, ParsedResult, FileNode } from '../types';

export async function fetchUrl(url: string): Promise<FetchResult> {
  const response = await fetch(`/api/fetch?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Fetch failed' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function parseHtml(html: string): Promise<ParsedResult> {
  const response = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Parse failed' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export function buildFileTree(
  html: string,
  data: ParsedResult
): FileNode[] {
  const root: FileNode[] = [];

  // Main HTML file
  const htmlFile: FileNode = {
    name: 'index.html',
    type: 'file',
    fileType: 'html',
    content: html,
    children: [],
  };
  root.push(htmlFile);

  // CSS files folder
  if (data.fileTree.cssFiles.length > 0 || data.fileTree.inlineStyles.length > 0) {
    const cssFolder: FileNode = {
      name: 'styles',
      type: 'folder',
      children: [],
      isOpen: true,
    };

    data.fileTree.cssFiles.forEach((f) => {
      cssFolder.children!.push({
        name: f.name,
        type: 'file',
        fileType: 'css',
        href: f.href,
        content: `/* External stylesheet: ${f.href} */`,
      });
    });

    data.fileTree.inlineStyles.forEach((f) => {
      cssFolder.children!.push({
        name: f.name,
        type: 'file',
        fileType: 'css',
        content: f.content,
      });
    });

    root.push(cssFolder);
  }

  // JS files folder
  if (data.fileTree.jsFiles.length > 0 || data.fileTree.inlineScripts.length > 0) {
    const jsFolder: FileNode = {
      name: 'scripts',
      type: 'folder',
      children: [],
      isOpen: true,
    };

    data.fileTree.jsFiles.forEach((f) => {
      jsFolder.children!.push({
        name: f.name,
        type: 'file',
        fileType: 'js',
        href: f.src,
        content: `// External script: ${f.src}`,
      });
    });

    data.fileTree.inlineScripts.forEach((f) => {
      jsFolder.children!.push({
        name: f.name,
        type: 'file',
        fileType: 'js',
        content: f.content,
      });
    });

    root.push(jsFolder);
  }

  return root;
}

export function parseInlineStyle(styleStr: string): Record<string, string> {
  if (!styleStr) return {};
  const result: Record<string, string> = {};
  const parts = styleStr.split(';').filter(Boolean);
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx > 0) {
      const prop = part.substring(0, colonIdx).trim();
      const val = part.substring(colonIdx + 1).trim();
      result[prop] = val;
    }
  }
  return result;
}
