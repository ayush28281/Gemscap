import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OHLCData } from '@/types/trading';
import { formatNumber } from '@/lib/analytics';

interface VolumeChartProps {
  data: OHLCData[];
  symbol: string;
}

export function VolumeChart({ data, symbol }: VolumeChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    return data.map((d, i) => {
      const isUp = i === 0 || d.close >= data[i - 1].close;
      return {
        time: new Date(d.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        volume: d.volume,
        isUp,
      };
    });
  }, [data]);

  const totalVolume = data.reduce((acc, d) => acc + d.volume, 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Volume
            <span className="ml-2 text-xs text-muted-foreground">
              {symbol.toUpperCase()}
            </span>
          </CardTitle>
          <span className="text-sm font-mono text-muted-foreground">
            Total: {formatNumber(totalVolume)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Waiting for data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                tickFormatter={(v) => formatNumber(v)}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [formatNumber(value), 'Volume']}
              />
              <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isUp ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
