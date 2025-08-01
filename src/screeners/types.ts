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

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  status: string;
  submittedAt: string;
  filledQty: string;
  filledAvgPrice?: string | null;
}

export interface AgentResult {
  statusCode: number;
  body: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  failed_at: string | null;
  replaced_at: string | null;
  replaced_by: string | null;
  replaces: string | null;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional: number | null;
  qty: string;
  filled_qty: string;
  filled_avg_price: number | null;
  order_class: string;
  order_type: string;
  type: string;
  side: 'buy' | 'sell';
  position_intent: string;
  time_in_force: string;
  limit_price: number | null;
  stop_price: number | null;
  status: string;
  extended_hours: boolean;
  legs: null | AlpacaOrder[]; // nested orders if multi-leg
  trail_percent: number | null;
  trail_price: number | null;
  hwm: number | null;
  subtag: string | null;
  source: string | null;
  expires_at: string;
}

export interface AlpacaOrderRequest {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
}
