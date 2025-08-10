import { getPrice, getPrices } from "../brokers/alpaca";
import type { ScreenerPlugin, SymbolPrice } from './types';

export const staticScreener: ScreenerPlugin = {
  async getTradeCandidates() {
    const symbols = ["AAPL", "TSLA"];

    try {
      const priceMap = await getPrices(symbols);
      return priceMap;
    } catch (error) {
      console.error("Error fetching prices:", error);
      return [];
    }
  },
};
