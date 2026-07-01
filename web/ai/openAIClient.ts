import {
  LLMProvider,
  ChatMessage,
  LLMConfig,
  LLMResponse,
  StreamCallbacks
} from './types';

/**
 * OpenAI API Client implementing LLMProvider interface.
 * Demonstrates plug-and-play capability for future integration of ChatGPT.
 */
export class OpenAIClient implements LLMProvider {
  readonly providerName = 'openai';
  readonly defaultModel = 'gpt-4o';

  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  private getApiKey(): string {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key is not configured.');
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
    const url = `${this.baseUrl}/chat/completions`;

    // Map system instruction to a system message at the top if present
    const formattedMessages = [...messages];
    if (config?.systemInstruction) {
      formattedMessages.unshift({
        role: 'system',
        content: config.systemInstruction
      });
    }

    const requestBody: any = {
      model: modelName,
      messages: formattedMessages.map((msg) => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.content
      })),
      temperature: config?.temperature,
      top_p: config?.topP,
      max_tokens: config?.maxTokens,
      stop: config?.stopSequences
    };

    if (config?.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API Error [${response.status}]: ${errorText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      
      const usage = data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined;

      return {
        text,
        usage,
        raw: data
      };
    } catch (error) {
      console.error('Error invoking OpenAI API:', error);
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
    const url = `${this.baseUrl}/chat/completions`;

    const messages = [{ role: 'user', content: prompt }];
    if (config?.systemInstruction) {
      messages.unshift({ role: 'system', content: config.systemInstruction });
    }

    const requestBody = {
      model: modelName,
      messages: messages.map((msg) => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.content
      })),
      temperature: config?.temperature,
      top_p: config?.topP,
      max_tokens: config?.maxTokens,
      stop: config?.stopSequences,
      stream: true
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI Streaming Error [${response.status}]: ${errorText}`);
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
          if (rawData === '[DONE]') continue;

          try {
            const parsed = JSON.parse(rawData);
            const textChunk = parsed.choices?.[0]?.delta?.content;
            if (textChunk) {
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
