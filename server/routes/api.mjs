/**
 * API 라우트 플러그인
 * /api/* 요청을 LLM 어댑터로 라우팅
 */
export default async function apiRoutes(fastify, options) {
  const { adapter, testMode } = options;

  /**
   * 테스트 모드: 요청 로깅 후 500 반환
   */
  function handleTestMode(request, reply) {
    const timestamp = new Date().toISOString();
    const separator = '═'.repeat(60);

    console.log('\n' + separator);
    console.log(`[TEST MODE] Request Intercepted @ ${timestamp}`);
    console.log(separator);
    console.log(`URL:     ${request.url}`);
    console.log(`Method:  ${request.method}`);
    console.log(`Headers:`);
    Object.entries(request.headers).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    if (request.body) {
      console.log(`Body (JSON):`);
      console.log(JSON.stringify(request.body, null, 2));
    } else {
      console.log(`Body: (empty)`);
    }
    console.log(separator + '\n');

    return reply.code(500).send({
      error: 'Test mode enabled',
      message: 'Request intercepted for debugging purposes',
    });
  }

  /**
   * GET /api/tags - 모델 목록 조회
   */
  fastify.get('/api/tags', async (request, reply) => {
    try {
      const models = await adapter.listModels();
      return models;
    } catch (error) {
      fastify.log.error('Failed to list models:', error);
      return reply.code(502).send({
        error: 'Failed to fetch models',
        details: error.message,
      });
    }
  });

  /**
   * POST /api/chat - 채팅 완료 (스트리밍)
   */
  fastify.post('/api/chat', async (request, reply) => {
    if (testMode) {
      return handleTestMode(request, reply);
    }

    try {
      // 스트리밍 응답이므로 reply.hijack() 사용하지 않고 어댑터에서 직접 처리
      await adapter.chat(request.body, reply);
    } catch (error) {
      fastify.log.error('Chat error:', error);
      if (!reply.raw.headersSent) {
        return reply.code(502).send({
          error: 'Failed to process chat request',
          details: error.message,
        });
      }
    }
  });

  /**
   * POST /api/generate - 텍스트 생성 (스트리밍)
   */
  fastify.post('/api/generate', async (request, reply) => {
    if (testMode) {
      return handleTestMode(request, reply);
    }

    try {
      await adapter.generate(request.body, reply);
    } catch (error) {
      fastify.log.error('Generate error:', error);
      if (!reply.raw.headersSent) {
        return reply.code(502).send({
          error: 'Failed to process generate request',
          details: error.message,
        });
      }
    }
  });

  /**
   * 기타 /api/* 요청은 Ollama 어댑터일 때만 프록시
   * (Gemini는 지원하지 않는 엔드포인트)
   */
  fastify.all('/api/*', async (request, reply) => {
    if (testMode && request.method === 'POST') {
      return handleTestMode(request, reply);
    }

    // Gemini 어댑터는 추가 엔드포인트 미지원
    if (adapter.constructor.name === 'GeminiAdapter') {
      return reply.code(404).send({
        error: 'Endpoint not supported',
        message: 'This endpoint is not available when using Gemini provider',
      });
    }

    // Ollama 어댑터: 직접 프록시 (fallback)
    return reply.code(404).send({
      error: 'Unknown endpoint',
      message: 'Use /api/tags, /api/chat, or /api/generate',
    });
  });
}
