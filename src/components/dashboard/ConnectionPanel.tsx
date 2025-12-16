import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  Play,
  Square,
  Download,
  Trash2,
  Settings,
  RefreshCw,
} from 'lucide-react';
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
import type { Timeframe, WebSocketStatus } from '@/types/trading';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/analytics';

interface ConnectionPanelProps {
  isConnected: boolean;
  statuses: Map<string, WebSocketStatus>;
  symbols: string[];
  timeframe: Timeframe;
  rollingWindow: number;
  tickCount: number;
  onConnect: () => void;
  onDisconnect: () => void;
  onSymbolsChange: (symbols: string[]) => void;
  onTimeframeChange: (tf: Timeframe) => void;
  onRollingWindowChange: (window: number) => void;
  onClearData: () => void;
  onExportData: (format: 'json' | 'csv') => void;
}

export function ConnectionPanel({
  isConnected,
  statuses,
  symbols,
  timeframe,
  rollingWindow,
  tickCount,
  onConnect,
  onDisconnect,
  onSymbolsChange,
  onTimeframeChange,
  onRollingWindowChange,
  onClearData,
  onExportData,
}: ConnectionPanelProps) {
  const [symbolInput, setSymbolInput] = useState(symbols.join(','));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSymbolsSubmit = () => {
    const newSymbols = symbolInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (newSymbols.length >= 2) {
      onSymbolsChange(newSymbols);
    }
  };

  const totalMessages = Array.from(statuses.values()).reduce(
    (acc, s) => acc + s.messageCount,
    0
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-profit animate-pulse" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            Connection
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={isConnected ? 'default' : 'secondary'}
              className="text-[10px]"
            >
              {isConnected ? 'Live' : 'Disconnected'}
            </Badge>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Symbols (comma-separated)</Label>
                    <Input
                      value={symbolInput}
                      onChange={(e) => setSymbolInput(e.target.value)}
                      placeholder="btcusdt,ethusdt"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter at least 2 symbols for pair analysis
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Timeframe</Label>
                    <Select value={timeframe} onValueChange={(v) => onTimeframeChange(v as Timeframe)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1s">1 Second</SelectItem>
                        <SelectItem value="1m">1 Minute</SelectItem>
                        <SelectItem value="5m">5 Minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Rolling Window (periods)</Label>
                    <Input
                      type="number"
                      value={rollingWindow}
                      onChange={(e) =>
                        onRollingWindowChange(parseInt(e.target.value) || 20)
                      }
                      min={5}
                      max={100}
                    />
                  </div>

                  <Button onClick={handleSymbolsSubmit} className="w-full">
                    Apply Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-2">
          {symbols.map((sym) => {
            const status = statuses.get(sym.toLowerCase());
            return (
              <div
                key={sym}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg border text-xs',
                  status?.connected ? 'border-profit/50 bg-profit/5' : 'border-border'
                )}
              >
                <span className="font-mono uppercase">{sym}</span>
                <div className="flex items-center gap-1">
                  {status?.connected && (
                    <motion.div
                      className="w-2 h-2 rounded-full bg-profit"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}
                  <span className="text-muted-foreground">
                    {formatNumber(status?.messageCount || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Total Ticks</span>
          <span className="font-mono">{formatNumber(tickCount)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Messages</span>
          <span className="font-mono">{formatNumber(totalMessages)}</span>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {isConnected ? (
            <Button
              onClick={onDisconnect}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          ) : (
            <Button onClick={onConnect} size="sm" className="flex-1">
              <Play className="h-3 w-3 mr-1" />
              Start
            </Button>
          )}
          <Button
            onClick={onClearData}
            variant="outline"
            size="sm"
            className="px-3"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Export */}
        <div className="flex gap-2">
          <Button
            onClick={() => onExportData('json')}
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={tickCount === 0}
          >
            <Download className="h-3 w-3 mr-1" />
            JSON
          </Button>
          <Button
            onClick={() => onExportData('csv')}
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={tickCount === 0}
          >
            <Download className="h-3 w-3 mr-1" />
            CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
