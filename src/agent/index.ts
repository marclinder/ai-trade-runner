import { placeOrder } from '../brokers/alpaca';
import { askLLM } from '../llm/openai';
import { alpacaScreener } from '../screeners/alpaca';
import { staticScreener } from '../screeners/static';

type TradeAction = 'BUY' | 'SELL' | 'HOLD';


export const handler = async () => {
  if (process.env.SHOULD_RUN !== 'true') {
    console.log('Agent run aborted — SHOULD_RUN is not set to true.');
    return { statusCode: 200, body: 'SHOULD_RUN=false, skipping execution.' };
  }

  const signals = await alpacaScreener.getTradeCandidates();
  const trades: any[] = [];
  for (const { symbol, price } of signals) {
    const llmResponse = await askLLM(symbol, price);
    const action = llmResponse.toLowerCase();

    if (action === 'buy' || action === 'sell') {
      const order = await placeOrder({ symbol, qty: 1, side: action });
      trades.push(order);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Agent run complete', trades }) };
};

