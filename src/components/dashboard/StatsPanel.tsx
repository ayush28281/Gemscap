import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { RegressionResult, ADFResult, SpreadStats } from '@/types/trading';
import { cn } from '@/lib/utils';

interface StatsPanelProps {
  regression: RegressionResult | null;
  adfResult: ADFResult | null;
  spreadStats: SpreadStats | null;
  primarySymbol: string;
  secondarySymbol: string;
}

interface StatRowProps {
  label: string;
  value: string | number;
  hint?: string;
  positive?: boolean;
  negative?: boolean;
}

function StatRow({ label, value, hint, positive, negative }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {hint && (
          <span className="text-[10px] text-muted-foreground/70">{hint}</span>
        )}
        <span
          className={cn(
            'text-sm font-mono font-medium',
            positive && 'text-profit',
            negative && 'text-loss',
            !positive && !negative && 'text-foreground'
          )}
        >
          {typeof value === 'number' ? value.toFixed(4) : value}
        </span>
      </div>
    </div>
  );
}

export function StatsPanel({
  regression,
  adfResult,
  spreadStats,
  primarySymbol,
  secondarySymbol,
}: StatsPanelProps) {
  return (
    <Card className="h-full overflow-auto scrollbar-thin">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Analytics Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Regression Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              OLS Regression
            </span>
            <Badge variant="outline" className="text-[10px]">
              {primarySymbol.toUpperCase()} vs {secondarySymbol.toUpperCase()}
            </Badge>
          </div>
          {regression ? (
            <div className="space-y-0.5">
              <StatRow
                label="Hedge Ratio (β)"
                value={regression.hedgeRatio}
                hint="units"
              />
              <StatRow label="Intercept (α)" value={regression.intercept} />
              <StatRow
                label="R² Score"
                value={regression.rSquared}
                positive={regression.rSquared > 0.7}
                negative={regression.rSquared < 0.3}
              />
              <StatRow
                label="Correlation"
                value={regression.correlation}
                positive={regression.correlation > 0.7}
                negative={regression.correlation < -0.7}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Insufficient data</p>
          )}
        </motion.div>

        <Separator />

        {/* Spread Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Spread Statistics
          </span>
          {spreadStats ? (
            <div className="space-y-0.5 mt-2">
              <StatRow label="Current Spread" value={spreadStats.spread} />
              <StatRow
                label="Z-Score"
                value={spreadStats.zScore}
                positive={Math.abs(spreadStats.zScore) < 1}
                negative={Math.abs(spreadStats.zScore) > 2}
              />
              <StatRow label="Mean" value={spreadStats.mean} />
              <StatRow label="Std Dev" value={spreadStats.std} />
              <StatRow
                label="Half-Life"
                value={
                  spreadStats.halfLife === Infinity
                    ? '∞'
                    : spreadStats.halfLife.toFixed(2)
                }
                hint="periods"
                positive={spreadStats.halfLife < 10 && spreadStats.halfLife > 0}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">Calculating...</p>
          )}
        </motion.div>

        <Separator />

        {/* ADF Test */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ADF Test
            </span>
            {adfResult && (
              <Badge
                variant={adfResult.isStationary ? 'default' : 'destructive'}
                className="text-[10px]"
              >
                {adfResult.isStationary ? 'Stationary' : 'Non-Stationary'}
              </Badge>
            )}
          </div>
          {adfResult ? (
            <div className="space-y-0.5">
              <StatRow
                label="Test Statistic"
                value={adfResult.testStatistic}
                positive={adfResult.isStationary}
              />
              <StatRow
                label="P-Value"
                value={adfResult.pValue}
                hint={adfResult.pValue < 0.05 ? 'significant' : 'not sig.'}
                positive={adfResult.pValue < 0.05}
                negative={adfResult.pValue > 0.1}
              />
              <div className="mt-2 space-y-0.5">
                <p className="text-[10px] text-muted-foreground">Critical Values:</p>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-muted-foreground">
                    1%: {adfResult.criticalValues['1%'].toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">
                    5%: {adfResult.criticalValues['5%'].toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">
                    10%: {adfResult.criticalValues['10%'].toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Insufficient data for ADF test</p>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
