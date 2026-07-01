export type ChatRole = 'user' | 'model' | 'system' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface LLMConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  systemInstruction?: string;
  stopSequences?: string[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMResponse {
  text: string;
  usage?: TokenUsage;
  raw?: any; // Original response payload from the underlying SDK/API
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Universal Interface for LLM Providers.
 * Any new LLM (Gemini, ChatGPT, Claude, DeepSeek, Llama) must implement this contract.
 */
export interface LLMProvider {
  providerName: string;
  defaultModel: string;

  /**
   * Generates a single completion for a prompt.
   */
  generateCompletion(
    prompt: string,
    modelName?: string,
    config?: LLMConfig
  ): Promise<LLMResponse>;

  /**
   * Generates a completion for a multi-turn conversation.
   */
  generateChat(
    messages: ChatMessage[],
    modelName?: string,
    config?: LLMConfig
  ): Promise<LLMResponse>;

  /**
   * Streams a completion for a prompt chunk-by-chunk.
   */
  streamCompletion(
    prompt: string,
    callbacks: StreamCallbacks,
    modelName?: string,
    config?: LLMConfig
  ): Promise<void>;
}
