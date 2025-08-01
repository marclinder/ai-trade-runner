export interface ScreenerPlugin {
  getTradeCandidates: () => Promise<{ symbol: string, price: number }[]>;
}

export type TradeAction = 'buy' | 'sell' | 'hold';