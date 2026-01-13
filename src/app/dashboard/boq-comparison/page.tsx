'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { boqVsActual } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

export default function BoqComparisonPage() {
  const [comparisonSite, setComparisonSite] = React.useState<string>('North Site');

  const filteredComparisonData = React.useMemo(() => {
    return boqVsActual.filter(d => d.site === comparisonSite);
  }, [comparisonSite]);

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <Layers /> BOQ vs Actual Comparison
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Site-wise Comparison</CardTitle>
          <CardDescription>
            Compare planned BOQ quantities and rates with actuals from daily progress reports for a selected site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select value={comparisonSite} onValueChange={setComparisonSite}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select a site to compare" />
              </SelectTrigger>
              <SelectContent>
                {[...new Set(boqVsActual.map(d => d.site))].map(site => (
                  <SelectItem key={site} value={site}>{site}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BOQ Item</TableHead>
                  <TableHead className="text-right">BOQ Qty</TableHead>
                  <TableHead className="text-right">Actual Qty</TableHead>
                  <TableHead className="text-right">Qty Variance</TableHead>
                  <TableHead className="text-right">BOQ Rate</TableHead>
                  <TableHead className="text-right">Actual Rate</TableHead>
                  <TableHead className="text-right">Rate Variance</TableHead>
                  <TableHead className="text-right">Cost Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComparisonData.map(item => {
                  const qtyVariance = item.actualQty - item.boqQty;
                  const rateVariance = item.actualRate - item.boqRate;
                  const costVariance = (item.actualQty * item.actualRate) - (item.boqQty * item.boqRate);

                  return (
                    <TableRow key={item.item}>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell className="text-right">{item.boqQty}</TableCell>
                      <TableCell className="text-right">{item.actualQty}</TableCell>
                      <TableCell className={cn("text-right", qtyVariance > 0 ? "text-destructive" : "text-green-600")}>
                        {qtyVariance > 0 ? `+${qtyVariance}` : qtyVariance}
                      </TableCell>
                      <TableCell className="text-right">${item.boqRate.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.actualRate.toFixed(2)}</TableCell>
                      <TableCell className={cn("text-right", rateVariance > 0 ? "text-destructive" : "text-green-600")}>
                        ${rateVariance.toFixed(2)}
                      </TableCell>
                      <TableCell className={cn("text-right font-semibold", costVariance > 0 ? "text-destructive" : "text-green-600")}>
                        ${costVariance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
