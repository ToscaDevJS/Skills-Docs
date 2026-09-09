// Loopback static server for the browser lane.
//
// Everything the fixtures need is served from disk: the pinned Tailwind browser
// build and the pinned font faces. Nothing reaches the network, so a missing
// dependency is a 404 the test can see instead of a silent CDN fallback.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const testsDir = path.join(root, 'tests');
const modules = path.join(root, 'node_modules');

export const TAILWIND_BUNDLE = path.join(modules, '@tailwindcss/browser/dist/index.global.js');

// Family name → the fontsource package and the face files it ships.
const FONT_PACKAGES = {
  '@fontsource/caprasimo': ['latin-400.css'],
  '@fontsource/syne': ['latin-400.css', 'latin-600.css'],
  '@fontsource/meow-script': ['latin-400.css'],
};

const TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.woff2', 'font/woff2'],
  ['.woff', 'font/woff'],
]);

/**
 * Concatenate the pinned @font-face declarations, rewriting each relative
 * `./files/x.woff2` to the `/vendor/font-files/` route below.
 */
async function fontStylesheet() {
  const blocks = [];
  for (const [pkg, files] of Object.entries(FONT_PACKAGES)) {
    for (const file of files) {
      const css = await readFile(path.join(modules, pkg, file), 'utf8');
      blocks.push(css.replaceAll('url(./files/', 'url(/vendor/font-files/'));
    }
  }
  // `block` instead of `swap`: a fallback must never be measured as the real face.
  return blocks.join('\n').replaceAll('font-display: swap;', 'font-display: block;');
}

async function fontFile(name) {
  for (const pkg of Object.keys(FONT_PACKAGES)) {
    try {
      return await readFile(path.join(modules, pkg, 'files', name));
    } catch { /* try the next package */ }
  }
  return null;
}

/**
 * Start the fixture server.
 *
 * @param {Map<string,string>} pages in-memory HTML, served at `/dynamic/<key>`
 * @returns {Promise<{origin: string, close: () => Promise<void>}>}
 */
export async function startServer(pages = new Map()) {
  const server = createServer((request, response) => {
    void respond(request, response, pages);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise(resolve => server.close(resolve)),
  };
}

async function respond(request, response, pages) {
  const url = new URL(request.url, 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname);

  const send = (status, body, type) => {
    response.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
    response.end(body);
  };

  try {
    if (pathname.startsWith('/dynamic/')) {
      const key = pathname.slice('/dynamic/'.length);
      const html = pages.get(key);
      if (html === undefined) return send(404, `No fixture registered: ${key}`, 'text/plain');
      return send(200, html, TYPES.get('.html'));
    }

    if (pathname === '/vendor/tailwind.js') {
      return send(200, await readFile(TAILWIND_BUNDLE), TYPES.get('.js'));
    }

    if (pathname === '/vendor/fonts.css') {
      return send(200, await fontStylesheet(), TYPES.get('.css'));
    }

    if (pathname.startsWith('/vendor/font-files/')) {
      const name = path.basename(pathname);
      const file = await fontFile(name);
      if (!file) return send(404, `No font file: ${name}`, 'text/plain');
      return send(200, file, TYPES.get(path.extname(name)) ?? 'application/octet-stream');
    }

    // Repository fixtures, confined to tests/.
    const target = path.join(testsDir, pathname);
    const relative = path.relative(testsDir, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return send(403, 'Outside the fixture directory', 'text/plain');
    }
    return send(200, await readFile(target), TYPES.get(path.extname(target)) ?? 'text/plain');
  } catch (error) {
    send(error.code === 'ENOENT' ? 404 : 500, String(error.message), 'text/plain');
  }
}
