import Alpaca from '@alpacahq/alpaca-trade-api';
import type { Asset, ScreenerPlugin } from './types';
import { getPrice } from '../brokers/alpaca'; // Adjust if needed

const {
  ALPACA_API_KEY,
  ALPACA_SECRET_KEY,
  ALPACA_USE_PAPER = 'true',
} = process.env;

if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
  throw new Error('Missing Alpaca credentials');
}

const alpaca = new Alpaca({
  keyId: ALPACA_API_KEY,
  secretKey: ALPACA_SECRET_KEY,
  paper: ALPACA_USE_PAPER === 'true',
});

export const alpacaScreener: ScreenerPlugin = {
  async getTradeCandidates() {
    const activeAssets:Asset[] = await alpaca.getAssets({ status: 'active' });
    const tradableStocks = activeAssets
      .filter((a) => a.tradable && a.easy_to_borrow && a.exchange === 'NASDAQ')
      .slice(0, 20);

    const results = 
    await Promise.all(
      tradableStocks.map(async ({ symbol }) => {
        const price = await getPrice(symbol);
        return price !== undefined ? { symbol, price } : null;
      })
    );

    return results.filter(Boolean) as { symbol: string; price: number }[];
  },
};
