export interface ScreenerPlugin {
  getTradeCandidates: () => Promise<{ symbol: string }[]>;
}