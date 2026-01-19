'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { boqVsActual } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { FileSpreadsheet, Download, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const reportSchema = z.object({
  siteName: z.string().min(1, 'Please select a site.'),
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function BoqAnalysisPage() {
  const [comparisonSite, setComparisonSite] = React.useState<string>('North Site');
  const { toast } = useToast();

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

  const filteredComparisonData = React.useMemo(() => {
    return boqVsActual.filter(d => d.site === comparisonSite);
  }, [comparisonSite]);

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <FileSpreadsheet /> BOQ Analysis
      </h1>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Site-wise BOQ Analysis</CardTitle>
            <CardDescription>
              Analyze planned BOQ against actual execution data including consumption, cost, and work-in-progress.
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
                  Select a site and date range to generate a comprehensive Excel report comparing BOQ data with actual execution, including breakups of material, equipment, and workforce usage.
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
                              {[...new Set(boqVsActual.map(d => d.site))].map(site => (
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
                  <TableHead className="text-right">Actual Material Rate</TableHead>
                  <TableHead className="text-right">Manpower Cost</TableHead>
                  <TableHead className="text-right">Equipment Cost</TableHead>
                  <TableHead className="text-right">Total Actual Cost</TableHead>
                  <TableHead className="text-right">Total Cost Var.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComparisonData.map(item => {
                  const qtyVariance = item.actualQty - item.boqQty;
                  const boqTotalCost = item.boqQty * item.boqRate;
                  const actualMaterialCost = item.actualQty * item.actualRate;
                  const actualTotalCost = actualMaterialCost + (item.actualManpowerCost || 0) + (item.actualEquipmentCost || 0);
                  const costVariance = actualTotalCost - boqTotalCost;


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
                      <TableCell className="text-right">${(item.actualManpowerCost || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${(item.actualEquipmentCost || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">${actualTotalCost.toFixed(2)}</TableCell>
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
