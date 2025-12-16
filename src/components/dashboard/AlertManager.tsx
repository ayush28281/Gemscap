import { useState } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Alert } from '@/types/trading';
import { cn } from '@/lib/utils';

interface AlertManagerProps {
  alerts: Alert[];
  onAddAlert: (alert: Omit<Alert, 'id' | 'triggered' | 'lastTriggered'>) => void;
  onRemoveAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
  availableSymbols: string[];
}

export function AlertManager({
  alerts,
  onAddAlert,
  onRemoveAlert,
  onToggleAlert,
  availableSymbols,
}: AlertManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'zscore' as Alert['type'],
    symbol: availableSymbols[0] || 'btcusdt',
    condition: 'above' as Alert['condition'],
    value: 2,
  });

  const handleAddAlert = () => {
    onAddAlert({
      ...newAlert,
      enabled: true,
    });
    setIsOpen(false);
  };

  const activeAlerts = alerts.filter((a) => a.enabled && a.triggered);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {activeAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7">
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newAlert.type}
                    onValueChange={(v) =>
                      setNewAlert({ ...newAlert, type: v as Alert['type'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zscore">Z-Score</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="spread">Spread</SelectItem>
                      <SelectItem value="volume">Volume</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newAlert.type === 'price' && (
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Select
                      value={newAlert.symbol}
                      onValueChange={(v) => setNewAlert({ ...newAlert, symbol: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSymbols.map((sym) => (
                          <SelectItem key={sym} value={sym}>
                            {sym.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select
                    value={newAlert.condition}
                    onValueChange={(v) =>
                      setNewAlert({ ...newAlert, condition: v as Alert['condition'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                      <SelectItem value="cross">Cross</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newAlert.value}
                    onChange={(e) =>
                      setNewAlert({ ...newAlert, value: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <Button onClick={handleAddAlert} className="w-full">
                  Create Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          {alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No alerts configured. Click "Add" to create one.
            </p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg border',
                    alert.triggered && alert.enabled
                      ? 'border-loss bg-loss/10'
                      : 'border-border'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {alert.type}
                      </Badge>
                      <span className="text-xs font-mono truncate">
                        {alert.condition} {alert.value}
                      </span>
                    </div>
                    {alert.type === 'price' && (
                      <span className="text-[10px] text-muted-foreground">
                        {alert.symbol.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => onToggleAlert(alert.id)}
                    >
                      {alert.enabled ? (
                        <ToggleRight className="h-4 w-4 text-profit" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-loss hover:text-loss"
                      onClick={() => onRemoveAlert(alert.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
