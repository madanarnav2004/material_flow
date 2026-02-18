'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { detailedBoqAnalysis } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { FileSpreadsheet, Download, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { useMaterialContext } from '@/context/material-context';

const reportSchema = z.object({
  siteName: z.string().min(1, 'Please select a site.'),
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function BoqAnalysisPage() {
  const [comparisonSite, setComparisonSite] = React.useState<string>('North Site');
  const { toast } = useToast();
  const { workDoneReports } = useMaterialContext();

  const reportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
  });

  const onExcelSubmit = (values: ReportFormValues) => {
    console.log('Generating Excel report with values:', values);
    toast({
      title: 'Excel Report Generation Started!',
      description: `Generating comprehensive Excel report for ${values.siteName}. This may take a moment.`,
    });
  };
  
  const onPdfSubmit = (values: ReportFormValues) => {
    console.log('Generating PDF report with values:', values);
    const reportDetails = `BOQ vs Actual Comparison Report from ${format(values.startDate, 'PPP')} to ${format(values.endDate, 'PPP')}`;
    toast({
      title: 'PDF Report Generation Started!',
      description: `Generating ${reportDetails} for ${values.siteName}.`,
    });
  };

  const analysisData = React.useMemo(() => {
    // This is the master BOQ data from the "uploaded excel"
    const boqData = detailedBoqAnalysis;

    const siteBoq = boqData.filter(d => d.site === comparisonSite);

    const siteWorkDone = workDoneReports.filter(r => r.siteName === comparisonSite);
    
    const actualsByItem = siteWorkDone.reduce((acc, report) => {
        const key = report.itemOfWork;
        if (!acc[key]) {
            acc[key] = { actualQty: 0, actualCost: 0 };
        }
        acc[key].actualQty += report.quantityOfWork;
        acc[key].actualCost += report.totalCost;
        return acc;
    }, {} as Record<string, { actualQty: number, actualCost: number }>);

    return siteBoq.map(boqItem => {
        const actuals = actualsByItem[boqItem.item] || { actualQty: 0, actualCost: 0 };
        const boqCost = boqItem.boqQty * boqItem.boqRate;
        
        return {
            item: boqItem.item,
            boqQty: boqItem.boqQty,
            boqCost: boqCost,
            actualQty: actuals.actualQty,
            actualCost: actuals.actualCost,
            balanceQty: boqItem.boqQty - actuals.actualQty,
            pendingCost: boqCost - actuals.actualCost,
        };
    });
}, [comparisonSite, workDoneReports]);


  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <FileSpreadsheet /> BOQ vs. Actual Analysis
      </h1>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Site-wise BOQ Comparison</CardTitle>
            <CardDescription>
              Compare planned BOQ against actual work-done data to track balance quantity and pending cost.
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Download Detailed BOQ Analysis Report</DialogTitle>
                <DialogDescription>
                  Select a site and date range to generate a comprehensive Excel report comparing BOQ data with actual execution.
                </DialogDescription>
              </DialogHeader>
              <Form {...reportForm}>
                <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={reportForm.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Site</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a site" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[...new Set(detailedBoqAnalysis.map(d => d.site))].map(site => (
                                <SelectItem key={site} value={site}>{site}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={reportForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                  >
                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={reportForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                  >
                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4">
                     <Button type="button" variant="outline" onClick={reportForm.handleSubmit(onPdfSubmit)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF Summary
                    </Button>
                    <Button type="button" onClick={reportForm.handleSubmit(onExcelSubmit)}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Download Comprehensive Excel
                    </Button>
                  </div>
                </div>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 space-y-2">
              <Label htmlFor="site-select">Select Site to Analyze</Label>
              <Select id="site-select" value={comparisonSite} onValueChange={setComparisonSite}>
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Select a site to compare" />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set(detailedBoqAnalysis.map(d => d.site))].map(site => (
                    <SelectItem key={site} value={site}>{site}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>BOQ Item</TableHead>
                    <TableHead className="text-right">BOQ Qty</TableHead>
                    <TableHead className="text-right">Actual Qty</TableHead>
                    <TableHead className="text-right">Balance Qty</TableHead>
                    <TableHead className="text-right">BOQ Cost</TableHead>
                    <TableHead className="text-right">Actual Cost</TableHead>
                    <TableHead className="text-right">Pending Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisData.map(item => (
                    <TableRow key={item.item}>
                        <TableCell className="font-medium">{item.item}</TableCell>
                        <TableCell className="text-right">{item.boqQty.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{item.actualQty.toLocaleString()}</TableCell>
                        <TableCell className={cn("text-right font-semibold", item.balanceQty < 0 ? "text-destructive" : "text-green-600")}>
                            {item.balanceQty.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">${item.boqCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.actualCost.toFixed(2)}</TableCell>
                        <TableCell className={cn("text-right font-semibold", item.pendingCost < 0 ? "text-destructive" : "text-green-600")}>
                            ${item.pendingCost.toFixed(2)}
                        </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
