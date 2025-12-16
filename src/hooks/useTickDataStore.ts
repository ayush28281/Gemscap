import { useState, useCallback, useRef, useEffect } from 'react';
import type { TickData, OHLCData, Timeframe } from '@/types/trading';
import { aggregateToOHLC } from '@/lib/analytics';

const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1s': 1000,
  '1m': 60000,
  '5m': 300000,
};

const MAX_TICKS = 10000;
const MAX_OHLC = 500;

interface TickDataStore {
  ticks: Map<string, TickData[]>;
  ohlc: Map<string, Map<Timeframe, OHLCData[]>>;
}

export function useTickDataStore() {
  const [store, setStore] = useState<TickDataStore>({
    ticks: new Map(),
    ohlc: new Map(),
  });

  const pendingTicksRef = useRef<Map<string, Map<Timeframe, TickData[]>>>(new Map());
  const lastAggregationRef = useRef<Map<string, Map<Timeframe, number>>>(new Map());
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Batch state updates for performance
  const scheduleUpdate = useCallback(() => {
    if (updateTimeoutRef.current) return;
    updateTimeoutRef.current = setTimeout(() => {
      updateTimeoutRef.current = null;
      setStore((prev) => ({ ...prev })); // Force re-render
    }, 100);
  }, []);

  const addTick = useCallback((tick: TickData) => {
    const symbol = tick.symbol.toLowerCase();

    setStore((prev) => {
      const ticks = new Map(prev.ticks);
      const ohlc = new Map(prev.ohlc);

      // Add to ticks array
      const symbolTicks = [...(ticks.get(symbol) || []), tick];
      if (symbolTicks.length > MAX_TICKS) {
        symbolTicks.shift();
      }
      ticks.set(symbol, symbolTicks);

      // Process OHLC for each timeframe
      const now = Date.now();
      const symbolOhlc = ohlc.get(symbol) || new Map();

      (['1s', '1m', '5m'] as Timeframe[]).forEach((tf) => {
        const interval = TIMEFRAME_MS[tf];
        const now = new Date(tick.ts).getTime();
        const currentBucket = Math.floor(now / interval) * interval;
      
        if (!pendingTicksRef.current.has(symbol)) {
          pendingTicksRef.current.set(symbol, new Map());
        }
        const symbolPending = pendingTicksRef.current.get(symbol)!;
        if (!symbolPending.has(tf)) {
          symbolPending.set(tf, []);
        }
      
        if (!lastAggregationRef.current.has(symbol)) {
          lastAggregationRef.current.set(symbol, new Map());
        }
        const symbolLastAgg = lastAggregationRef.current.get(symbol)!;
      
        const lastAgg = symbolLastAgg.get(tf) ?? currentBucket - interval;

      
        symbolPending.get(tf)!.push(tick);
      
        if (currentBucket > lastAgg) {
          const pendingTicks = symbolPending.get(tf)!;
      
          if (pendingTicks.length > 0) {
            const ohlcBar = aggregateToOHLC(
              pendingTicks,
              symbol,
              new Date(lastAgg).toISOString()
            );
      
            if (ohlcBar) {
              const tfOhlc = [...(symbolOhlc.get(tf) || []), ohlcBar];
              if (tfOhlc.length > MAX_OHLC) tfOhlc.shift();
              symbolOhlc.set(tf, tfOhlc);
            }
          }
      
          symbolPending.set(tf, []);
          symbolLastAgg.set(tf, currentBucket);
        }
      });
      

      ohlc.set(symbol, symbolOhlc);
      return { ticks, ohlc };
    });

    scheduleUpdate();
  }, [scheduleUpdate]);

  const getTicks = useCallback(
    (symbol: string): TickData[] => {
      return store.ticks.get(symbol.toLowerCase()) || [];
    },
    [store.ticks]
  );

  const getOHLC = useCallback(
    (symbol: string, timeframe: Timeframe): OHLCData[] => {
      return store.ohlc.get(symbol.toLowerCase())?.get(timeframe) || [];
    },
    [store.ohlc]
  );

  const getLatestPrice = useCallback(
    (symbol: string): number => {
      const ticks = store.ticks.get(symbol.toLowerCase());
      if (!ticks || ticks.length === 0) return 0;
      return ticks[ticks.length - 1].price;
    },
    [store.ticks]
  );

  const clearData = useCallback(() => {
    setStore({ ticks: new Map(), ohlc: new Map() });
    pendingTicksRef.current.clear();
    lastAggregationRef.current.clear();
  }, []);

  const exportData = useCallback(
    (symbol: string, format: 'json' | 'csv' = 'json'): string => {
      const ticks = store.ticks.get(symbol.toLowerCase()) || [];

      if (format === 'csv') {
        const header = 'timestamp,symbol,price,size\n';
        const rows = ticks.map((t) => `${t.ts},${t.symbol},${t.price},${t.size}`).join('\n');
        return header + rows;
      }

      return JSON.stringify(ticks, null, 2);
    },
    [store.ticks]
  );

  const exportOHLC = useCallback(
    (symbol: string, timeframe: Timeframe, format: 'json' | 'csv' = 'json'): string => {
      const data = store.ohlc.get(symbol.toLowerCase())?.get(timeframe) || [];

      if (format === 'csv') {
        const header = 'timestamp,symbol,open,high,low,close,volume,trades\n';
        const rows = data
          .map(
            (o) =>
              `${o.timestamp},${o.symbol},${o.open},${o.high},${o.low},${o.close},${o.volume},${o.trades}`
          )
          .join('\n');
        return header + rows;
      }

      return JSON.stringify(data, null, 2);
    },
    [store.ohlc]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    store,
    addTick,
    getTicks,
    getOHLC,
    getLatestPrice,
    clearData,
    exportData,
    exportOHLC,
    tickCount: Array.from(store.ticks.values()).reduce((a, b) => a + b.length, 0),
  };
}
