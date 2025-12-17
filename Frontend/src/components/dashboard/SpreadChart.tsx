import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SpreadStats } from '@/types/trading';

interface SpreadChartProps {
  spreadHistory: number[];
  zScoreHistory: number[];
  stats: SpreadStats | null;
  timestamps: string[];
}

export function SpreadChart({
  spreadHistory,
  zScoreHistory,
  stats,
  timestamps,
}: SpreadChartProps) {
  const data = useMemo(
    () =>
      spreadHistory.map((s, i) => ({
        time: new Date(timestamps[i]).toLocaleTimeString(),
        spread: s,
        zScore: zScoreHistory[i] ?? 0,
      })),
    [spreadHistory, zScoreHistory, timestamps]
  );

  return (
    <Card className="h-[300px]">
      <CardHeader className="pb-2 flex justify-between">
        <CardTitle className="text-sm font-medium">Spread & Z-Score</CardTitle>
        {stats && <Badge>Z {stats.zScore.toFixed(2)}</Badge>}
      </CardHeader>

      <CardContent className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="spread" />
            <YAxis yAxisId="z" orientation="right" domain={[-4, 4]} />
            <Tooltip />
            <ReferenceLine yAxisId="z" y={0} stroke="#888" />
            <ReferenceLine yAxisId="z" y={2} stroke="red" strokeDasharray="3 3" />
            <ReferenceLine yAxisId="z" y={-2} stroke="red" strokeDasharray="3 3" />
            <Bar yAxisId="spread" dataKey="spread" fill="hsl(var(--(--chart-3))" />
            <Line yAxisId="z" dataKey="zScore" stroke="hsl(var(--chart-1))" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
