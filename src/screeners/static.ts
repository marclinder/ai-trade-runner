import { getPrice } from "../brokers/alpaca";
import type { ScreenerPlugin } from './types';

export const staticScreener: ScreenerPlugin = {
  async getTradeCandidates() {
    const symbols = ["AAPL", "TSLA"];

    const candidates = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const price = await getPrice(symbol);
          return { symbol, price };
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
          return null;
        }
      })
    );

    return candidates.filter((c): c is { symbol: string; price: number } => !!c);
  }
};
