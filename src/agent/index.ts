import { placeOrder } from '../brokers/alpaca';
import { askLLM } from '../llm/openai';
import { alpacaScreener } from '../screeners/alpaca';
import { staticScreener } from '../screeners/static';

type TradeAction = 'BUY' | 'SELL' | 'HOLD';

function getMockPrice(): number {
  return Math.random() * 100;
}

function makeTradeDecision(price: number): TradeAction {
  if (price < 30) return 'BUY';
  if (price > 70) return 'SELL';
  return 'HOLD';
}

export const handler = async () => {
  const signals = await alpacaScreener.getTradeCandidates();
  // const signals = await staticScreener.getTradeCandidates();
  const trades:any[] = [];

  for (const { symbol, price } of signals) {
    const llmResponse = await askLLM(symbol, price);
    
    const action = 'buy';
    if (action === 'buy' || action === 'sell') {
      const order = await placeOrder({ symbol, qty: 1, side: action });
      trades.push(order);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Agent run complete', trades }) };
};

