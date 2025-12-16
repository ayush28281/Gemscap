import { useState, useCallback, useEffect, useRef } from 'react';
import type { Alert, AlertNotification } from '@/types/trading';
import { toast } from 'sonner';

const MAX_NOTIFICATIONS = 50;

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const lastCheckRef = useRef<Map<string, number>>(new Map());

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'triggered' | 'lastTriggered'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      triggered: false,
    };
    setAlerts((prev) => [...prev, newAlert]);
    return newAlert.id;
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  }, []);

  const checkAlerts = useCallback(
    (currentValues: {
      zScore?: number;
      prices?: Map<string, number>;
      spread?: number;
      volume?: Map<string, number>;
    }) => {
      const now = Date.now();

      setAlerts((prev) =>
        prev.map((alert) => {
          if (!alert.enabled) return alert;

          // Throttle checks to once per second per alert
          const lastCheck = lastCheckRef.current.get(alert.id) || 0;
          if (now - lastCheck < 1000) return alert;
          lastCheckRef.current.set(alert.id, now);

          let currentValue: number | undefined;
          let shouldTrigger = false;

          switch (alert.type) {
            case 'zscore':
              currentValue = currentValues.zScore;
              break;
            case 'price':
              currentValue = currentValues.prices?.get(alert.symbol.toLowerCase());
              break;
            case 'spread':
              currentValue = currentValues.spread;
              break;
            case 'volume':
              currentValue = currentValues.volume?.get(alert.symbol.toLowerCase());
              break;
          }

          if (currentValue !== undefined) {
            switch (alert.condition) {
              case 'above':
                shouldTrigger = currentValue > alert.value;
                break;
              case 'below':
                shouldTrigger = currentValue < alert.value;
                break;
              case 'cross':
                // Check if crossed from the other side
                shouldTrigger =
                  (alert.triggered && Math.abs(currentValue - alert.value) > 0.01) ||
                  (!alert.triggered && Math.abs(currentValue - alert.value) <= 0.01);
                break;
            }
          }

          if (shouldTrigger && !alert.triggered) {
            const notification: AlertNotification = {
              id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
              alertId: alert.id,
              message: `${alert.type.toUpperCase()} Alert: ${alert.symbol} ${alert.condition} ${alert.value} (current: ${currentValue?.toFixed(4)})`,
              timestamp: new Date().toISOString(),
              type: alert.type === 'zscore' && Math.abs(currentValue || 0) > 2 ? 'critical' : 'warning',
            };

            setNotifications((prev) => {
              const updated = [notification, ...prev];
              return updated.slice(0, MAX_NOTIFICATIONS);
            });

            // Show toast
            toast.warning(notification.message, {
              description: new Date().toLocaleTimeString(),
              duration: 5000,
            });

            return {
              ...alert,
              triggered: true,
              lastTriggered: new Date().toISOString(),
            };
          } else if (!shouldTrigger && alert.triggered) {
            return { ...alert, triggered: false };
          }

          return alert;
        })
      );
    },
    []
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Load alerts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('trading_alerts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAlerts(parsed.map((a: Alert) => ({ ...a, triggered: false })));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem('trading_alerts', JSON.stringify(alerts));
  }, [alerts]);

  return {
    alerts,
    notifications,
    addAlert,
    removeAlert,
    toggleAlert,
    checkAlerts,
    clearNotifications,
  };
}
