import { placeOrder, getPrices } from '../brokers/alpaca';
import { askLLMBatch } from '../llm/openai';
import { alpacaScreener } from '../screeners/alpaca';
import { getExitCandidates } from '../portfolio/manager';
import { logger } from '../utils/logger';
import { SymbolPrice } from '../screeners/types';

export const handler = async () => {
  if (process.env.SHOULD_RUN !== 'true') {
    logger.info('Agent run aborted — SHOULD_RUN is not set to true.');
    return { statusCode: 200, body: 'SHOULD_RUN=false, skipping execution.' };
  }

  const trades: any[] = [];

  // --- Close exit candidates ---
  const exitCandidates = await getExitCandidates();
  logger.info(`Found ${exitCandidates.length} exit candidates`);
  for (const { symbol, currentPrice, gain } of exitCandidates) {
    logger.info(`Exiting position: ${symbol} at $${currentPrice}, gain: ${(gain * 100).toFixed(2)}%`);
    const order = await placeOrder({ symbol, qty: 1, side: 'sell' });
    trades.push(order);
  }

  // --- Buy from screener ---
  const screenerCandidates = await alpacaScreener.getTradeCandidates();
  const symbols = screenerCandidates.map((c) => c.symbol);

  // Fetch current prices for all candidates
  const priceMap = await getPrices(symbols);

  // Build { symbol, price } array
  const pricedCandidates = symbols
    .map((symbol) => {
      const bar = priceMap.get(symbol);
      if (!bar) return null;
      return { symbol, price: bar.ClosePrice };
    })
    .filter(Boolean) as SymbolPrice[] ;

  const llmDecisions = await askLLMBatch(pricedCandidates);

  for (const { symbol, price } of pricedCandidates) {
    const action = llmDecisions[symbol]?.toLowerCase();
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
