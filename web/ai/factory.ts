import { LLMProvider } from './types';
import { GeminiClient } from './geminiClient';
import { OpenAIClient } from './openAIClient';
import { ClaudeClient } from './claudeClient';

export type SupportedProvider = 'gemini' | 'openai' | 'claude';

/**
 * Universal Factory to resolve and configure LLM clients dynamically.
 */
export class LLMFactory {
  /**
   * Instantiates the desired provider.
   */
  static createProvider(
    provider: SupportedProvider,
    apiKey?: string
  ): LLMProvider {
    switch (provider) {
      case 'gemini':
        return new GeminiClient(apiKey);
      case 'openai':
        return new OpenAIClient(apiKey);
      case 'claude':
        return new ClaudeClient(apiKey);
      default:
        throw new Error(`Unsupported provider: "${provider}". Eligible options are: 'gemini', 'openai', 'claude'`);
    }
  }

  /**
   * Helper to fetch the system's default provider from environment variables
   */
  static getDefaultProvider(): LLMProvider {
    const providerEnv = (process.env.NEXT_PUBLIC_DEFAULT_LLM_PROVIDER || 'gemini') as SupportedProvider;
    return this.createProvider(providerEnv);
  }
}
