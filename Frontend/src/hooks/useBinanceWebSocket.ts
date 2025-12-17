import { useState, useCallback, useRef, useEffect } from "react";
import type { TickData, WebSocketStatus } from "@/types/trading";

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
  const [statuses, setStatuses] = useState<Map<string, WebSocketStatus>>(
    new Map()
  );

  const socketRef = useRef<WebSocket | null>(null);
  const messageCountRef = useRef<Map<string, number>>(new Map());

  const connect = useCallback(() => {
    if (socketRef.current) return;

    const ws = new WebSocket("ws://localhost:8000/ws/market");
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);

      const next = new Map<string, WebSocketStatus>();
      symbols.forEach((s) => {
        next.set(s, {
          symbol: s,
          connected: true,
          messageCount: 0,
        });
        messageCountRef.current.set(s, 0);
      });
      setStatuses(next);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 👇 THIS IS PYTHON BACKEND FORMAT
        const tick: TickData = {
          symbol: data.symbol,
          ts: new Date(data.ts).toISOString(),
          price: Number(data.price),
          size: Number(data.size),
        };

        const count =
          (messageCountRef.current.get(tick.symbol) || 0) + 1;
        messageCountRef.current.set(tick.symbol, count);

        setStatuses((prev) => {
          const next = new Map(prev);
          const current = next.get(tick.symbol);
          if (current) {
            next.set(tick.symbol, {
              ...current,
              connected: true,
              messageCount: count,
              lastMessage: tick.ts,
            });
          }
          return next;
        });

        onTick?.(tick);
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;

      setStatuses((prev) => {
        const next = new Map(prev);
        next.forEach((v, k) =>
          next.set(k, { ...v, connected: false })
        );
        return next;
      });
    };

    ws.onerror = () => {
      setIsConnected(false);
    };
  }, [symbols, onTick]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (autoConnect && symbols.length > 0) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, symbols, connect, disconnect]);

  return {
    isConnected,
    statuses,
    connect,
    disconnect,
    totalMessages: Array.from(messageCountRef.current.values()).reduce(
      (a, b) => a + b,
      0
    ),
  };
}
