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

export type Timeframe = '1H' | '24H' | '7D' | '1M' | '3M' | '1Y' | 'ALL';

export type LifecycleStage = 
  | 'ANNOUNCED' 
  | 'LAUNCH_SPIKE' 
  | 'MATURE_PRODUCTION' 
  | 'PRICE_BOTTOM' 
  | 'CLEARANCE' 
  | 'END_OF_LIFE';

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
  claimedDiscountPercent?: number; // e.g. "Save 20%"
}

export interface PriceCandle {
  time: string; // YYYY-MM-DD or YYYY-MM-DD HH:mm for intraday
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

export interface TruthIndexAnalysis {
  isFakeDiscount: boolean;
  claimedDiscountPercent: number;
  realDiscountPercent: number;
  preSaleInflationPercent: number;
  verdict: string;
  historicalMedianPrice: number;
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
  truthIndex: TruthIndexAnalysis;
}

export interface ProductPerformance {
  scoreType: 'FPS' | 'COMPUTE_TFLOPS' | 'MB_PER_SEC' | 'IOPS' | 'GENERAL';
  scoreValue: number; // e.g. 142 fps @ 4K, 14500 MB/s, 72 TFLOPS
  scoreLabel: string;
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
  lifecycleStage: LifecycleStage;
  powerWatts: number; // For enterprise & gamer TCO
  performance: ProductPerformance;
  imageUrl: string;
  retailers: RetailerPrice[];
  historyDaily: PriceCandle[]; // Multi-month / ALL
  historyIntraday: PriceCandle[]; // 24-48 hours hourly flux
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

export interface PortfolioItem {
  productId: string;
  quantity: number;
  targetPrice?: number;
}

export interface WatchlistPortfolio {
  id: string;
  name: string;
  description: string;
  categoryIcon: 'rig' | 'server' | 'upgrade' | 'custom';
  items: PortfolioItem[];
  createdAt: string;
}
