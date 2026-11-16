'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ColorType,
  CandlestickData,
  LineData,
  HistogramData,
  Time,
  CandlestickSeries,
  AreaSeries,
  LineSeries,
  HistogramSeries,
  LineStyle,
} from 'lightweight-charts';
import { Product, Currency, TechnicalAnalysis, Timeframe } from '@/types';
import { convertCurrency, formatPrice } from '@/lib/currency';
import { TrendingUp, BarChart2, Activity, Clock } from 'lucide-react';

interface PriceChartProps {
  product: Product;
  analysis: TechnicalAnalysis;
  currency: Currency;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}

export default function PriceChart({
  product,
  analysis,
  currency,
  timeframe,
  onTimeframeChange,
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const [chartType, setChartType] = useState<'candlestick' | 'area'>('candlestick');
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [showMSRP, setShowMSRP] = useState<boolean>(true);
  const [showForecast, setShowForecast] = useState<boolean>(true);

  const [hoveredData, setHoveredData] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  } | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0f19' },
        textColor: '#94a3b8',
        fontSize: 12,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)' },
      },
      crosshair: {
        vertLine: { color: '#38bdf8', width: 1, style: LineStyle.Dotted },
        horzLine: { color: '#38bdf8', width: 1, style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        textColor: '#94a3b8',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });

    chartRef.current = chart;

    // Choose dataset based on timeframe: intraday for 1H/24H, daily for larger
    const isIntraday = timeframe === '1H' || timeframe === '24H';
    const rawData = isIntraday
      ? product.historyIntraday.slice(timeframe === '1H' ? -12 : -24)
      : timeframe === '7D'
      ? product.historyDaily.slice(-7)
      : timeframe === '1M'
      ? product.historyDaily.slice(-15)
      : timeframe === '3M'
      ? product.historyDaily.slice(-30)
      : timeframe === '1Y'
      ? product.historyDaily.slice(-60)
      : product.historyDaily;

    const convertedCandles: CandlestickData<Time>[] = rawData.map((c) => ({
      time: (isIntraday ? Math.floor(new Date(c.time).getTime() / 1000) : c.time) as Time,
      open: convertCurrency(c.open, 'USD', currency),
      high: convertCurrency(c.high, 'USD', currency),
      low: convertCurrency(c.low, 'USD', currency),
      close: convertCurrency(c.close, 'USD', currency),
    }));

    // Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const volumeData: HistogramData<Time>[] = rawData.map((c) => ({
      time: (isIntraday ? Math.floor(new Date(c.time).getTime() / 1000) : c.time) as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)',
    }));
    volumeSeries.setData(volumeData);

    // Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
      visible: chartType === 'candlestick',
    });
    candleSeries.setData(convertedCandles);

    // Area Series
    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(56, 189, 248, 0.45)',
      bottomColor: 'rgba(56, 189, 248, 0.01)',
      lineColor: '#38bdf8',
      lineWidth: 2,
      visible: chartType === 'area',
    });
    const areaData: LineData<Time>[] = convertedCandles.map((c) => ({
      time: c.time,
      value: c.close,
    }));
    areaSeries.setData(areaData);

    // SMA-30 Line (for daily timeframes)
    if (!isIntraday && showSMA) {
      const sma30Series = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 2,
        title: 'SMA-30',
        visible: showSMA,
      });

      const sma30Data: LineData<Time>[] = [];
      for (let i = 0; i < convertedCandles.length; i++) {
        if (i >= 5) {
          const windowSlice = convertedCandles.slice(Math.max(0, i - 5), i + 1);
          const avg = windowSlice.reduce((sum, item) => sum + item.close, 0) / windowSlice.length;
          sma30Data.push({
            time: convertedCandles[i].time,
            value: Math.round(avg * 100) / 100,
          });
        }
      }
      sma30Series.setData(sma30Data);
    }

    // MSRP Price Line
    const msrpConverted = convertCurrency(product.msrpUSD, 'USD', currency);
    if (showMSRP) {
      candleSeries.createPriceLine({
        price: msrpConverted,
        color: '#06b6d4',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'MSRP',
      });
    }

    // All-time low line
    const atlConverted = convertCurrency(analysis.allTimeLow.price, 'USD', currency);
    candleSeries.createPriceLine({
      price: atlConverted,
      color: '#10b981',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: 'All-Time Low',
    });

    // Prognosis Forecast Series (for daily timeframes)
    if (!isIntraday && showForecast && analysis.forecastPoints.length > 0) {
      const forecastSeries = chart.addSeries(LineSeries, {
        color: '#a855f7',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: 'Prognosis (30d)',
      });

      const forecastData: LineData<Time>[] = [
        {
          time: convertedCandles[convertedCandles.length - 1].time,
          value: convertedCandles[convertedCandles.length - 1].close,
        },
        ...analysis.forecastPoints.map((fp) => ({
          time: fp.time as Time,
          value: convertCurrency(fp.projectedPrice, 'USD', currency),
        })),
      ];
      forecastSeries.setData(forecastData);
    }

    // Crosshair hover subscribe
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current!.clientHeight
      ) {
        setHoveredData(null);
      } else {
        const targetSeries = chartType === 'candlestick' ? candleSeries : areaSeries;
        const candle = param.seriesData.get(targetSeries) as (CandlestickData<Time> | LineData<Time>) | undefined;
        const vol = param.seriesData.get(volumeSeries) as HistogramData<Time> | undefined;

        if (candle) {
          let timeDisplay = String(param.time);
          if (typeof param.time === 'number') {
            timeDisplay = new Date(param.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }

          if ('open' in candle) {
            setHoveredData({
              time: timeDisplay,
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: vol?.value,
            });
          } else {
            setHoveredData({
              time: timeDisplay,
              close: candle.value,
              volume: vol?.value,
            });
          }
        }
      }
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [product, currency, chartType, showSMA, showMSRP, showForecast, timeframe]);

  const atl = convertCurrency(analysis.allTimeLow.price, 'USD', currency);
  const ath = convertCurrency(analysis.allTimeHigh.price, 'USD', currency);
  const msrp = convertCurrency(product.msrpUSD, 'USD', currency);

  const timeframes: Timeframe[] = ['1H', '24H', '7D', '1M', '3M', '1Y', 'ALL'];

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Chart Top Control Bar */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe selector (1H to ALL) */}
          <div className="flex bg-slate-900 border border-slate-700/60 rounded-lg p-0.5 font-mono">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2 py-0.5 text-xs font-semibold rounded transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Candle vs Area */}
          <div className="flex bg-slate-900 border border-slate-700/60 rounded-lg p-0.5">
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                chartType === 'candlestick'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Candles
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                chartType === 'area'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Area
            </button>
          </div>

          {/* Indicator Toggles */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border transition-all flex items-center gap-1 ${
                showSMA
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              SMA-30
            </button>

            <button
              onClick={() => setShowForecast(!showForecast)}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border transition-all flex items-center gap-1 ${
                showForecast
                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Prognosis
            </button>

            <button
              onClick={() => setShowMSRP(!showMSRP)}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border transition-all flex items-center gap-1 ${
                showMSRP
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              MSRP
            </button>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-slate-400">
            ATL: <span className="text-emerald-400 font-semibold">{formatPrice(atl, currency)}</span>
          </div>
          <div className="text-slate-400">
            ATH: <span className="text-rose-400 font-semibold">{formatPrice(ath, currency)}</span>
          </div>
          <div className="text-slate-400 hidden md:block">
            MSRP: <span className="text-cyan-400 font-semibold">{formatPrice(msrp, currency)}</span>
          </div>
        </div>
      </div>

      {/* Chart Legend / Hover Readout */}
      <div className="px-4 py-1.5 bg-slate-950/40 border-b border-slate-800/40 text-xs font-mono flex items-center gap-5 text-slate-400 min-h-[30px]">
        {hoveredData ? (
          <>
            <div>Date/Time: <span className="text-slate-200">{hoveredData.time}</span></div>
            {hoveredData.open !== undefined && (
              <div>O: <span className="text-slate-200">{formatPrice(hoveredData.open, currency)}</span></div>
            )}
            {hoveredData.high !== undefined && (
              <div>H: <span className="text-emerald-400">{formatPrice(hoveredData.high, currency)}</span></div>
            )}
            {hoveredData.low !== undefined && (
              <div>L: <span className="text-rose-400">{formatPrice(hoveredData.low, currency)}</span></div>
            )}
            <div>C: <span className="text-blue-400 font-bold">{hoveredData.close ? formatPrice(hoveredData.close, currency) : '-'}</span></div>
            {hoveredData.volume !== undefined && (
              <div>Vol: <span className="text-slate-300">{hoveredData.volume}</span></div>
            )}
          </>
        ) : (
          <div className="text-slate-500 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>Hover cursor over candles for historical OHLC & listing volume metrics</span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div ref={chartContainerRef} className="flex-1 w-full min-h-[440px]" />
    </div>
  );
}
