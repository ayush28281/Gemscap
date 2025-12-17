import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { PriceStats } from '@/types/trading';
import { formatPrice, formatNumber } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface PriceCardProps {
  stats: PriceStats;
  isActive?: boolean;
  onClick?: () => void;
}

export function PriceCard({ stats, isActive, onClick }: PriceCardProps) {
  const isPositive = stats.changePercent >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200 border-border/50',
          isActive && 'border-primary shadow-glow',
          'hover:border-primary/50'
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {stats.symbol}
            </span>
            <Activity className="h-3 w-3 text-primary animate-pulse" />
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-mono font-bold text-foreground">
              {formatPrice(stats.lastPrice)}
            </span>
            <span
              className={cn(
                'text-sm font-mono font-medium flex items-center gap-1',
                isPositive ? 'text-profit' : 'text-loss'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {isPositive ? '+' : ''}
              {stats.changePercent.toFixed(2)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">High</span>
              <span className="font-mono text-profit">{formatPrice(stats.high)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Low</span>
              <span className="font-mono text-loss">{formatPrice(stats.low)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vol</span>
              <span className="font-mono">{formatNumber(stats.volume)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VWAP</span>
              <span className="font-mono">{formatPrice(stats.vwap)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
