import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { createAdapter, LLMProvider } from './adapters/index.mjs';
import apiRoutes from './routes/api.mjs';

// Load environment variables
dotenv.config({ quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Configuration
const config = {
  port: parseInt(process.env.PORT, 10) || 0,
  testMode: process.env.TEST_MODE === 'true',

  // LLM Provider 설정
  provider: process.env.LLM_PROVIDER || LLMProvider.OLLAMA,

  // Ollama 설정
  ollamaHost: process.env.OLLAMA_HOST || 'localhost',
  ollamaPort: process.env.OLLAMA_PORT || '11434',

  // Gemini 설정
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
};

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'error',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Create LLM adapter
const adapter = createAdapter(config);

// Register API routes
fastify.register(apiRoutes, {
  adapter,
  testMode: config.testMode,
});

// Serve static files from dist/
fastify.register(fastifyStatic, {
  root: DIST_DIR,
  prefix: '/',
});

// SPA fallback: serve index.html for non-API routes
fastify.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/api')) {
    return reply.code(404).send({ error: 'API endpoint not found' });
  }
  return reply.sendFile('index.html');
});

// Start server
const start = async () => {
  const address = await fastify.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`Server running at ${address}`);
  console.log(`Static files: ${DIST_DIR}`);
  console.log(`LLM Provider: ${config.provider.toUpperCase()}`);
  if (config.testMode) {
    console.log('TEST MODE ENABLED - All API requests will be intercepted');
  }
};

start().catch(err => {
  fastify.log.error(err);
  process.exitCode = 1;
});
