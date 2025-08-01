import { placeOrder } from '../brokers/alpaca';
import { askLLM } from '../llm/openai';
import { getFakeSignals, screenerAlpaca } from '../screeners/alpaca';

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
  const signals = await screenerAlpaca.getTradeCandidates();
  const trades:any[] = [];

  for (const { symbol } of signals) {
    const llmResponse = await askLLM(` Symbol: ${symbol}. Buy, Sell, or Hold?`);
    
    const action = 'buy';
    debugger
    if (action === 'buy' || action === 'sell') {
      const order = await placeOrder({ symbol, qty: 1, side: action });
      trades.push(order);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Agent run complete', trades }) };
};

