import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_RETRIES = 5;

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'openai-compatible';

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

/**
 * gemini-1.5-x and earlier → stable v1 API
 * gemini-2.x and experimental → v1beta
 */
function geminiApiVersion(model: string): string {
  return /^gemini-1\./i.test(model) ? 'v1' : 'v1beta';
}

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

  // ── Gemini (native SDK) ────────────────────────────────────────────────────
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
    const geminiModel = genAI.getGenerativeModel(
      { model, generationConfig: { temperature, maxOutputTokens: maxTokens } },
      { apiVersion: geminiApiVersion(model) },
    );

    let attempt = 0;
    while (true) {
      try {
        const result = await geminiModel.generateContent(prompt);
        return result.response.text().trim();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.toLowerCase().includes('quota exceeded');

        if (is429 && attempt < MAX_RETRIES) {
          attempt++;
          const waitMs = Math.min(1000 * 2 ** attempt, 60_000);
          console.warn(`[gemini/${model}] Rate limited. Retry ${attempt}/${MAX_RETRIES} in ${waitMs / 1000}s…`);
          await sleep(waitMs);
          continue;
        }
        throw new Error(`[gemini/${model}] ${msg}`);
      }
    }
  }

  // ── Anthropic ──────────────────────────────────────────────────────────────
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

  // ── OpenAI / OpenAI-compatible ─────────────────────────────────────────────
  const clientOptions: ConstructorParameters<typeof OpenAI>[0] = {
    apiKey: process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY ?? 'no-key',
  };
  if (provider === 'openai-compatible' && process.env.LLM_BASE_URL) {
    clientOptions.baseURL = process.env.LLM_BASE_URL;
  }

  const client = new OpenAI(clientOptions);
  let attempt = 0;

  while (true) {
    try {
      const response = await client.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });
      return response.choices[0]?.message?.content?.trim() ?? '';
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string; error?: unknown };

      if (e.status === 429 && attempt < MAX_RETRIES) {
        attempt++;
        const waitMs = Math.min(1000 * 2 ** attempt, 60_000);
        console.warn(`[${provider}/${model}] Rate limited. Retry ${attempt}/${MAX_RETRIES} in ${waitMs / 1000}s…`);
        await sleep(waitMs);
        continue;
      }

      const detail = e.error ? JSON.stringify(e.error) : e.message ?? String(err);
      throw new Error(`[${provider}/${model}] API error ${e.status ?? ''}: ${detail}`);
    }
  }
}

export async function generateJSON<T>(
  prompt: string,
  config: LLMClientConfig = {},
): Promise<T> {
  const rawText = await generateText(prompt, { ...config, temperature: 0.3 });

  const cleaned = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) return JSON.parse(match[1]) as T;
    throw new Error(`Failed to parse JSON from AI response:\n${rawText}`);
  }
}
