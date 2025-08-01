import { placeOrder } from '../brokers/alpaca';
import { askLLM } from '../llm/openai';
import { alpacaScreener } from '../screeners/alpaca';
import { staticScreener } from '../screeners/static';
import { getExitCandidates } from '../portfolio/manager';
import { logger } from '../utils/logger';

export const handler = async () => {
  if (process.env.SHOULD_RUN !== 'true') {
    logger.info('Agent run aborted — SHOULD_RUN is not set to true.');
    return { statusCode: 200, body: 'SHOULD_RUN=false, skipping execution.' };
  }

  const trades: any[] = [];
  debugger
  // --- Close exit candidates ---
  const exitCandidates = await getExitCandidates();
  logger.info(`exitCandidates ${exitCandidates}`);
  for (const { symbol, currentPrice, gain } of exitCandidates) {
    logger.info(`Exiting position: ${symbol} at $${currentPrice}, gain: ${(gain * 100).toFixed(2)}%`);
    const order = await placeOrder({ symbol, qty: 1, side: 'sell' });
    trades.push(order);
  }

  // --- Buy from screener ---
  const signals = await alpacaScreener.getTradeCandidates();
  for (const { symbol, price } of signals) {
    const llmResponse = await askLLM(symbol, price);
    const action = llmResponse.toLowerCase();

    if (action === 'buy' || action === 'sell') {
      logger.info(`Placing ${action.toUpperCase()} order for ${symbol} at $${price}`);
      const order = await placeOrder({ symbol, qty: 1, side: action });
      trades.push(order);
    } else {
      logger.info(`LLM advised to HOLD ${symbol}`);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Agent run complete', trades }),
  };
};
