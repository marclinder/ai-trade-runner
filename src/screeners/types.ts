export interface ScreenerPlugin {
  getTradeCandidates: () => Promise<{ symbol: string, price: number }[]>;
}

export type TradeAction = 'buy' | 'sell' | 'hold';

export interface Asset {
  id: string;
  class: string;
  exchange: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
  easy_to_borrow: boolean;
  fractionable: boolean;
  maintenance_margin_requirement: number;
  margin_requirement_long: string;
  margin_requirement_short: string;
}

export interface SymbolPrice {
  symbol: string; 
  price: number;
}