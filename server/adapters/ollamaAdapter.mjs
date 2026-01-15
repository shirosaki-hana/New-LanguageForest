import http from 'http';

/**
 * Ollama Adapter - Ollama 서버로 직접 프록시
 */
export class OllamaAdapter {
  constructor(config) {
    this.host = config.host || 'localhost';
    this.port = config.port || '11434';
    this.baseUrl = `http://${this.host}:${this.port}`;
  }

  /**
   * 모델 목록 조회 (GET /api/tags)
   */
  async listModels() {
    return new Promise((resolve, reject) => {
      const req = http.request(`${this.baseUrl}/api/tags`, { method: 'GET' }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse Ollama response'));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  /**
   * 채팅 완료 (POST /api/chat) - 스트리밍
   * @param {object} body - Ollama chat request body
   * @param {object} reply - Fastify reply object for streaming
   */
  async chat(body, reply) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: '/api/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const proxyReq = http.request(options, (proxyRes) => {
        reply.raw.writeHead(proxyRes.statusCode, {
          'Content-Type': 'application/x-ndjson',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        proxyRes.on('data', (chunk) => {
          reply.raw.write(chunk);
        });

        proxyRes.on('end', () => {
          reply.raw.end();
          resolve();
        });

        proxyRes.on('error', reject);
      });

      proxyReq.on('error', (err) => {
        reject(err);
      });

      proxyReq.write(JSON.stringify(body));
      proxyReq.end();
    });
  }

  /**
   * 텍스트 생성 (POST /api/generate) - 스트리밍
   * @param {object} body - Ollama generate request body
   * @param {object} reply - Fastify reply object for streaming
   */
  async generate(body, reply) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const proxyReq = http.request(options, (proxyRes) => {
        reply.raw.writeHead(proxyRes.statusCode, {
          'Content-Type': 'application/x-ndjson',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        proxyRes.on('data', (chunk) => {
          reply.raw.write(chunk);
        });

        proxyRes.on('end', () => {
          reply.raw.end();
          resolve();
        });

        proxyRes.on('error', reject);
      });

      proxyReq.on('error', (err) => {
        reject(err);
      });

      proxyReq.write(JSON.stringify(body));
      proxyReq.end();
    });
  }
}
