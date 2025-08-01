import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { SymbolPrice, TradeAction } from '../../screeners/types';

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
  const prompt: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a trading bot that makes one of three decisions: BUY, SELL, or HOLD.`,
    },
    {
      role: 'user',
      content: `You are a crypto trading assistant. Based on a current price of $${price.toFixed(
        2
      )} for ${symbol}, respond with only one word: BUY, SELL, or HOLD. No explanation.`,
    },
  ];

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: parseFloat(OPENAI_TEMPERATURE),
    max_tokens: parseInt(OPENAI_MAX_TOKENS),
    messages: prompt,
  });

  const raw = response.choices[0].message.content?.trim().toUpperCase();
  console.log('askLLM', symbol, price, '→', raw);

  if (raw !== 'BUY' && raw !== 'SELL' && raw !== 'HOLD') {
    throw new Error(`Unexpected LLM response for ${symbol}: ${raw}`);
  }

  return raw as TradeAction;
}

export async function askLLMBatch(
  inputs: SymbolPrice[]
): Promise<Record<string, TradeAction>> {
  const list = inputs
    .map(({ symbol, price }) => `- ${symbol} at $${price.toFixed(2)}`)
    .join('\n');

  const prompt: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a trading bot. For each asset, make a decision: BUY, SELL, or HOLD. Reply in JSON format: { "AAPL": "BUY", "TSLA": "HOLD", ... }`,
    },
    {
      role: 'user',
      content: `Evaluate the following assets:\n${list}`,
    },
  ];

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: parseFloat(OPENAI_TEMPERATURE),
    max_tokens: parseInt(OPENAI_MAX_TOKENS),
    messages: prompt,
  });

  let raw = response.choices[0].message.content?.trim();
  console.log('askLLMBatch → raw response:\n', raw);
  if (!raw) throw new Error('No response from LLM in batch mode');

  // Strip code block formatting, e.g. ```json\n{...}\n```
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    raw = codeBlockMatch[1];
  }

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse batch LLM response: ${raw}`);
  }

  const result: Record<string, TradeAction> = {};
  for (const [symbol, decision] of Object.entries(parsed)) {
    const action = decision?.trim().toUpperCase();
    if (action !== 'BUY' && action !== 'SELL' && action !== 'HOLD') {
      throw new Error(`Unexpected LLM response for ${symbol}: ${decision}`);
    }
    result[symbol] = action as TradeAction;
  }

  return result;
}
