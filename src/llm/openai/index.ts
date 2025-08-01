import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { LLMDecision, SymbolPrice, TradeAction } from '../../screeners/types';

const {
  OPENAI_API_KEY,
  OPENAI_MODEL = 'gpt-4o',
  OPENAI_TEMPERATURE = '0.2',
  OPENAI_MAX_TOKENS = '500',
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

export async function askLLMBatch(inputs: SymbolPrice[]): Promise<Record<string, LLMDecision>> {
  const prompt: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a crypto trading assistant. For each asset, return a JSON object with the following keys:

- action: one of "BUY", "SELL", "HOLD"
- confidence: a number from 0 to 1 representing confidence in your decision
- explanation: a one-line explanation of the rationale

Example format:
{
  "AAPL": { "action": "BUY", "confidence": 0.8, "explanation": "Strong upward momentum and volume spike." },
  "TSLA": { "action": "HOLD", "confidence": 0.5, "explanation": "Price is consolidating near resistance." }
}`,
    },
    {
      role: 'user',
      content: `Evaluate the following assets with their current prices:
${inputs.map(({ symbol, price }) => `${symbol}: $${price.toFixed(2)}`).join('\n')}`,
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

  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    raw = codeBlockMatch[1];
  }

  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse batch LLM response:\n${raw}`);
  }

  const result: Record<string, LLMDecision> = {};
  for (const [symbol, entry] of Object.entries(parsed)) {
    const action = entry.action?.toUpperCase();
    const confidence = parseFloat(entry.confidence);
    const explanation = entry.explanation?.trim();

    if (!['BUY', 'SELL', 'HOLD'].includes(action)) {
      throw new Error(`Invalid action for ${symbol}: ${action}`);
    }
    if (isNaN(confidence) || confidence < 0 || confidence > 1) {
      throw new Error(`Invalid confidence score for ${symbol}: ${confidence}`);
    }

    result[symbol] = {
      action: action as TradeAction,
      confidence,
      explanation,
    };
  }

  return result;
}
