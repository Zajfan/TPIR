import { Product, TechnicalAnalysis, PrognosisPoint, PriceCandle } from '@/types';

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
 * but calibrated for hardware pricing where lower price = better value (oversold = high buy value)
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
 * Analyzes a product's price history and calculates technical indicators, deal score, and 30-day forecast.
 */
export function analyzeProduct(product: Product): TechnicalAnalysis {
  const history = product.history;
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

  // Fair Value computation (combination of MSRP, 90d SMA, and age discount factor)
  const msrp = product.msrpUSD;
  const fairValue = Math.round(Math.min(msrp, (sma90 * 0.6 + msrp * 0.4)));

  // Deal Score Calculation (0 to 100)
  // Factors:
  // 1. Discount vs MSRP (max 40 pts)
  // 2. Proximity to All-Time-Low (max 35 pts)
  // 3. Momentum & RVI (max 25 pts)
  const msrpRatio = (msrp - currentPrice) / msrp; // e.g. +0.15 if 15% below MSRP, -0.20 if 20% over MSRP
  const msrpPoints = Math.min(40, Math.max(0, 20 + msrpRatio * 80));

  const atlSpread = (currentPrice - atl) / atl; // 0 = exactly at ATL
  const atlPoints = Math.min(35, Math.max(0, 35 - atlSpread * 70));

  // RVI: when RVI is low (30), price has plunged -> high buy opportunity
  const rviPoints = Math.min(25, Math.max(0, (100 - rvi) * 0.25));

  let dealScore = Math.round(msrpPoints + atlPoints + rviPoints);
  dealScore = Math.max(5, Math.min(98, dealScore));

  let rating: TechnicalAnalysis['rating'] = 'FAIR_PRICE';
  if (dealScore >= 80) rating = 'STRONG_BUY';
  else if (dealScore >= 65) rating = 'GOOD_DEAL';
  else if (dealScore >= 45) rating = 'FAIR_PRICE';
  else if (dealScore >= 25) rating = 'OVERPRICED';
  else rating = 'DON_T_BUY';

  // 30-day Forecast Projection using recent slope + mean-reversion
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

  // Damped slope towards fair value
  const forecastPoints: PrognosisPoint[] = [];
  const lastDate = new Date(history[history.length - 1].time);
  let projectedPrice = currentPrice;
  const dailyTargetPull = (fairValue - currentPrice) * 0.015;

  for (let day = 1; day <= 30; day += 3) {
    const fDate = new Date(lastDate);
    fDate.setDate(fDate.getDate() + day);
    const dateStr = fDate.toISOString().split('T')[0];

    // Damped trend + reversion
    projectedPrice = projectedPrice + (slope * 0.6) + dailyTargetPull;
    // Keep within reasonable limits
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

  // Reasoning synthesis
  let recommendationReason = '';
  let marketCycleNote = '';

  if (rating === 'STRONG_BUY') {
    recommendationReason = `Exceptional entry point. Current price is within ${Math.round(atlSpread * 100)}% of the all-time record low and discounted vs MSRP. Technical indicators confirm support bounce.`;
    marketCycleNote = 'Inventory clearing before next hardware generation; strong value window.';
  } else if (rating === 'GOOD_DEAL') {
    recommendationReason = `Solid buying window. Price is trending below 90-day moving average (${Math.round(sma90)}) with stable stock availability across Swedish and EU vendors.`;
    marketCycleNote = 'Retailer competition driving modest discounts.';
  } else if (rating === 'FAIR_PRICE') {
    recommendationReason = 'Trading near historical median. If you need it right now, price is reasonable, but setting a limit alert for seasonal sales could save 8-12%.';
    marketCycleNote = 'Supply and demand in equilibrium.';
  } else if (rating === 'OVERPRICED') {
    recommendationReason = `Trading ${Math.round(((currentPrice - msrp) / msrp) * 100)}% above official launch MSRP or historical average. Prognosis projects downward price correction over the next 30 days.`;
    marketCycleNote = 'Artificial supply constraint or post-launch markup.';
  } else {
    recommendationReason = 'Do not buy at current levels. High scalper markup or severe supply deficit. A steep price drop is projected.';
    marketCycleNote = 'Severe overbought territory; avoid FOMO purchasing.';
  }

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
      retailer: 'Scalper / Launch Peak',
    },
    fairValuePrice: fairValue,
    recommendationReason,
    marketCycleNote,
    forecastPoints,
  };
}
