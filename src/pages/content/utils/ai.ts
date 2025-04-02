import { generateText } from 'ai';
import { anthropic,createAnthropic } from '@ai-sdk/anthropic';
import { openai,createOpenAI } from '@ai-sdk/openai';
import { ollama,createOllama } from 'ollama-ai-provider';
import { bedrock, createAmazonBedrock } from '@ai-sdk/amazon-bedrock';

interface AISettings {
    provider: string;
    settings: AIProviderSettings;
  }

interface OllamaSettings  {
    model: string;
    baseURL: string;
  }

interface AnthropicSettings {
    apiKey: string;
    model: string;
    baseURL: string;
  }

  
interface OpenAISettings {
    apiKey: string;
    model: string;
    baseURL: string;
  }

  interface GroqSettings {
    apiKey: string;
    model: string;
    baseURL: string;
  }

  interface AmazonBedrockSettings {
    region: string;
    model: string;
    accessKey: string;
    secretAccessKey: string;
  }


type AIProvider = 'anthropic' | 'openai' | 'ollama' | 'amazonbedrock';
type AIProviderSettings = AnthropicSettings | OpenAISettings | OllamaSettings | AmazonBedrockSettings;

export async function getModel(provider:AIProvider, settings:AIProviderSettings) {

    switch (provider) {
        case 'anthropic':
            const anthropicSettings = settings as AnthropicSettings;
            const anthropicClient = createAnthropic(
                {
                    apiKey: anthropicSettings.apiKey,
                    baseURL: anthropicSettings.baseURL
                }
            )
            return anthropicClient(settings.model)
        case 'openai':
            const openaiSettings = settings as OpenAISettings;
            const openaiClient = createOpenAI(
                {
                    apiKey: openaiSettings.apiKey,
                    baseURL: openaiSettings.baseURL
                }
            )
            return openaiClient(settings.model)
        case 'ollama':
            const ollamaSettings = settings as OllamaSettings;
            const ollamaClient = createOllama(
                {
                    baseURL: ollamaSettings.baseURL
                }
            )
            console.log("ollamaClient",ollamaClient(settings.model),settings.model);
            return ollamaClient(settings.model)
        case 'amazonbedrock':
            const bedrockSettings = settings as AmazonBedrockSettings;
            const bedrockClient = createAmazonBedrock(
                {
                    region: bedrockSettings.region,
                    accessKeyId: bedrockSettings.accessKey,
                    secretAccessKey: bedrockSettings.secretAccessKey
                }
            )
            return bedrockClient(settings.model)
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }

}

export type { AISettings,AIProviderSettings,AnthropicSettings, OpenAISettings,GroqSettings, OllamaSettings, AmazonBedrockSettings };