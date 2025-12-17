// Core trading data types

export interface TickData {
    symbol: string;
    ts: string;
    price: number;
    size: number;
  }
  
  export interface OHLCData {
    symbol: string;
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    trades: number;
  }
  
  export interface PriceStats {
    symbol: string;
    lastPrice: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
    vwap: number;
    trades: number;
  }
  
  export interface SpreadStats {
    spread: number;
    spreadPercent: number;
    zScore: number;
    mean: number;
    std: number;
    halfLife: number;
  }
  
  export interface RegressionResult {
    hedgeRatio: number;
    intercept: number;
    rSquared: number;
    correlation: number;
    residuals: number[];
  }
  
  export interface ADFResult {
    testStatistic: number;
    pValue: number;
    criticalValues: {
      "1%": number;
      "5%": number;
      "10%": number;
    };
    isStationary: boolean;
    lag: number;
  }
  
  export interface Alert {
    id: string;
    type: 'zscore' | 'price' | 'spread' | 'volume';
    symbol: string;
    condition: 'above' | 'below' | 'cross';
    value: number;
    enabled: boolean;
    triggered: boolean;
    lastTriggered?: string;
  }
  
  export interface AlertNotification {
    id: string;
    alertId: string;
    message: string;
    timestamp: string;
    type: 'info' | 'warning' | 'critical';
  }
  
  export type Timeframe = '1s' | '1m' | '5m';
  
  export interface WebSocketStatus {
    symbol: string;
    connected: boolean;
    lastMessage?: string;
    messageCount: number;
    error?: string;
  }
  
  export interface DashboardState {
    selectedSymbols: string[];
    primarySymbol: string;
    secondarySymbol: string;
    timeframe: Timeframe;
    rollingWindow: number;
    isStreaming: boolean;
  }
  