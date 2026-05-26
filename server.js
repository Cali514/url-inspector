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
    return serialized
      .replace(/></g, '>\n<')
      .replace(/\n\n+/g, '\n')
      .trim();
  } catch {
    return html;
  }
}

// Validate and normalize URL
function validateUrl(input) {
  try {
    const parsed = new URL(input);
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only http:// and https:// URLs are supported' };
    }
    return { valid: true, url: parsed.href };
  } catch {
    // Try prepending https:// if missing scheme
    try {
      const withScheme = new URL('https://' + input);
      return { valid: true, url: withScheme.href };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }
}

// GET /api/fetch?url=<encoded_url> — fetches the URL, returns HTML source
app.get('/api/fetch', async (req, res) => {
  const rawUrl = req.query.url;
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  const validation = validateUrl(rawUrl);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const url = validation.url;

  // Timeout controller — 15s total
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity', // Avoid compressed responses that might cause issues
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
      follow: 10,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `HTTP ${response.status}: ${response.statusText}`,
        url: response.url,
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const html = await response.text();
    const formatted = formatHtml(html);

    res.json({
      html: formatted,
      url: response.url,
      status: response.status,
      contentType,
    });
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out (15s limit)' });
    }

    // DNS / connection errors
    if (err.cause?.code === 'ENOTFOUND') {
      return res.status(502).json({ error: `DNS lookup failed: ${err.cause.hostname || url}` });
    }
    if (err.cause?.code === 'ECONNREFUSED') {
      return res.status(502).json({ error: 'Connection refused by target server' });
    }
    if (err.cause?.code === 'ECONNRESET') {
      return res.status(502).json({ error: 'Connection reset by target server' });
    }
    if (err.cause?.code === 'CERT_HAS_EXPIRED') {
      return res.status(502).json({ error: 'SSL certificate expired — the site\'s HTTPS cert is invalid' });
    }
    if (err.cause?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || err.cause?.code === 'CERT_SIGNATURE_FAILURE') {
      return res.status(502).json({ error: 'SSL certificate verification failed' });
    }

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
    const linkRegex = /<link[^>]+rel=[\"']stylesheet[\"'][^>]+href=[\"']([^\"']+)[\"'][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const name = href.split('/').pop()?.split('?')[0] || 'style.css';
      cssFiles.push({ name, href });
    }

    // Extract <script src>
    const scriptSrcRegex = /<script[^>]+src=[\"']([^\"']+)[\"'][^>]*>/gi;
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
          if (el.nodeType === 8) return null;
          if (el.nodeType === 3 || el.nodeType === 4) {
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
          if (el.nodeType !== 1) return null;

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
