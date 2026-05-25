import express from 'express';
import cors from 'cors';
import { JSDOM } from 'jsdom';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// In production, serve static files from dist/
// API routes come first, then static fallback
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
} else {
  app.use(cors());
}

app.use(express.json({ limit: '10mb' }));

// Pretty-print HTML by parsing and serializing with jsdom
function formatHtml(html) {
  try {
    const dom = new JSDOM(html, { contentType: 'text/html' });
    const serialized = dom.serialize();
    // Add newlines before opening tags and after closing tags for readability
    return serialized
      .replace(/></g, '>\n<')
      .replace(/\n\n+/g, '\n')
      .trim();
  } catch {
    return html;
  }
}

// GET /api/fetch?url=<encoded_url> — fetches the URL, returns HTML source
app.get('/api/fetch', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `HTTP ${response.status}: ${response.statusText}` });
    }

    const html = await response.text();
    const formatted = formatHtml(html);
    res.json({ html: formatted, url: response.url, status: response.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/parse — takes HTML, returns parsed file tree structure and component tree
app.post('/api/parse', (req, res) => {
  const { html } = req.body;
  if (!html) {
    return res.status(400).json({ error: 'Missing html in body' });
  }

  try {
    const cssFiles = [];
    const jsFiles = [];
    const inlineStyles = [];
    const inlineScripts = [];

    // Extract <link> CSS
    const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const name = href.split('/').pop()?.split('?')[0] || 'style.css';
      cssFiles.push({ name, href });
    }

    // Extract <script src>
    const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = scriptSrcRegex.exec(html)) !== null) {
      const src = match[1];
      const name = src.split('/').pop()?.split('?')[0] || 'script.js';
      jsFiles.push({ name, src });
    }

    // Extract inline <style>
    const inlineStyleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let styleIdx = 0;
    while ((match = inlineStyleRegex.exec(html)) !== null) {
      styleIdx++;
      inlineStyles.push({ name: `inline-style-${styleIdx}.css`, content: match[1].trim() });
    }

    // Extract inline <script> (no src)
    const inlineScriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
    let scriptIdx = 0;
    while ((match = inlineScriptRegex.exec(html)) !== null) {
      if (match[1].trim()) {
        scriptIdx++;
        inlineScripts.push({ name: `inline-script-${scriptIdx}.js`, content: match[1].trim() });
      }
    }

    // Build component tree from HTML using JSDOM for reliable parsing
    const buildComponentTree = (htmlStr) => {
      try {
        const dom = new JSDOM(htmlStr, { contentType: 'text/html' });
        const doc = dom.window.document;
        let currentId = 0;
        const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', '#comment']);

        function walk(el) {
          if (!el) return null;
          // Skip comments and processing instructions
          if (el.nodeType === 8) return null; // Comment
          if (el.nodeType === 3 || el.nodeType === 4) { // Text or CDATA
            const text = el.textContent?.trim();
            if (!text) return null;
            return {
              id: `node-${currentId++}`,
              tag: '#text',
              attributes: {},
              children: [],
              text: text.substring(0, 100),
              depth: 0,
              inlineStyle: '',
            };
          }
          if (el.nodeType !== 1) return null; // Not element

          const tag = el.tagName?.toLowerCase() || '';
          if (skipTags.has(tag) || skipTags.has(el.nodeName)) return null;

          const attributes = {};
          for (const attr of el.attributes) {
            attributes[attr.name] = attr.value;
          }

          const children = [];
          for (const child of el.childNodes) {
            const walked = walk(child);
            if (walked) children.push(walked);
          }

          return {
            id: `node-${currentId++}`,
            tag,
            attributes,
            children,
            depth: 0,
            inlineStyle: attributes.style || '',
          };
        }

        const body = doc.body;
        if (!body) return [];
        const result = [];
        for (const child of body.childNodes) {
          const node = walk(child);
          if (node) result.push(node);
        }
        return result;
      } catch (err) {
        console.error('JSDOM parse error:', err);
        return [];
      }
    };

    const componentTree = buildComponentTree(html);

    res.json({
      fileTree: {
        cssFiles,
        jsFiles,
        inlineStyles,
        inlineScripts,
      },
      componentTree,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parse error';
    res.status(500).json({ error: message });
  }
});

// In production, serve index.html for any non-API route (SPA fallback)
if (process.env.NODE_ENV === 'production') {
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`URL Inspector server running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
});
