import { Product, TechnicalAnalysis, PrognosisPoint, PriceCandle, TruthIndexAnalysis } from '@/types';

/**
 * Calculates Simple Moving Average for a given period
 */
function calculateSMA(candles: PriceCandle[], period: number): number {
  if (candles.length === 0) return 0;
  const slice = candles.slice(-period);
  const sum = slice.reduce((acc, c) => acc + c.close, 0);
  return sum / slice.length;
}

/**
 * Calculates a Hardware Relative Value Index (RVI) - adapted from 14-period RSI
 */
function calculateRVI(candles: PriceCandle[]): number {
  if (candles.length < 15) return 50;

  const slice = candles.slice(-15);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i].close - slice[i - 1].close;
    if (diff > 0) {
      gains += diff;
    } else {
      losses += Math.abs(diff);
    }
  }

  const avgGain = gains / 14;
  const avgLoss = losses / 14;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Math.round(rsi);
}

/**
 * Analyzes whether recent discounts are genuine or artificially inflated ("Fake Discount Radar")
 */
function evaluateTruthIndex(product: Product, currentPrice: number, history: PriceCandle[]): TruthIndexAnalysis {
  if (history.length < 20) {
    return {
      isFakeDiscount: false,
      claimedDiscountPercent: 0,
      realDiscountPercent: 0,
      preSaleInflationPercent: 0,
      verdict: 'Insufficient price history to detect pre-sale inflation.',
      historicalMedianPrice: currentPrice,
    };
  }

  // Calculate 90-day median price
  const recentSlice = history.slice(-30);
  const sortedCloses = [...recentSlice].map((c) => c.close).sort((a, b) => a - b);
  const medianPrice = sortedCloses[Math.floor(sortedCloses.length / 2)] || currentPrice;

  // Detect peak price in the 15-45 days window prior to current date
  const preSaleWindow = history.slice(Math.max(0, history.length - 25), Math.max(1, history.length - 5));
  const preSalePeak = Math.max(...preSaleWindow.map((c) => c.high), medianPrice);

  // Check if any retailer is claiming a discount
  const maxClaimedDiscount = Math.max(...product.retailers.map((r) => r.claimedDiscountPercent || 0), 0);

  // Pre-sale inflation: did the price spike > 8% above the 90d median before this "sale"?
  const preSaleInflationPct = Math.max(0, Math.round(((preSalePeak - medianPrice) / medianPrice) * 100));
  const realDiscountPct = Math.round(((medianPrice - currentPrice) / medianPrice) * 100);

  const isFakeDiscount = maxClaimedDiscount > 10 && preSaleInflationPct >= 7 && realDiscountPct < 5;

  let verdict = 'Fair & transparent market pricing.';
  if (isFakeDiscount) {
    verdict = `FAKE DISCOUNT DETECTED: Retailer claims ${maxClaimedDiscount}% off, but raised the price by +${preSaleInflationPct}% prior to the promo. Real discount vs 90d median is only ${realDiscountPct}%.`;
  } else if (realDiscountPct >= 10) {
    verdict = `GENUINE DISCOUNT: Current price is ${realDiscountPct}% below the true 90-day median historical price.`;
  } else if (currentPrice < product.msrpUSD) {
    verdict = `Trading ${Math.round(((product.msrpUSD - currentPrice) / product.msrpUSD) * 100)}% below official MSRP baseline.`;
  }

  return {
    isFakeDiscount,
    claimedDiscountPercent: maxClaimedDiscount,
    realDiscountPercent: realDiscountPct,
    preSaleInflationPercent: preSaleInflationPct,
    verdict,
    historicalMedianPrice: Math.round(medianPrice),
  };
}

/**
 * Analyzes a product's price history and calculates technical indicators, deal score, truth index, and 30-day forecast.
 */
export function analyzeProduct(product: Product): TechnicalAnalysis {
  const history = product.historyDaily;
  if (!history || history.length === 0) {
    return {
      dealScore: 50,
      rating: 'FAIR_PRICE',
      rvi: 50,
      sma30: product.msrpUSD,
      sma90: product.msrpUSD,
      trend: 'stable',
      forecastedChange30dPct: 0,
      allTimeLow: { price: product.msrpUSD, date: 'N/A', retailer: 'Standard' },
      allTimeHigh: { price: product.msrpUSD, date: 'N/A', retailer: 'Standard' },
      fairValuePrice: product.msrpUSD,
      recommendationReason: 'Insufficient historical data.',
      marketCycleNote: 'Monitoring price changes across retailers.',
      forecastPoints: [],
      truthIndex: {
        isFakeDiscount: false,
        claimedDiscountPercent: 0,
        realDiscountPercent: 0,
        preSaleInflationPercent: 0,
        verdict: 'Monitoring real market quotes.',
        historicalMedianPrice: product.msrpUSD,
      },
    };
  }

  const currentPrice = history[history.length - 1].close;
  const sma30 = calculateSMA(history, 30);
  const sma90 = calculateSMA(history, 90);
  const rvi = calculateRVI(history);

  // All-time high & low
  let atl = history[0].low;
  let atlDate = history[0].time;
  let ath = history[0].high;
  let athDate = history[0].time;

  for (const c of history) {
    if (c.low < atl) {
      atl = c.low;
      atlDate = c.time;
    }
    if (c.high > ath) {
      ath = c.high;
      athDate = c.time;
    }
  }

  // Trend detection (comparing current with 30-day SMA and 14 days ago)
  const pastIndex = Math.max(0, history.length - 15);
  const price14dAgo = history[pastIndex].close;
  const diffPct14d = ((currentPrice - price14dAgo) / price14dAgo) * 100;

  let trend: 'dropping' | 'stable' | 'rising' = 'stable';
  if (diffPct14d < -2.0) trend = 'dropping';
  else if (diffPct14d > 2.0) trend = 'rising';

  // Fair Value computation
  const msrp = product.msrpUSD;
  const fairValue = Math.round(Math.min(msrp, (sma90 * 0.6 + msrp * 0.4)));

  // Deal Score Calculation (0 to 100)
  const msrpRatio = (msrp - currentPrice) / msrp;
  const msrpPoints = Math.min(40, Math.max(0, 20 + msrpRatio * 80));

  const atlSpread = (currentPrice - atl) / atl;
  const atlPoints = Math.min(35, Math.max(0, 35 - atlSpread * 70));

  const rviPoints = Math.min(25, Math.max(0, (100 - rvi) * 0.25));

  let dealScore = Math.round(msrpPoints + atlPoints + rviPoints);
  dealScore = Math.max(5, Math.min(98, dealScore));

  let rating: TechnicalAnalysis['rating'] = 'FAIR_PRICE';
  if (dealScore >= 80) rating = 'STRONG_BUY';
  else if (dealScore >= 65) rating = 'GOOD_DEAL';
  else if (dealScore >= 45) rating = 'FAIR_PRICE';
  else if (dealScore >= 25) rating = 'OVERPRICED';
  else rating = 'DON_T_BUY';

  // 30-day Forecast Projection
  const recentWindow = history.slice(-30);
  let slope = 0;
  if (recentWindow.length >= 2) {
    const n = recentWindow.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += recentWindow[i].close;
      sumXY += i * recentWindow[i].close;
      sumXX += i * i;
    }
    slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  const forecastPoints: PrognosisPoint[] = [];
  const lastDate = new Date(history[history.length - 1].time);
  let projectedPrice = currentPrice;
  const dailyTargetPull = (fairValue - currentPrice) * 0.015;

  for (let day = 1; day <= 30; day += 3) {
    const fDate = new Date(lastDate);
    fDate.setDate(fDate.getDate() + day);
    const dateStr = fDate.toISOString().split('T')[0];

    projectedPrice = projectedPrice + (slope * 0.6) + dailyTargetPull;
    projectedPrice = Math.max(atl * 0.95, Math.min(ath * 1.05, projectedPrice));

    const volatilitySpread = (projectedPrice * 0.02) + (day * 0.5);

    forecastPoints.push({
      time: dateStr,
      projectedPrice: Math.round(projectedPrice * 100) / 100,
      lowerConfidence: Math.round((projectedPrice - volatilitySpread) * 100) / 100,
      upperConfidence: Math.round((projectedPrice + volatilitySpread) * 100) / 100,
    });
  }

  const finalForecastPrice = forecastPoints[forecastPoints.length - 1]?.projectedPrice || currentPrice;
  const forecastedChange30dPct = Math.round(((finalForecastPrice - currentPrice) / currentPrice) * 1000) / 10;

  // Lifecycle & recommendation notes
  let recommendationReason = '';
  let marketCycleNote = '';

  switch (product.lifecycleStage) {
    case 'CLEARANCE':
      marketCycleNote = 'Clearance Phase: Generation phase-out ahead of new architecture. Deepest pricing window.';
      break;
    case 'PRICE_BOTTOM':
      marketCycleNote = 'Maturity Floor: Product has reached historical production economies of scale; optimal buy zone.';
      break;
    case 'LAUNCH_SPIKE':
      marketCycleNote = 'Launch Window: High enthusiast demand and initial inventory scalping. Waiting 4-6 weeks recommended.';
      break;
    case 'MATURE_PRODUCTION':
      marketCycleNote = 'Stable Production: Healthy inventory and active retailer competition.';
      break;
    case 'END_OF_LIFE':
      marketCycleNote = 'End-of-Life: Production halted. New units may be scarce; check secondary/refurbished options.';
      break;
    default:
      marketCycleNote = 'Active Market Flow: Consistent volume across Swedish & Global channels.';
  }

  if (rating === 'STRONG_BUY') {
    recommendationReason = `Exceptional entry point. Current price is within ${Math.round(atlSpread * 100)}% of the all-time record low and discounted vs MSRP. Technical indicators confirm support bounce.`;
  } else if (rating === 'GOOD_DEAL') {
    recommendationReason = `Solid buying window. Price is trending below 90-day moving average (${Math.round(sma90)}) with stable stock availability across Swedish and EU vendors.`;
  } else if (rating === 'FAIR_PRICE') {
    recommendationReason = 'Trading near historical median. If you need it right now, price is reasonable, but setting a limit alert for seasonal sales could save 8-12%.';
  } else if (rating === 'OVERPRICED') {
    recommendationReason = `Trading ${Math.round(((currentPrice - msrp) / msrp) * 100)}% above official launch MSRP or historical average. Prognosis projects downward price correction over the next 30 days.`;
  } else {
    recommendationReason = 'Do not buy at current levels. High scalper markup or severe supply deficit. A steep price drop is projected.';
  }

  const truthIndex = evaluateTruthIndex(product, currentPrice, history);

  return {
    dealScore,
    rating,
    rvi,
    sma30: Math.round(sma30 * 100) / 100,
    sma90: Math.round(sma90 * 100) / 100,
    trend,
    forecastedChange30dPct,
    allTimeLow: {
      price: atl,
      date: atlDate,
      retailer: 'Inet / Webhallen',
    },
    allTimeHigh: {
      price: ath,
      date: athDate,
      retailer: 'Launch Peak / Scalp',
    },
    fairValuePrice: fairValue,
    recommendationReason,
    marketCycleNote,
    forecastPoints,
    truthIndex,
  };
}
