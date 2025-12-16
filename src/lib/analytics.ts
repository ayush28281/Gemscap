// Analytics functions for quantitative trading
import {
    mean,
    standardDeviation,
    linearRegression,
    linearRegressionLine,
    rSquared,
    sampleCorrelation,
    sum,
    min,
    max,
  } from 'simple-statistics';
  import type {
    TickData,
    OHLCData,
    PriceStats,
    SpreadStats,
    RegressionResult,
    ADFResult,
  } from '@/types/trading';
  
  // Calculate VWAP (Volume Weighted Average Price)
  export function calculateVWAP(ticks: TickData[]): number {
    if (ticks.length === 0) return 0;
    const totalValue = sum(ticks.map(t => t.price * t.size));
    const totalVolume = sum(ticks.map(t => t.size));
    return totalVolume > 0 ? totalValue / totalVolume : 0;
  }
  
  // Calculate price statistics
  export function calculatePriceStats(ticks: TickData[], symbol: string): PriceStats {
    if (ticks.length === 0) {
      return {
        symbol,
        lastPrice: 0,
        change: 0,
        changePercent: 0,
        high: 0,
        low: 0,
        volume: 0,
        vwap: 0,
        trades: 0,
      };
    }
  
    const prices = ticks.map(t => t.price);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;
  
    return {
      symbol,
      lastPrice,
      change,
      changePercent,
      high: max(prices),
      low: min(prices),
      volume: sum(ticks.map(t => t.size)),
      vwap: calculateVWAP(ticks),
      trades: ticks.length,
    };
  }
  
  // Aggregate ticks to OHLC
  export function aggregateToOHLC(
    ticks: TickData[],
    symbol: string,
    timestamp: string
  ): OHLCData | null {
    if (ticks.length === 0) return null;
  
    const prices = ticks.map(t => t.price);
    return {
      symbol,
      timestamp,
      open: prices[0],
      high: max(prices),
      low: min(prices),
      close: prices[prices.length - 1],
      volume: sum(ticks.map(t => t.size)),
      trades: ticks.length,
    };
  }
  
  // Calculate OLS regression (hedge ratio)
  export function calculateOLSRegression(
    pricesX: number[],
    pricesY: number[]
  ): RegressionResult | null {
    if (pricesX.length < 2 || pricesX.length !== pricesY.length) {
      return null;
    }
  
    try {
      const pairs: [number, number][] = pricesX.map((x, i) => [x, pricesY[i]]);
      const regression = linearRegression(pairs);
      const regressionFn = linearRegressionLine(regression);
      const r2 = rSquared(pairs, regressionFn);
      const corr = sampleCorrelation(pricesX, pricesY);
  
      // Calculate residuals (spread)
      const residuals = pricesY.map((y, i) => y - regressionFn(pricesX[i]));
  
      return {
        hedgeRatio: regression.m,
        intercept: regression.b,
        rSquared: r2,
        correlation: corr,
        residuals,
      };
    } catch {
      return null;
    }
  }
  
  // Calculate spread statistics
  export function calculateSpreadStats(
    spread: number[],
    lookback: number = 20
  ): SpreadStats | null {
    if (spread.length < 2) return null;
  
    const recentSpread = spread.slice(-lookback);
    const spreadMean = mean(recentSpread);
    const spreadStd = standardDeviation(recentSpread);
    const currentSpread = spread[spread.length - 1];
    const zScore = spreadStd > 0 ? (currentSpread - spreadMean) / spreadStd : 0;
  
    // Estimate half-life (simplified)
    const halfLife = estimateHalfLife(recentSpread);
  
    return {
      spread: currentSpread,
      spreadPercent: spreadMean !== 0 ? (currentSpread / spreadMean - 1) * 100 : 0,
      zScore,
      mean: spreadMean,
      std: spreadStd,
      halfLife,
    };
  }
  
  // Estimate half-life of mean reversion
  function estimateHalfLife(series: number[]): number {
    if (series.length < 3) return 0;
  
    // Calculate lagged differences
    const laggedSeries = series.slice(0, -1);
    const currentSeries = series.slice(1);
    const diffs = currentSeries.map((val, i) => val - laggedSeries[i]);
  
    // Simple regression: diff = alpha + beta * lagged
    try {
      const pairs: [number, number][] = laggedSeries.map((x, i) => [x, diffs[i]]);
      const regression = linearRegression(pairs);
      const beta = regression.m;
  
      if (beta >= 0) return Infinity; // No mean reversion
      return -Math.log(2) / Math.log(1 + beta);
    } catch {
      return 0;
    }
  }
  
  // Simplified ADF test (Augmented Dickey-Fuller)
  export function calculateADFTest(series: number[], maxLag: number = 1): ADFResult {
    const criticalValues = {
      "1%": -3.43,
      "5%": -2.86,
      "10%": -2.57,
    };
  
    if (series.length < 10) {
      return {
        testStatistic: 0,
        pValue: 1,
        criticalValues,
        isStationary: false,
        lag: maxLag,
      };
    }
  
    try {
      // Calculate first differences
      const diffs: number[] = [];
      for (let i = 1; i < series.length; i++) {
        diffs.push(series[i] - series[i - 1]);
      }
  
      // Lagged levels
      const laggedLevels = series.slice(0, -1);
  
      // Run regression: diff = alpha + beta * lagged_level
      const pairs: [number, number][] = laggedLevels.map((x, i) => [x, diffs[i]]);
      const regression = linearRegression(pairs);
  
      // Calculate t-statistic for beta
      const beta = regression.m;
      const residuals = diffs.map((d, i) => d - (regression.b + beta * laggedLevels[i]));
      const residualStd = standardDeviation(residuals);
      const xStd = standardDeviation(laggedLevels);
      const n = laggedLevels.length;
      const se = residualStd / (xStd * Math.sqrt(n));
      const tStat = beta / se;
  
      // Estimate p-value (simplified)
      let pValue = 0.5;
      if (tStat < criticalValues["1%"]) pValue = 0.01;
      else if (tStat < criticalValues["5%"]) pValue = 0.05;
      else if (tStat < criticalValues["10%"]) pValue = 0.1;
  
      return {
        testStatistic: tStat,
        pValue,
        criticalValues,
        isStationary: tStat < criticalValues["5%"],
        lag: maxLag,
      };
    } catch {
      return {
        testStatistic: 0,
        pValue: 1,
        criticalValues,
        isStationary: false,
        lag: maxLag,
      };
    }
  }
  
  // Calculate rolling correlation
  export function calculateRollingCorrelation(
    seriesA: number[],
    seriesB: number[],
    window: number
  ): number[] {
    if (seriesA.length !== seriesB.length || seriesA.length < window) {
      return [];
    }
  
    const correlations: number[] = [];
    for (let i = window - 1; i < seriesA.length; i++) {
      const windowA = seriesA.slice(i - window + 1, i + 1);
      const windowB = seriesB.slice(i - window + 1, i + 1);
      try {
        correlations.push(sampleCorrelation(windowA, windowB));
      } catch {
        correlations.push(0);
      }
    }
    return correlations;
  }
  
  // Calculate rolling statistics
  export function calculateRollingStats(
    series: number[],
    window: number
  ): { mean: number[]; std: number[]; zScore: number[] } {
    const means: number[] = [];
    const stds: number[] = [];
    const zScores: number[] = [];
  
    for (let i = 0; i < series.length; i++) {
      if (i < window - 1) {
        means.push(0);
        stds.push(0);
        zScores.push(0);
      } else {
        const windowData = series.slice(i - window + 1, i + 1);
        const m = mean(windowData);
        const s = standardDeviation(windowData);
        means.push(m);
        stds.push(s);
        zScores.push(s > 0 ? (series[i] - m) / s : 0);
      }
    }
  
    return { mean: means, std: stds, zScore: zScores };
  }
  
  // Format number for display
  export function formatNumber(num: number, decimals: number = 2): string {
    if (Math.abs(num) >= 1e9) {
      return (num / 1e9).toFixed(decimals) + 'B';
    } else if (Math.abs(num) >= 1e6) {
      return (num / 1e6).toFixed(decimals) + 'M';
    } else if (Math.abs(num) >= 1e3) {
      return (num / 1e3).toFixed(decimals) + 'K';
    }
    return num.toFixed(decimals);
  }
  
  // Format price based on magnitude
  export function formatPrice(price: number): string {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  }
  