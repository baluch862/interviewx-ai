import {
  LLMProvider,
  ChatMessage,
  LLMConfig,
  LLMResponse,
  StreamCallbacks,
  ChatRole
} from './types';

/**
 * Gemini API Client implementing LLMProvider interface.
 * Uses direct REST API calls for maximum performance, robustness, and lightweight bundle footprint.
 */
export class GeminiClient implements LLMProvider {
  readonly providerName = 'gemini';
  readonly defaultModel = 'gemini-3.5-flash';

  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey?: string) {
    // Falls back to environment variables in Node.js or browser client environments
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  }

  private getApiKey(): string {
    if (!this.apiKey) {
      throw new Error('Gemini API Key is not configured. Please supply an API key in the constructor or configure GEMINI_API_KEY / NEXT_PUBLIC_GEMINI_API_KEY.');
    }
    return this.apiKey;
  }

  /**
   * Map standard universal roles to Gemini specific roles ('user' or 'model')
   */
  private mapRole(role: ChatRole): string {
    switch (role) {
      case 'user':
        return 'user';
      case 'assistant':
      case 'model':
        return 'model';
      case 'system':
        return 'system'; // Handled separately by systemInstruction API parameter
      default:
        return 'user';
    }
  }

  /**
   * Format generic chat messages to Gemini's expected Content format
   */
  private formatContents(messages: ChatMessage[]): any[] {
    // Filter out system messages as they are passed via systemInstruction
    return messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: this.mapRole(msg.role),
        parts: [{ text: msg.content }]
      }));
  }

  /**
   * Format Generation Config for Gemini API
   */
  private formatGenerationConfig(config?: LLMConfig): any {
    if (!config) return {};

    const formatted: any = {};
    if (config.temperature !== undefined) formatted.temperature = config.temperature;
    if (config.topP !== undefined) formatted.topP = config.topP;
    if (config.topK !== undefined) formatted.topK = config.topK;
    if (config.maxTokens !== undefined) formatted.maxOutputTokens = config.maxTokens;
    if (config.stopSequences !== undefined) formatted.stopSequences = config.stopSequences;

    if (config.responseFormat === 'json') {
      formatted.responseMimeType = 'application/json';
    }

    return formatted;
  }

  /**
   * Format System Instruction for Gemini API
   */
  private formatSystemInstruction(config?: LLMConfig): any | undefined {
    const instruction = config?.systemInstruction;
    if (!instruction) return undefined;

    return {
      parts: [{ text: instruction }]
    };
  }

  /**
   * Generates a single completion for a prompt.
   */
  async generateCompletion(
    prompt: string,
    modelName: string = this.defaultModel,
    config?: LLMConfig
  ): Promise<LLMResponse> {
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    return this.generateChat(messages, modelName, config);
  }

  /**
   * Generates a completion for a multi-turn conversation.
   */
  async generateChat(
    messages: ChatMessage[],
    modelName: string = this.defaultModel,
    config?: LLMConfig
  ): Promise<LLMResponse> {
    const apiKey = this.getApiKey();
    const url = `${this.baseUrl}/${modelName}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: this.formatContents(messages),
      generationConfig: this.formatGenerationConfig(config),
      systemInstruction: this.formatSystemInstruction(config)
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error [${response.status}]: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Map API usage if provided
      const usage = data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0
      } : undefined;

      return {
        text: generatedText,
        usage,
        raw: data
      };
    } catch (error: any) {
      console.error('Error invoking Gemini API:', error);
      throw error;
    }
  }

  /**
   * Streams a completion for a prompt chunk-by-chunk.
   */
  async streamCompletion(
    prompt: string,
    callbacks: StreamCallbacks,
    modelName: string = this.defaultModel,
    config?: LLMConfig
  ): Promise<void> {
    const apiKey = this.getApiKey();
    const url = `${this.baseUrl}/${modelName}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: this.formatGenerationConfig(config),
      systemInstruction: this.formatSystemInstruction(config)
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Streaming Error [${response.status}]: ${errorText || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body reader could not be established for streaming.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last partial line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine || !cleanLine.startsWith('data: ')) continue;

          try {
            const jsonStr = cleanLine.substring(6);
            if (jsonStr === '[DONE]') continue;

            const parsed = JSON.parse(jsonStr);
            const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (textChunk) {
              fullText += textChunk;
              callbacks.onChunk(textChunk);
            }
          } catch (e) {
            // Silently skip partial lines/malformed SSE envelopes
          }
        }
      }

      // Flush remaining buffer
      if (buffer && buffer.startsWith('data: ')) {
        try {
          const jsonStr = buffer.substring(6);
          const parsed = JSON.parse(jsonStr);
          const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textChunk) {
            fullText += textChunk;
            callbacks.onChunk(textChunk);
          }
        } catch (e) {}
      }

      if (callbacks.onComplete) {
        callbacks.onComplete(fullText);
      }
    } catch (error: any) {
      console.error('Error during streaming:', error);
      if (callbacks.onError) {
        callbacks.onError(error);
      } else {
        throw error;
      }
    }
  }
}
