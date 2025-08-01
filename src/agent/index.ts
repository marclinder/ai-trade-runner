import { placeOrder } from '../brokers/alpaca';
import { askLLM } from '../llm/openai';
import { alpacaScreener } from '../screeners/alpaca';
import { staticScreener } from '../screeners/static';

type TradeAction = 'BUY' | 'SELL' | 'HOLD';

export const handler = async () => {
  const signals = await alpacaScreener.getTradeCandidates();
  const trades:any[] = [];
  debugger;
  for (const { symbol, price } of signals) {
    const llmResponse = await askLLM(symbol, price);
    // const action = llmResponse.toLocaleLowerCase();
    const action = 'buy';

    if (action === 'buy' || action === 'sell') {
      const order = await placeOrder({ symbol, qty: 1, side: action });
      trades.push(order);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Agent run complete', trades }) };
};

