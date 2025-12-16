import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PriceChartProps {
  data: any[];
  symbol: string;
  secondaryData?: any[];
  secondarySymbol?: string;
}

export function PriceChart({
  data,
  symbol,
  secondaryData,
  secondarySymbol,
}: PriceChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    const basePrimary = data[0].close;
    const baseSecondary = secondaryData?.[0]?.close ?? 1;

    return data.map((d, i) => ({
      time: new Date(d.timestamp).toLocaleTimeString(),
      [symbol]: d.close / basePrimary,
      ...(secondaryData?.[i] && secondarySymbol && {
        [secondarySymbol]: secondaryData[i].close / baseSecondary,
      }),
    }));
  }, [data, symbol, secondaryData, secondarySymbol]);

  return (
    <Card className="h-[300px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Price Chart
          <span className="ml-2 text-xs text-muted-foreground">
            {symbol.toUpperCase()}
            {secondarySymbol && ` / ${secondarySymbol.toUpperCase()}`}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis
              domain={[0.995, 1.005]}
              tickFormatter={(v) => `${((v - 1) * 100).toFixed(2)}%`}
            />
            <Tooltip
              formatter={(v: number) => `${((v - 1) * 100).toFixed(3)}%`}
            />
            <ReferenceLine y={1} stroke="#888" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey={symbol}
              stroke="hsl(var(--chart-1))"
              dot={false}
            />
            {secondarySymbol && (
              <Line
                type="monotone"
                dataKey={secondarySymbol}
                stroke="hsl(var(--chart-2))"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
