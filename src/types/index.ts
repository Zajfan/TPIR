export type Currency = 'SEK' | 'EUR' | 'USD';

export type HardwareCategory = 
  | 'gpu' 
  | 'cpu' 
  | 'ram' 
  | 'ssd' 
  | 'hdd' 
  | 'console' 
  | 'server' 
  | 'prebuilt';

export interface RetailerPrice {
  retailerId: string;
  retailerName: string;
  country: 'SE' | 'EU' | 'US';
  logoText: string;
  inStock: boolean;
  stockCount?: number;
  price: number; // in base retailer currency
  currency: Currency;
  url: string;
  lastUpdated: string;
}

export interface PriceCandle {
  time: string; // YYYY-MM-DD
  open: number; // in USD base
  high: number;
  low: number;
  close: number;
  volume: number; // listing count / liquidity indicator
}

export interface PrognosisPoint {
  time: string;
  projectedPrice: number;
  lowerConfidence: number;
  upperConfidence: number;
}

export interface TechnicalAnalysis {
  dealScore: number; // 0 - 100
  rating: 'STRONG_BUY' | 'GOOD_DEAL' | 'FAIR_PRICE' | 'OVERPRICED' | 'DON_T_BUY';
  rvi: number; // 0-100 Relative Value Index (30 = oversold/cheap, 70 = overbought/expensive)
  sma30: number;
  sma90: number;
  trend: 'dropping' | 'stable' | 'rising';
  forecastedChange30dPct: number;
  allTimeLow: {
    price: number;
    date: string;
    retailer: string;
  };
  allTimeHigh: {
    price: number;
    date: string;
    retailer: string;
  };
  fairValuePrice: number;
  recommendationReason: string;
  marketCycleNote: string;
  forecastPoints: PrognosisPoint[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: HardwareCategory;
  model: string;
  specs: Record<string, string>;
  msrpUSD: number;
  msrpEUR: number;
  msrpSEK: number;
  releaseDate: string;
  imageUrl: string;
  retailers: RetailerPrice[];
  history: PriceCandle[];
}

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  targetPrice: number;
  targetCurrency: Currency;
  active: boolean;
  createdAt: string;
  triggered: boolean;
}
