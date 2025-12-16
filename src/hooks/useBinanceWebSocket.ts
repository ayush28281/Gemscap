import { useState, useCallback, useRef, useEffect } from 'react';
import type { TickData, WebSocketStatus } from '@/types/trading';

interface UseBinanceWebSocketOptions {
  symbols: string[];
  onTick?: (tick: TickData) => void;
  autoConnect?: boolean;
}

export function useBinanceWebSocket({
  symbols,
  onTick,
  autoConnect = false,
}: UseBinanceWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [statuses, setStatuses] = useState<Map<string, WebSocketStatus>>(new Map());
  const socketsRef = useRef<Map<string, WebSocket>>(new Map());
  const messageCountRef = useRef<Map<string, number>>(new Map());

  const normalizeTickData = useCallback((data: any): TickData => {
    return {
      symbol: data.s,
      ts: new Date(data.T || data.E).toISOString(),
      price: Number(data.p),
      size: Number(data.q),
    };
  }, []);

  const connect = useCallback(() => {
    if (symbols.length === 0) return;

    symbols.forEach((symbol) => {
      const sym = symbol.toLowerCase();
      if (socketsRef.current.has(sym)) return;

      const url = `wss://fstream.binance.com/ws/${sym}@trade`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        messageCountRef.current.set(sym, 0);
        setStatuses((prev) => {
          const next = new Map(prev);
          next.set(sym, {
            symbol: sym,
            connected: true,
            messageCount: 0,
          });
          return next;
        });
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.e === 'trade') {
            const tick = normalizeTickData(data);
            const count = (messageCountRef.current.get(sym) || 0) + 1;
            messageCountRef.current.set(sym, count);

            setStatuses((prev) => {
              const next = new Map(prev);
              const current = next.get(sym);
              if (current) {
                next.set(sym, {
                  ...current,
                  messageCount: count,
                  lastMessage: tick.ts,
                });
              }
              return next;
            });

            onTick?.(tick);
          }
        } catch (e) {
          // Ignore parse errors
        }
      };

      ws.onclose = (event) => {
        setStatuses((prev) => {
          const next = new Map(prev);
          next.set(sym, {
            symbol: sym,
            connected: false,
            messageCount: messageCountRef.current.get(sym) || 0,
            error: event.code !== 1000 ? `Closed: ${event.code}` : undefined,
          });
          return next;
        });
        socketsRef.current.delete(sym);

        // Check if any sockets are still connected
        if (socketsRef.current.size === 0) {
          setIsConnected(false);
        }
      };

      ws.onerror = () => {
        setStatuses((prev) => {
          const next = new Map(prev);
          const current = next.get(sym);
          if (current) {
            next.set(sym, {
              ...current,
              error: 'Connection error',
            });
          }
          return next;
        });
      };

      socketsRef.current.set(sym, ws);
    });
  }, [symbols, onTick, normalizeTickData]);

  const disconnect = useCallback(() => {
    socketsRef.current.forEach((ws, sym) => {
      try {
        ws.close(1000, 'User disconnect');
      } catch {
        // Ignore close errors
      }
      socketsRef.current.delete(sym);
    });
    setIsConnected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && symbols.length > 0) {
      connect();
    }
  }, [autoConnect, symbols, connect]);

  return {
    isConnected,
    statuses,
    connect,
    disconnect,
    totalMessages: Array.from(messageCountRef.current.values()).reduce((a, b) => a + b, 0),
  };
}
