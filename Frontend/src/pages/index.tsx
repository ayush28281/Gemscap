import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp } from "lucide-react";

import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { useTickDataStore } from "@/hooks/useTickDataStore";
import { useAlerts } from "@/hooks/useAlerts";

import {
  calculatePriceStats,
  calculateOLSRegression,
  calculateSpreadStats,
  calculateADFTest,
  calculateRollingCorrelation,
  calculateRollingStats,
} from "@/lib/analytics";

import { downloadFile } from "@/lib/download";

import { PriceCard } from "@/components/dashboard/PriceCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { SpreadChart } from "@/components/dashboard/SpreadChart";
import { CorrelationChart } from "@/components/dashboard/CorrelationChart";
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { StatsPanel } from "@/components/dashboard/StatsPanel";
import { AlertManager } from "@/components/dashboard/AlertManager";
import { ConnectionPanel } from "@/components/dashboard/ConnectionPanel";
import { LogPanel, type LogEntry } from "@/components/dashboard/LogPanel";
import { DataTable } from "@/components/dashboard/DataTable";

import type { Timeframe, TickData } from "@/types/trading";

const DEFAULT_SYMBOLS = ["btcusdt", "ethusdt"];
const API_BASE = "http://127.0.0.1:8000";

export default function Index() {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [timeframe, setTimeframe] = useState<Timeframe>("1s");
  const [rollingWindow, setRollingWindow] = useState(20);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const primarySymbol = symbols[0];
  const secondarySymbol = symbols[1];

  const {
    store,
    addTick,
    getTicks,
    getOHLC,
    clearData,
    tickCount,
  } = useTickDataStore();

  const { alerts, addAlert, removeAlert, toggleAlert, checkAlerts } = useAlerts();

  const addLog = useCallback(
    (msg: string, type: LogEntry["type"] = "info") => {
      setLogs((p) => [
        ...p.slice(-99),
        { timestamp: new Date().toISOString(), message: msg, type },
      ]);
    },
    []
  );

  const onTick = useCallback(
    (tick: TickData) => {
      addTick(tick);
    },
    [addTick]
  );

  const { isConnected, statuses, connect, disconnect } =
    useBinanceWebSocket({
      symbols,
      onTick,
    });

  // ===================== ANALYTICS =====================
  const analytics = useMemo(() => {
    const primaryTicks = getTicks(primarySymbol);
    const secondaryTicks = getTicks(secondarySymbol);

    const primaryOHLC = getOHLC(primarySymbol, timeframe);
    const secondaryOHLC = getOHLC(secondarySymbol, timeframe);

    const primaryPrices =
      primaryOHLC.length > 5
        ? primaryOHLC.map((d) => d.close)
        : primaryTicks.map((t) => t.price);

    const secondaryPrices =
      secondaryOHLC.length > 5
        ? secondaryOHLC.map((d) => d.close)
        : secondaryTicks.map((t) => t.price);

    const minLen = Math.min(primaryPrices.length, secondaryPrices.length);

    let regression = null;
    let spreadStats = null;
    let adfResult = null;
    let spreadHistory: number[] = [];
    let zScoreHistory: number[] = [];
    let correlationHistory: number[] = [];

    if (minLen >= 5) {
      const x = primaryPrices.slice(-minLen);
      const y = secondaryPrices.slice(-minLen);

      regression = calculateOLSRegression(x, y);

      if (regression) {
        spreadHistory = regression.residuals;

        const rolling = calculateRollingStats(
          spreadHistory,
          rollingWindow
        );
        zScoreHistory = rolling.zScore;
        spreadStats = calculateSpreadStats(
          spreadHistory,
          rollingWindow
        );

        if (spreadHistory.length >= 20) {
          adfResult = calculateADFTest(spreadHistory);
        }
      }

      correlationHistory = calculateRollingCorrelation(
        x,
        y,
        Math.min(rollingWindow, minLen)
      );
    }

    return {
      primaryStats: calculatePriceStats(
        primaryTicks,
        primarySymbol
      ),
      secondaryStats: calculatePriceStats(
        secondaryTicks,
        secondarySymbol
      ),
      primaryOHLC,
      secondaryOHLC,
      regression,
      spreadStats,
      adfResult,
      spreadHistory,
      zScoreHistory,
      correlationHistory,
      timestamps:
        primaryOHLC.length > 0
          ? primaryOHLC.map((d) => d.timestamp)
          : primaryTicks.map((t) => t.ts),
    };
  }, [
    store,
    primarySymbol,
    secondarySymbol,
    timeframe,
    rollingWindow,
    getTicks,
    getOHLC,
  ]);

  // ===================== ALERT LOOP =====================
  const alertRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (alertRef.current) clearInterval(alertRef.current);
    alertRef.current = setInterval(() => {
      if (analytics.spreadStats) {
        checkAlerts({
          zScore: analytics.spreadStats.zScore,
          spread: analytics.spreadStats.spread,
          prices: new Map([
            [primarySymbol, analytics.primaryStats.lastPrice],
            [secondarySymbol, analytics.secondaryStats.lastPrice],
          ]),
        });
      }
    }, 500);
    return () => alertRef.current && clearInterval(alertRef.current);
  }, [analytics, checkAlerts]);

  // ===================== DOWNLOAD HANDLERS =====================
  const handleExportTicks = (format: "json" | "csv") => {
    downloadFile(
      `${API_BASE}/ticks/${primarySymbol}?format=${format}`,
      `${primarySymbol}_ticks.${format}`,
      format
    );
  };

  const handleExportOHLC = () => {
    downloadFile(
      `${API_BASE}/ohlc/${primarySymbol}/${timeframe}?format=csv`,
      `${primarySymbol}_${timeframe}.csv`,
      "csv"
    );
  };

  // ===================== UI =====================
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 space-y-4">
        <ConnectionPanel
          isConnected={isConnected}
          statuses={statuses}
          symbols={symbols}
          timeframe={timeframe}
          rollingWindow={rollingWindow}
          tickCount={tickCount}
          onConnect={connect}
          onDisconnect={disconnect}
          onSymbolsChange={setSymbols}
          onTimeframeChange={setTimeframe}
          onRollingWindowChange={setRollingWindow}
          onClearData={clearData}
          onExportData={handleExportTicks}
        />

        <div className="grid grid-cols-2 gap-4">
          <PriceCard stats={analytics.primaryStats} isActive />
          <PriceCard stats={analytics.secondaryStats} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <PriceChart
            data={analytics.primaryOHLC}
            symbol={primarySymbol}
            secondaryData={analytics.secondaryOHLC}
            secondarySymbol={secondarySymbol}
          />

          <SpreadChart
            spreadHistory={analytics.spreadHistory}
            zScoreHistory={analytics.zScoreHistory}
            stats={analytics.spreadStats}
            timestamps={analytics.timestamps}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <CorrelationChart
            correlationHistory={analytics.correlationHistory}
            timestamps={analytics.timestamps.slice(
              -analytics.correlationHistory.length
            )}
            currentCorrelation={
              analytics.correlationHistory.at(-1) || 0
            }
          />

          <VolumeChart
            data={analytics.primaryOHLC}
            symbol={primarySymbol}
          />

          <StatsPanel
            regression={analytics.regression}
            adfResult={analytics.adfResult}
            spreadStats={analytics.spreadStats}
            primarySymbol={primarySymbol}
            secondarySymbol={secondarySymbol}
          />
        </div>

        <DataTable
          data={analytics.primaryOHLC}
          symbol={primarySymbol}
          onExport={handleExportOHLC}
        />

        <AlertManager
          alerts={alerts}
          onAddAlert={addAlert}
          onRemoveAlert={removeAlert}
          onToggleAlert={toggleAlert}
          availableSymbols={symbols}
        />

        <LogPanel logs={logs} />
      </main>
    </div>
  );
}
