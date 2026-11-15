'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
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
import { Product, Currency, TechnicalAnalysis } from '@/types';
import { convertCurrency, formatPrice } from '@/lib/currency';
import { TrendingUp, BarChart2, Activity } from 'lucide-react';

interface PriceChartProps {
  product: Product;
  analysis: TechnicalAnalysis;
  currency: Currency;
}

export default function PriceChart({ product, analysis, currency }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const [chartType, setChartType] = useState<'candlestick' | 'area'>('candlestick');
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [showMSRP, setShowMSRP] = useState<boolean>(true);
  const [showForecast, setShowForecast] = useState<boolean>(true);

  // Hovered candle info for custom legend
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

    // Prepare converted candles
    const history = product.history;
    const convertedCandles: CandlestickData<Time>[] = history.map((c) => ({
      time: c.time as Time,
      open: convertCurrency(c.open, 'USD', currency),
      high: convertCurrency(c.high, 'USD', currency),
      low: convertCurrency(c.low, 'USD', currency),
      close: convertCurrency(c.close, 'USD', currency),
    }));

    // Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const volumeData: HistogramData<Time>[] = history.map((c) => ({
      time: c.time as Time,
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

    // SMA-30 Line
    const sma30Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: 'SMA-30',
      visible: showSMA,
    });

    // Calculate rolling 30-period SMA
    const sma30Data: LineData<Time>[] = [];
    for (let i = 0; i < convertedCandles.length; i++) {
      if (i >= 9) {
        const windowSlice = convertedCandles.slice(Math.max(0, i - 9), i + 1);
        const avg = windowSlice.reduce((sum, item) => sum + item.close, 0) / windowSlice.length;
        sma30Data.push({
          time: convertedCandles[i].time,
          value: Math.round(avg * 100) / 100,
        });
      }
    }
    sma30Series.setData(sma30Data);

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

    // Prognosis Forecast Series (Extending into future)
    if (showForecast && analysis.forecastPoints.length > 0) {
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
          if ('open' in candle) {
            setHoveredData({
              time: typeof param.time === 'string' ? param.time : undefined,
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: vol?.value,
            });
          } else {
            setHoveredData({
              time: typeof param.time === 'string' ? param.time : undefined,
              close: candle.value,
              volume: vol?.value,
            });
          }
        }
      }
    });

    chart.timeScale().fitContent();

    // Resize observer
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
  }, [product, currency, chartType, showSMA, showMSRP, showForecast]);

  const latestCandle = product.history[product.history.length - 1];
  const atl = convertCurrency(analysis.allTimeLow.price, 'USD', currency);
  const ath = convertCurrency(analysis.allTimeHigh.price, 'USD', currency);
  const msrp = convertCurrency(product.msrpUSD, 'USD', currency);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Chart Top Control Bar */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-700/60 rounded-lg p-0.5">
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
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
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                chartType === 'area'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Line Area
            </button>
          </div>

          {/* Indicator Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all flex items-center gap-1 ${
                showSMA
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              SMA-30
            </button>

            <button
              onClick={() => setShowForecast(!showForecast)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all flex items-center gap-1 ${
                showForecast
                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Prognosis (30d)
            </button>

            <button
              onClick={() => setShowMSRP(!showMSRP)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all flex items-center gap-1 ${
                showMSRP
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              MSRP Baseline
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
          <div className="text-slate-400">
            MSRP: <span className="text-cyan-400 font-semibold">{formatPrice(msrp, currency)}</span>
          </div>
        </div>
      </div>

      {/* Chart Legend / Hover Readout */}
      <div className="px-4 py-1.5 bg-slate-950/40 border-b border-slate-800/40 text-xs font-mono flex items-center gap-5 text-slate-400 min-h-[30px]">
        {hoveredData ? (
          <>
            <div>Date: <span className="text-slate-200">{hoveredData.time}</span></div>
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

      {/* The Actual Canvas Chart */}
      <div ref={chartContainerRef} className="flex-1 w-full min-h-[440px]" />
    </div>
  );
}
