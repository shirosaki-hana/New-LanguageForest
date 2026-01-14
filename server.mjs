import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');

// Ollama server configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = process.env.OLLAMA_PORT || '11434';
const OLLAMA_BASE_URL = `http://${OLLAMA_HOST}:${OLLAMA_PORT}`;
const PORT = process.env.PORT || 0;

// Test mode configuration
const TEST_MODE = process.env.TEST_MODE === 'true';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

/**
 * Request object for debugging
 */
function prettyPrintRequest(req, body) {
  const timestamp = new Date().toISOString();
  const separator = '═'.repeat(60);

  console.log('\n' + separator);
  console.log(`[TEST MODE] Request Intercepted @ ${timestamp}`);
  console.log(separator);
  console.log(`URL:     ${req.url}`);
  console.log(`Method:  ${req.method}`);
  console.log(`Headers:`);
  Object.entries(req.headers).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  if (body && body.length > 0) {
    try {
      const parsed = JSON.parse(body.toString());
      console.log(`Body (JSON):`);
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log(`Body (Raw):`);
      console.log(body.toString());
    }
  } else {
    console.log(`Body: (empty)`);
  }
  console.log(separator + '\n');
}

/**
 * Proxy request to Ollama server
 */
function proxyToOllama(req, res) {
  // Forward request path directly to Ollama (e.g., /api/chat -> http://ollama:11434/api/chat)
  const ollamaUrl = `${OLLAMA_BASE_URL}${req.url}`;

  // Collect request body
  let body = [];
  req.on('data', chunk => body.push(chunk));
  req.on('end', () => {
    body = Buffer.concat(body);

    // Test mode: intercept request, log it, and return 500 error
    if (TEST_MODE && req.method === 'POST') {
      prettyPrintRequest(req, body);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Test mode enabled',
          message: 'Request intercepted for debugging purposes',
        })
      );
      return;
    }

    const urlObj = new URL(ollamaUrl);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${OLLAMA_HOST}:${OLLAMA_PORT}`,
      },
    };

    const proxyReq = http.request(options, proxyRes => {
      // Forward status code and headers from Ollama
      res.writeHead(proxyRes.statusCode, proxyRes.headers);

      // Stream the response directly to client
      proxyRes.pipe(res);
    });

    proxyReq.on('error', err => {
      console.error('Proxy error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to connect to Ollama server', details: err.message }));
    });

    // Send request body if present
    if (body.length > 0) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
}

/**
 * Serve static files
 */
function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];

  if (urlPath === '/') {
    urlPath = '/index.html';
  }

  const filePath = path.join(DIST_DIR, urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, indexData) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexData);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

const server = http.createServer((req, res) => {
  // Route /api/* requests to Ollama proxy
  if (req.url.startsWith('/api')) {
    proxyToOllama(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  const { port } = server.address();
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Ollama proxy: /api/* -> ${OLLAMA_BASE_URL}/*`);
  if (TEST_MODE) {
    console.log('TEST MODE ENABLED - All API requests will be intercepted and return 500 error');
  }
});
