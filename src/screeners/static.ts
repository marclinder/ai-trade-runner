import { getPrice, getPrices } from "../brokers/alpaca";
import type { ScreenerPlugin } from './types';

export const staticScreener: ScreenerPlugin = {
  async getTradeCandidates() {
    const symbols = ["AAPL", "TSLA"];

    try {
      const priceMap = await getPrices(symbols);

      const candidates = symbols
        .map((symbol) => {
          const price = priceMap[symbol];
          if (price === undefined) return null;
          return { symbol, price };
        })
        .filter(Boolean) as { symbol: string; price: number }[];

      return candidates;
    } catch (error) {
      console.error("Error fetching prices:", error);
      return [];
    }
  },
};
