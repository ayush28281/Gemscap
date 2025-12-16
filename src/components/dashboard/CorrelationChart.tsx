import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CorrelationChart({
  correlationHistory,
  timestamps,
}: any) {
  const data = useMemo(
    () =>
      correlationHistory.map((c, i) => ({
        time: new Date(timestamps[i]).toLocaleTimeString(),
        correlation: c,
      })),
    [correlationHistory, timestamps]
  );

  return (
    <Card className="h-[250px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Rolling Correlation</CardTitle>
      </CardHeader>

      <CardContent className="h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[-1, 1]} />
            <Tooltip />
            <ReferenceLine y={0} stroke="#888" />
            <Area
              dataKey="correlation"
              stroke="hsl(var(--chart-2))"
              fillOpacity={0.3}
              fill="hsl(var(--chart-2))"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
