'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { FileSpreadsheet, Download, Calendar as CalendarIcon, TrendingUp, AlertTriangle, ArrowRight, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Label } from '@/components/ui/label';
import { useMaterialContext } from '@/context/material-context';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export default function BoqAnalysisPage() {
  const { toast } = useToast();
  const { boqItems, workDoneReports, inventory } = useMaterialContext();
  
  const [activeSite, setActiveSite] = React.useState<string>('Organization-wise');
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);

  const sites = ['Organization-wise', ...Array.from(new Set(inventory.map(i => i.site))).filter(s => s !== 'MAPI Godown' && s !== 'Global')];

  const analysisData = React.useMemo(() => {
    const filteredBoq = activeSite === 'Organization-wise' 
      ? boqItems 
      : boqItems.filter(item => item.site === activeSite);

    return filteredBoq.map(boq => {
      // Aggregate data from nested WorkDoneReports entries
      let actualQty = 0;
      let actualCost = 0;

      workDoneReports.forEach(report => {
        const dateMatch = (!startDate || !endDate) ? true : isWithinInterval(new Date(report.reportDate), {
          start: startOfDay(startDate),
          end: endOfDay(endDate)
        });

        if (dateMatch && (activeSite === 'Organization-wise' || report.siteName === activeSite)) {
          report.entries.forEach(entry => {
            if (entry.itemOfWork === boq.subItemOfWork) {
              actualQty += entry.quantityOfWork;
              actualCost += entry.totalCost;
            }
          });
        }
      });

      const boqAmount = boq.boqQty * boq.boqRate;
      const progressPercent = Math.min(Math.round((actualQty / boq.boqQty) * 100), 100);
      
      return {
        ...boq,
        actualQty,
        actualCost,
        boqAmount,
        balanceQty: boq.boqQty - actualQty,
        balanceAmount: boqAmount - actualCost,
        progressPercent
      };
    });
  }, [activeSite, boqItems, workDoneReports, startDate, endDate]);

  const totals = React.useMemo(() => {
    return analysisData.reduce((acc, item) => ({
      boq: acc.boq + item.boqAmount,
      actual: acc.actual + item.actualCost,
      balance: acc.balance + item.balanceAmount,
    }), { boq: 0, actual: 0, balance: 0 });
  }, [analysisData]);

  const onDownloadReport = () => {
    toast({
      title: 'Generating Audit Report',
      description: `Exporting BOQ vs Actual Analysis for ${activeSite}.`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary flex items-center gap-3 uppercase tracking-tighter">
            <TrendingUp className="h-8 w-8" /> BOQ Execution Analysis
          </h1>
          <p className="text-muted-foreground font-medium">Planned Budget vs. Grid-Logged Actuals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-11 font-bold border-2" onClick={onDownloadReport}>
            <Download className="mr-2 h-4 w-4" /> Export XLSX Audit
          </Button>
        </div>
      </div>

      <Card className="border-primary/10 shadow-md">
        <CardHeader className="bg-muted/20 border-b py-4">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="space-y-1 flex-1 lg:w-64">
                <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Audit Scope</Label>
                <Select value={activeSite} onValueChange={setActiveSite}>
                  <SelectTrigger className="h-10 font-bold border-2 bg-background">
                    <SelectValue placeholder="Select Site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex-1 lg:w-auto">
                <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Analysis Period</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-10 font-bold text-xs bg-background border-2 w-full lg:w-40">
                        <CalendarIcon className="mr-2 h-3 w-3" /> {startDate ? format(startDate, 'dd MMM') : 'Start'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-10 font-bold text-xs bg-background border-2 w-full lg:w-40">
                        <CalendarIcon className="mr-2 h-3 w-3" /> {endDate ? format(endDate, 'dd MMM') : 'End'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                  {(startDate || endDate) && (
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={() => { setStartDate(undefined); setEndDate(undefined); }}>
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-6 w-full lg:w-auto">
              <div className="text-right">
                <p className="text-[9px] font-black uppercase text-muted-foreground">BOQ Budget</p>
                <p className="text-xl font-black text-primary">${totals.boq.toLocaleString()}</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-right">
                <p className="text-[9px] font-black uppercase text-muted-foreground">Actual Logged</p>
                <p className="text-xl font-black text-indigo-600">${totals.actual.toLocaleString()}</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-right">
                <p className="text-[9px] font-black uppercase text-muted-foreground">Variance</p>
                <p className={cn("text-xl font-black", totals.balance < 0 ? "text-destructive" : "text-green-600")}>
                  ${totals.balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="h-12">
                  <TableHead className="text-[9px] font-black uppercase px-4">Line Item (BOQ)</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-right">BOQ Qty</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-right">Actual Done</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-right">Balance Qty</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-right">BOQ Amt ($)</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-right">Actual Cost ($)</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-right">Remaining ($)</TableHead>
                  <TableHead className="text-[9px] font-black uppercase px-4 w-40">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisData.length > 0 ? analysisData.map((item, idx) => (
                  <TableRow key={idx} className="h-16 hover:bg-primary/5 transition-colors">
                    <TableCell className="px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{item.subItemOfWork}</span>
                        <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60">{item.category} • {item.site}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{item.boqQty.toLocaleString()} <span className="text-[10px] text-muted-foreground uppercase">{item.unit}</span></TableCell>
                    <TableCell className="text-right font-black text-indigo-600">{item.actualQty.toLocaleString()}</TableCell>
                    <TableCell className={cn("text-right font-black", item.balanceQty < 0 ? "text-destructive" : "text-green-600")}>
                      {item.balanceQty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">${item.boqAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-black text-indigo-600">${item.actualCost.toLocaleString()}</TableCell>
                    <TableCell className={cn("text-right font-black", item.balanceAmount < 0 ? "text-destructive" : "text-green-600")}>
                      ${item.balanceAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-black uppercase">
                          <span>Execution</span>
                          <span>{item.progressPercent}%</span>
                        </div>
                        <Progress value={item.progressPercent} className="h-1.5" />
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center">
                      <div className="space-y-2 opacity-30">
                        <FileSpreadsheet className="h-12 w-12 mx-auto" />
                        <p className="text-sm font-black uppercase tracking-widest">No Execution Data Found</p>
                        <p className="text-xs italic">Reports logged via the **Site Execution Grid** will appear here.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
