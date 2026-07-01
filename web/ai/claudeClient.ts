import {
  LLMProvider,
  ChatMessage,
  LLMConfig,
  LLMResponse,
  StreamCallbacks
} from './types';

/**
 * Anthropic Claude API Client implementing LLMProvider interface.
 * Reusable client structure for integrating Anthropic Claude models.
 */
export class ClaudeClient implements LLMProvider {
  readonly providerName = 'anthropic';
  readonly defaultModel = 'claude-3-5-sonnet';

  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.anthropic.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
  }

  private getApiKey(): string {
    if (!this.apiKey) {
      throw new Error('Anthropic Claude API Key is not configured.');
    }
    return this.apiKey;
  }

  async generateCompletion(
    prompt: string,
    modelName: string = this.defaultModel,
    config?: LLMConfig
  ): Promise<LLMResponse> {
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    return this.generateChat(messages, modelName, config);
  }

  async generateChat(
    messages: ChatMessage[],
    modelName: string = this.defaultModel,
    config?: LLMConfig
  ): Promise<LLMResponse> {
    const apiKey = this.getApiKey();
    const url = `${this.baseUrl}/messages`;

    const requestBody: any = {
      model: modelName,
      messages: messages.map((msg) => ({
        role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      max_tokens: config?.maxTokens || 4000,
      temperature: config?.temperature,
      top_p: config?.topP
    };

    // System instruction is passed as a top-level property in Claude APIs
    if (config?.systemInstruction) {
      requestBody.system = config.systemInstruction;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API Error [${response.status}]: ${errorText}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      
      const usage = data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      } : undefined;

      return {
        text,
        usage,
        raw: data
      };
    } catch (error) {
      console.error('Error invoking Claude API:', error);
      throw error;
    }
  }

  async streamCompletion(
    prompt: string,
    callbacks: StreamCallbacks,
    modelName: string = this.defaultModel,
    config?: LLMConfig
  ): Promise<void> {
    const apiKey = this.getApiKey();
    const url = `${this.baseUrl}/messages`;

    const requestBody: any = {
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: config?.maxTokens || 4000,
      temperature: config?.temperature,
      top_p: config?.topP,
      stream: true
    };

    if (config?.systemInstruction) {
      requestBody.system = config.systemInstruction;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude Streaming Error [${response.status}]: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No body reader');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine || !cleanLine.startsWith('data: ')) continue;

          const rawData = cleanLine.substring(6);

          try {
            const parsed = JSON.parse(rawData);
            
            // Anthropic Claude SSE uses specific event blocks (content_block_delta, etc.)
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              const textChunk = parsed.delta.text;
              fullText += textChunk;
              callbacks.onChunk(textChunk);
            }
          } catch (e) {}
        }
      }

      if (callbacks.onComplete) {
        callbacks.onComplete(fullText);
      }
    } catch (error: any) {
      if (callbacks.onError) callbacks.onError(error);
      else throw error;
    }
  }
}
