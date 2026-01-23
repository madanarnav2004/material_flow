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

const reportSchema = z.object({
  siteName: z.string().min(1, 'Please select a site.'),
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function BoqComparisonPage() {
  const [comparisonSite, setComparisonSite] = React.useState<string>('North Site');
  const [analysisType, setAnalysisType] = React.useState<string>('overall');
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
    return detailedBoqAnalysis.filter(d => d.site === comparisonSite);
  }, [comparisonSite]);

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <FileSpreadsheet /> BOQ Analysis
      </h1>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Site-wise Detailed BOQ Analysis</CardTitle>
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
              <Label htmlFor="site-select">Select Site</Label>
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
            <div className="flex-1 space-y-2">
              <Label htmlFor="analysis-type-select">Select Analysis Type</Label>
              <Select id="analysis-type-select" value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Select analysis type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall Analysis</SelectItem>
                  <SelectItem value="quantity">Quantity Analysis</SelectItem>
                  <SelectItem value="cost">Cost Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
               {analysisType === 'overall' && (
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2} className="align-bottom">BOQ Item</TableHead>
                    <TableHead colSpan={3} className="text-center border-l">Material Quantity Analysis</TableHead>
                    <TableHead colSpan={4} className="text-center border-l">Manpower Analysis</TableHead>
                    <TableHead colSpan={4} className="text-center border-l">Equipment Analysis</TableHead>
                    <TableHead colSpan={3} className="text-center border-l">Cost Analysis</TableHead>
                  </TableRow>
                  <TableRow>
                    {/* Material */}
                    <TableHead className="text-right border-l">BOQ Qty</TableHead>
                    <TableHead className="text-right">Actual Qty</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    {/* Manpower */}
                    <TableHead className="text-left border-l">Workers</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">OT Hours</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    {/* Equipment */}
                    <TableHead className="text-right border-l">Name</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">OT Hours</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    {/* Cost */}
                    <TableHead className="text-right border-l">BOQ Cost</TableHead>
                    <TableHead className="text-right">Actual Cost</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
              )}
              {analysisType === 'quantity' && (
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2} className="align-bottom">BOQ Item</TableHead>
                    <TableHead colSpan={3} className="text-center border-l">Material Quantity Analysis</TableHead>
                    <TableHead colSpan={3} className="text-center border-l">Manpower Analysis</TableHead>
                    <TableHead colSpan={3} className="text-center border-l">Equipment Analysis</TableHead>
                  </TableRow>
                  <TableRow>
                    {/* Material */}
                    <TableHead className="text-right border-l">BOQ Qty</TableHead>
                    <TableHead className="text-right">Actual Qty</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    {/* Manpower */}
                    <TableHead className="text-left border-l">Workers</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">OT Hours</TableHead>
                    {/* Equipment */}
                    <TableHead className="text-right border-l">Name</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">OT Hours</TableHead>
                  </TableRow>
                </TableHeader>
              )}
              {analysisType === 'cost' && (
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2} className="align-bottom">BOQ Item</TableHead>
                    <TableHead colSpan={3} className="text-center border-l">Material Cost</TableHead>
                    <TableHead colSpan={1} className="text-center border-l">Manpower Cost</TableHead>
                    <TableHead colSpan={1} className="text-center border-l">Equipment Cost</TableHead>
                    <TableHead colSpan={3} className="text-center border-l">Total Cost</TableHead>
                  </TableRow>
                  <TableRow>
                    {/* Material Cost */}
                    <TableHead className="text-right border-l">BOQ Cost</TableHead>
                    <TableHead className="text-right">Actual Cost</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    {/* Manpower Cost */}
                    <TableHead className="text-right border-l">Actual Cost</TableHead>
                    {/* Equipment Cost */}
                    <TableHead className="text-right border-l">Actual Cost</TableHead>
                    {/* Total Cost */}
                    <TableHead className="text-right border-l">Total BOQ Cost</TableHead>
                    <TableHead className="text-right">Actual Cost</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
              )}
              <TableBody>
                {filteredComparisonData.map(item => {
                  const materialQtyVariance = item.actualMaterialQty - item.boqQty;
                  const boqMaterialCost = item.boqQty * item.boqRate;
                  const actualMaterialCost = item.actualMaterialQty * item.actualMaterialRate;
                  const materialCostVariance = actualMaterialCost - boqMaterialCost;
                  const boqTotalCost = item.boqQty * item.boqRate;
                  const actualTotalCost = actualMaterialCost + item.actualManpowerCost + item.actualEquipmentCost;
                  const totalCostVariance = actualTotalCost - boqTotalCost;


                  return (
                    <TableRow key={item.item}>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      
                      {analysisType === 'overall' && (
                        <>
                          <TableCell className="text-right border-l">{item.boqQty}</TableCell>
                          <TableCell className="text-right">{item.actualMaterialQty}</TableCell>
                          <TableCell className={cn("text-right", materialQtyVariance > 0 ? "text-destructive" : "text-green-600")}>
                            {materialQtyVariance > 0 ? `+${materialQtyVariance}` : materialQtyVariance}
                          </TableCell>
                          <TableCell className="text-left border-l">{item.actualManpowerBreakdown}</TableCell>
                          <TableCell className="text-right">{item.actualManpowerHours} hrs</TableCell>
                          <TableCell className="text-right">{item.actualManpowerOtHours} hrs</TableCell>
                          <TableCell className="text-right">${item.actualManpowerCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right border-l">{item.actualEquipmentName}</TableCell>
                          <TableCell className="text-right">{item.actualEquipmentHours} hrs</TableCell>
                          <TableCell className="text-right">{item.actualEquipmentOtHours} hrs</TableCell>
                          <TableCell className="text-right">${item.actualEquipmentCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right border-l">${boqTotalCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${actualTotalCost.toFixed(2)}</TableCell>
                          <TableCell className={cn("text-right font-semibold", totalCostVariance > 0 ? "text-destructive" : "text-green-600")}>
                            ${totalCostVariance.toFixed(2)}
                          </TableCell>
                        </>
                      )}

                      {analysisType === 'quantity' && (
                        <>
                          <TableCell className="text-right border-l">{item.boqQty}</TableCell>
                          <TableCell className="text-right">{item.actualMaterialQty}</TableCell>
                          <TableCell className={cn("text-right", materialQtyVariance > 0 ? "text-destructive" : "text-green-600")}>
                            {materialQtyVariance > 0 ? `+${materialQtyVariance}` : materialQtyVariance}
                          </TableCell>
                          <TableCell className="text-left border-l">{item.actualManpowerBreakdown}</TableCell>
                          <TableCell className="text-right">{item.actualManpowerHours} hrs</TableCell>
                          <TableCell className="text-right">{item.actualManpowerOtHours} hrs</TableCell>
                          <TableCell className="text-right border-l">{item.actualEquipmentName}</TableCell>
                          <TableCell className="text-right">{item.actualEquipmentHours} hrs</TableCell>
                          <TableCell className="text-right">{item.actualEquipmentOtHours} hrs</TableCell>
                        </>
                      )}
                      
                      {analysisType === 'cost' && (
                        <>
                          <TableCell className="text-right border-l">${boqMaterialCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${actualMaterialCost.toFixed(2)}</TableCell>
                          <TableCell className={cn("text-right", materialCostVariance > 0 ? "text-destructive" : "text-green-600")}>
                            ${materialCostVariance.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right border-l">${item.actualManpowerCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right border-l">${item.actualEquipmentCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right border-l">${boqTotalCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${actualTotalCost.toFixed(2)}</TableCell>
                          <TableCell className={cn("text-right font-semibold", totalCostVariance > 0 ? "text-destructive" : "text-green-600")}>
                            ${totalCostVariance.toFixed(2)}
                          </TableCell>
                        </>
                      )}
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
