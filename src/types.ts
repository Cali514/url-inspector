export interface FileNode {
  name: string;
  type: 'folder' | 'file';
  fileType?: 'html' | 'css' | 'js' | 'svg' | 'json' | 'other';
  content?: string;
  href?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface ComponentNode {
  id: string;
  tag: string;
  attributes: Record<string, string>;
  children: ComponentNode[];
  text?: string;
  depth: number;
  inlineStyle: string;
}

export interface ParsedResult {
  fileTree: {
    cssFiles: { name: string; href: string }[];
    jsFiles: { name: string; src: string }[];
    inlineStyles: { name: string; content: string }[];
    inlineScripts: { name: string; content: string }[];
  };
  componentTree: ComponentNode[];
}

export interface FetchResult {
  html: string;
  url: string;
  status: number;
}

export interface ViewportMode {
  type: 'desktop' | 'mobile';
  width: number;
}

export interface CssProperty {
  property: string;
  value: string;
}
