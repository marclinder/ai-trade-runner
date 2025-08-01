import { placeOrder, getPrices } from '../brokers/alpaca';
import { askLLMBatch } from '../llm/openai';
import { alpacaScreener } from '../screeners/alpaca';
import { getExitCandidates } from '../portfolio/manager';
import { logger } from '../utils/logger';
import { AgentResult, AlpacaOrder, LLMDecision, SymbolPrice, Trade } from '../screeners/types';

export const handler = async ():Promise<AgentResult> => {
  if (process.env.SHOULD_RUN !== 'true') {
    logger.info('Agent run aborted — SHOULD_RUN is not set to true.');
    return { statusCode: 200, body: 'SHOULD_RUN=false, skipping execution.' };
  }

  const trades: AlpacaOrder[] = [];
  // --- Close exit candidates ---
  const exitCandidates = await getExitCandidates();
  logger.info(`Found ${exitCandidates.length} exit candidates`);
  for (const { symbol, currentPrice, gain } of exitCandidates) {
    logger.info(`Exiting position: ${symbol} at $${currentPrice}, gain: ${(gain * 100).toFixed(2)}%`);
    const order = await placeOrder({ symbol, qty: 1, side: 'sell' });
    if(order)
      trades.push(order);
  }

  // --- Buy from screener ---
  const screenerCandidates = await alpacaScreener.getTradeCandidates();
  const symbols = screenerCandidates.map((c) => c.symbol);

  // Fetch current prices for all candidates
  const pricedCandidates = await getPrices(symbols);
  const llmDecisions: Record<string, LLMDecision> = await askLLMBatch(pricedCandidates);
  
  for (const { symbol, price } of pricedCandidates) {
    const action = llmDecisions[symbol]?.action;

    if (action === 'sell' && exitCandidates.find(c => c.symbol !== undefined)) {
      logger.info(`Skipping SELL for ${symbol} — not held`);
      continue;
    }

    if (action === 'buy' || action === 'sell') {
      logger.info(`Placing ${action.toUpperCase()} order for ${symbol} at $${price}`);
      const order = await placeOrder({ symbol, qty: 1, side: action });
      if(order)
        trades.push(order);
    }

    if (action === 'hold') {
      logger.info(`LLM advised to HOLD ${symbol}`);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Agent run complete', trades }),
  };
};
