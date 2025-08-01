import type { ScreenerPlugin } from './types';

export const screenerAlpaca: ScreenerPlugin = {
    async getTradeCandidates() {
        // real logic
        return [
            { symbol: 'AAPL' },
            { symbol: 'ETH/USD' },
        ];
    }
};

export async function getFakeSignals() {
  return [{ symbol: 'FIG', confidence: 0.93 }];
}
