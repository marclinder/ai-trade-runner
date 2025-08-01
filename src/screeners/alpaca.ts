import type { ScreenerPlugin } from './types';

export const alpacaScreener: ScreenerPlugin = {
    async getTradeCandidates() {
        // real logic
        return [
            { symbol: 'AAPL', price: 1 },
            { symbol: 'ETH/USD', price: 1 },
        ];
    }
};

export async function getFakeSignals() {
  return [{ symbol: 'FIG', price: 1 }];
}
