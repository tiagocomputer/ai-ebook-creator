import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'openai-compatible';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';

interface LLMClientConfig {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULTS: Record<LLMProvider, { model: string }> = {
  openai: { model: 'gpt-4o-mini' },
  anthropic: { model: 'claude-haiku-4-5-20251001' },
  gemini: { model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash' },
  'openai-compatible': { model: process.env.LLM_MODEL ?? 'gpt-4o-mini' },
};

function detectProvider(): LLMProvider {
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.LLM_BASE_URL) return 'openai-compatible';
  throw new Error(
    'No AI API key found. Set GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or LLM_BASE_URL + LLM_API_KEY in .env',
  );
}

export async function generateText(
  prompt: string,
  config: LLMClientConfig = {},
): Promise<string> {
  const provider = config.provider ?? detectProvider();
  const model = config.model ?? DEFAULTS[provider].model;
  const temperature = config.temperature ?? 0.7;
  const maxTokens = config.maxTokens ?? 4096;

  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = response.content[0];
    if (block.type !== 'text') throw new Error('Unexpected Anthropic response type');
    return block.text.trim();
  }

  // OpenAI, Gemini, or OpenAI-compatible
  const clientOptions: ConstructorParameters<typeof OpenAI>[0] = {
    apiKey: process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY ?? 'no-key',
  };
  if (provider === 'gemini') {
    clientOptions.apiKey = process.env.GEMINI_API_KEY ?? '';
    clientOptions.baseURL = GEMINI_BASE_URL;
  } else if (provider === 'openai-compatible' && process.env.LLM_BASE_URL) {
    clientOptions.baseURL = process.env.LLM_BASE_URL;
  }

  const client = new OpenAI(clientOptions);
  const response = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

export async function generateJSON<T>(
  prompt: string,
  config: LLMClientConfig = {},
): Promise<T> {
  const rawText = await generateText(prompt, { ...config, temperature: 0.3 });

  // Strip markdown code fences if present
  const cleaned = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Last resort: extract first JSON array/object
    const match = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) return JSON.parse(match[1]) as T;
    throw new Error(`Failed to parse JSON from AI response:\n${rawText}`);
  }
}
