// src/plugins/llm-openai/index.ts
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import dotenv from 'dotenv';
import { TradeAction } from '../../screeners/types';
dotenv.config(); // Load from root .env

const {
  OPENAI_API_KEY,
  OPENAI_MODEL = 'gpt-4o',
  OPENAI_TEMPERATURE = '0.2',
  OPENAI_MAX_TOKENS = '300',
} = process.env;

if (!OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key in environment variables');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function askLLM(symbol: string, price: number): Promise<TradeAction> {
  const prompt:ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a trading bot that makes one of three decisions: BUY, SELL, or HOLD.`,
    },
    {
      role: 'user',
      content: `You are a crypto trading assistant. Based on a current price of $${price.toFixed(2)} for ${symbol}, respond with only one word: BUY, SELL, or HOLD. No explanation.`,
    },
  ];

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: parseFloat(OPENAI_TEMPERATURE),
    max_tokens: parseInt(OPENAI_MAX_TOKENS),
    messages: prompt,
  });

  const raw = response.choices[0].message.content?.trim().toUpperCase();
  if (raw !== 'BUY' && raw !== 'SELL' && raw !== 'HOLD') throw new Error(`Unexpected LLM response: ${raw}`);
  return raw as TradeAction;
}