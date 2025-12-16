import { useMemo } from 'react';
import { Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { OHLCData } from '@/types/trading';
import { formatPrice, formatNumber } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface DataTableProps {
  data: OHLCData[];
  symbol: string;
  onExport: () => void;
}

export function DataTable({ data, symbol, onExport }: DataTableProps) {
  const tableData = useMemo(() => {
    return [...data].reverse().slice(0, 50);
  }, [data]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            OHLC Data
            <span className="ml-2 text-xs text-muted-foreground">
              {symbol.toUpperCase()} ({data.length} bars)
            </span>
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={onExport}
            disabled={data.length === 0}
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px]">
          {tableData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No data available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs text-right">Open</TableHead>
                  <TableHead className="text-xs text-right">High</TableHead>
                  <TableHead className="text-xs text-right">Low</TableHead>
                  <TableHead className="text-xs text-right">Close</TableHead>
                  <TableHead className="text-xs text-right">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row, i) => {
                  const isUp = row.close >= row.open;
                  return (
                    <TableRow key={`${row.timestamp}-${i}`}>
                      <TableCell className="text-xs font-mono py-1.5">
                        {new Date(row.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-right py-1.5">
                        {formatPrice(row.open)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-right py-1.5 text-profit">
                        {formatPrice(row.high)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-right py-1.5 text-loss">
                        {formatPrice(row.low)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-xs font-mono text-right py-1.5 font-medium',
                          isUp ? 'text-profit' : 'text-loss'
                        )}
                      >
                        {formatPrice(row.close)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-right py-1.5">
                        {formatNumber(row.volume)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
