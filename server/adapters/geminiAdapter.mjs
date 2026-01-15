import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini Adapter - Ollama 형식 요청을 Gemini API로 변환
 */
export class GeminiAdapter {
  constructor(config) {
    if (!config.apiKey) {
      throw new Error('GEMINI_API_KEY is required for Gemini adapter');
    }
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.defaultModel = config.model || 'gemini-2.0-flash';
  }

  /**
   * 모델 목록 조회 - Gemini에서 사용 가능한 모델 반환
   * Ollama 형식으로 반환 (프론트엔드 호환)
   */
  async listModels() {
    // Gemini API는 모델 목록 API가 제한적이므로 하드코딩된 목록 반환
    const geminiModels = [
      { name: 'gemini-2.5-flash', size: 'Medium', family: 'Gemini 2.5' },
      { name: 'gemini-2.0-flash', size: 'Medium', family: 'Gemini 2.0' },
      { name: 'gemini-2.0-flash-lite', size: 'Small', family: 'Gemini 2.0' },
    ];

    // Ollama /api/tags 형식으로 변환
    return {
      models: geminiModels.map((m) => ({
        name: m.name,
        model: m.name,
        modified_at: new Date().toISOString(),
        size: 0, // Gemini는 사이즈 정보 없음
        digest: '',
        details: {
          parent_model: '',
          format: 'gemini',
          family: m.family,
          parameter_size: m.size,
          quantization_level: '',
        },
      })),
    };
  }

  /**
   * Ollama 메시지 형식을 Gemini 형식으로 변환
   */
  _convertMessages(messages) {
    const contents = [];
    let systemInstruction = null;

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Gemini는 system을 별도로 처리
        systemInstruction = msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    return { contents, systemInstruction };
  }

  /**
   * 채팅 완료 (POST /api/chat) - 스트리밍
   * Ollama 형식 요청을 받아 Gemini로 처리하고 Ollama 형식으로 응답
   */
  async chat(body, reply) {
    const modelName = body.model || this.defaultModel;
    const { contents, systemInstruction } = this._convertMessages(body.messages);

    const model = this.genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction || undefined,
    });

    // 스트리밍 응답 헤더 설정
    reply.raw.writeHead(200, {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    try {
      if (body.stream === false) {
        // 비스트리밍 모드
        const result = await model.generateContent({ contents });
        const text = result.response.text();

        const ollamaResponse = {
          model: modelName,
          created_at: new Date().toISOString(),
          message: {
            role: 'assistant',
            content: text,
          },
          done: true,
          done_reason: 'stop',
        };

        reply.raw.write(JSON.stringify(ollamaResponse) + '\n');
        reply.raw.end();
      } else {
        // 스트리밍 모드
        const result = await model.generateContentStream({ contents });

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            // Ollama 스트리밍 형식으로 변환
            const ollamaChunk = {
              model: modelName,
              created_at: new Date().toISOString(),
              message: {
                role: 'assistant',
                content: text,
              },
              done: false,
            };
            reply.raw.write(JSON.stringify(ollamaChunk) + '\n');
          }
        }

        // 완료 메시지
        const doneChunk = {
          model: modelName,
          created_at: new Date().toISOString(),
          message: {
            role: 'assistant',
            content: '',
          },
          done: true,
          done_reason: 'stop',
        };
        reply.raw.write(JSON.stringify(doneChunk) + '\n');
        reply.raw.end();
      }
    } catch (error) {
      console.error('Gemini API error:', error);

      // 에러를 Ollama 형식으로 반환
      const errorResponse = {
        error: error.message || 'Gemini API request failed',
      };

      if (!reply.raw.headersSent) {
        reply.raw.writeHead(500, { 'Content-Type': 'application/json' });
      }
      reply.raw.write(JSON.stringify(errorResponse));
      reply.raw.end();
    }
  }

  /**
   * 텍스트 생성 (POST /api/generate)
   * Ollama generate 형식으로 응답 (response 필드 사용)
   */
  async generate(body, reply) {
    const modelName = body.model || this.defaultModel;

    const model = this.genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: body.system || undefined,
    });

    const contents = [
      {
        role: 'user',
        parts: [{ text: body.prompt }],
      },
    ];

    // 스트리밍 응답 헤더 설정
    reply.raw.writeHead(200, {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    try {
      if (body.stream === false) {
        // 비스트리밍 모드
        const result = await model.generateContent({ contents });
        const text = result.response.text();

        // Ollama generate 형식: response 필드 사용
        const ollamaResponse = {
          model: modelName,
          created_at: new Date().toISOString(),
          response: text,
          done: true,
        };

        reply.raw.write(JSON.stringify(ollamaResponse) + '\n');
        reply.raw.end();
      } else {
        // 스트리밍 모드
        const result = await model.generateContentStream({ contents });

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            // Ollama generate 스트리밍 형식: response 필드 사용
            const ollamaChunk = {
              model: modelName,
              created_at: new Date().toISOString(),
              response: text,
              done: false,
            };
            reply.raw.write(JSON.stringify(ollamaChunk) + '\n');
          }
        }

        // 완료 메시지
        const doneChunk = {
          model: modelName,
          created_at: new Date().toISOString(),
          response: '',
          done: true,
        };
        reply.raw.write(JSON.stringify(doneChunk) + '\n');
        reply.raw.end();
      }
    } catch (error) {
      console.error('Gemini API error:', error);

      const errorResponse = {
        error: error.message || 'Gemini API request failed',
      };

      if (!reply.raw.headersSent) {
        reply.raw.writeHead(500, { 'Content-Type': 'application/json' });
      }
      reply.raw.write(JSON.stringify(errorResponse));
      reply.raw.end();
    }
  }
}
