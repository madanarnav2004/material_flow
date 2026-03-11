'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Save, 
  PlusCircle, 
  Trash, 
  Calendar as CalendarIcon, 
  AlertCircle, 
  RefreshCcw,
  Table as TableIcon,
  ChevronDown
} from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { useMaterialContext, type WorkDoneEntry, type WorkDoneReport } from '@/context/material-context';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const entrySchema = z.object({
  itemOfWork: z.string().min(1, 'Required'),
  category: z.string(),
  quantityOfWork: z.coerce.number().min(0.1, 'Qty > 0'),
  unit: z.string(),
  materialName: z.string().optional(),
  materialQty: z.coerce.number().optional(),
  equipmentSource: z.enum(['Owned', 'Rented']).optional(),
  equipmentName: z.string().optional(),
  equipmentUsage: z.coerce.number().optional(),
  workerType: z.string().optional(),
  workerCount: z.coerce.number().optional(),
  helperCount: z.coerce.number().optional(),
});

const reportFormSchema = z.object({
  siteName: z.string(),
  reportDate: z.date(),
  entries: z.array(entrySchema).min(1, 'Add at least one entry.'),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export default function WorkDoneReportPage() {
  const { toast } = useToast();
  const { site } = useUser();
  const { 
    setWorkDoneReports, 
    workDoneReports, 
    materialsRate, 
    equipmentRate, 
    workersRate, 
    helpersRate,
    boqItems 
  } = useMaterialContext();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const yesterday = subDays(new Date(), 1);
  const siteReports = workDoneReports.filter(r => r.siteName === site);
  const hasYesterdayReport = siteReports.some(report => isSameDay(new Date(report.reportDate), yesterday));

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      siteName: site || '',
      reportDate: !hasYesterdayReport ? yesterday : new Date(),
      entries: [{
        itemOfWork: '',
        category: '',
        quantityOfWork: 0,
        unit: '',
        equipmentSource: 'Owned'
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'entries',
  });

  React.useEffect(() => {
    if (site) form.setValue('siteName', site);
  }, [site, form]);

  const siteBoqOptions = React.useMemo(() => {
    if (!site) return [];
    return boqItems.filter(item => item.site === site);
  }, [site, boqItems]);

  const handleWorkItemSelect = (value: string, index: number) => {
    const selected = siteBoqOptions.find(i => i.subItemOfWork === value);
    if (selected) {
      form.setValue(`entries.${index}.itemOfWork`, value);
      form.setValue(`entries.${index}.category`, selected.category);
      form.setValue(`entries.${index}.unit`, selected.unit);
    }
  };

  const calculateEntryCost = (entry: any) => {
    let cost = 0;
    
    // Material Cost
    if (entry.materialName && entry.materialQty) {
      const rate = materialsRate.find(m => m.name === entry.materialName)?.rate || 0;
      cost += entry.materialQty * rate;
    }

    // Equipment Cost
    if (entry.equipmentName && entry.equipmentUsage) {
      const rate = equipmentRate.find(e => e.name === entry.equipmentName)?.rate || 0;
      cost += entry.equipmentUsage * rate;
    }

    // Workforce Cost
    if (entry.workerType && entry.workerCount) {
      const workerRate = workersRate.find(w => w.name === entry.workerType)?.rate || 0;
      cost += entry.workerCount * workerRate * 8; // Assuming 8hr day for skilled
    }
    if (entry.helperCount) {
      const helperRate = helpersRate[0]?.rate || 20; // Default helper rate
      cost += entry.helperCount * helperRate * 8;
    }

    return cost;
  };

  function onSubmit(values: ReportFormValues) {
    setIsSubmitting(true);
    
    const finalEntries: WorkDoneEntry[] = values.entries.map((e, idx) => ({
      ...e,
      id: `entry-${Date.now()}-${idx}`,
      totalCost: calculateEntryCost(e)
    }));

    const totalReportCost = finalEntries.reduce((acc, curr) => acc + curr.totalCost, 0);

    const newReport: WorkDoneReport = {
      id: `rep-${Date.now()}`,
      siteName: values.siteName,
      reportDate: values.reportDate.toISOString(),
      entries: finalEntries,
      totalReportCost
    };

    setWorkDoneReports(prev => [...prev, newReport]);

    toast({
      title: 'Report Finalized',
      description: `Daily grid for ${format(values.reportDate, 'PPP')} with ${finalEntries.length} entries submitted.`,
    });

    form.reset({
      ...values,
      entries: [{ itemOfWork: '', category: '', quantityOfWork: 0, unit: '', equipmentSource: 'Owned' }]
    });
    setIsSubmitting(false);
  }

  // Handle "Enter" to add new row
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && index === fields.length - 1) {
      e.preventDefault();
      append({ itemOfWork: '', category: '', quantityOfWork: 0, unit: '', equipmentSource: 'Owned' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary uppercase tracking-tighter flex items-center gap-3">
            <TableIcon className="h-8 w-8" /> Site Execution Grid
          </h1>
          <p className="text-muted-foreground font-medium">Excel-format daily reporting for multi-line item capture</p>
        </div>
        <div className="flex items-center gap-4">
          {!hasYesterdayReport && (
            <Badge variant="destructive" className="py-2 px-4 animate-pulse text-[10px] font-black uppercase">
              <AlertCircle className="h-3 w-3 mr-2" /> Yesterday Missing
            </Badge>
          )}
          <Badge variant="outline" className="h-10 px-4 font-black border-primary/20 bg-primary/5 uppercase tracking-widest">
            Site: {site}
          </Badge>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-primary/10 shadow-2xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b py-4">
              <div className="flex items-center gap-6">
                <FormField
                  control={form.control}
                  name="reportDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground mb-1">Execution Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-10 font-bold border-2 bg-background w-48">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(field.value, 'PPP')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
                <Separator orientation="vertical" className="h-10" />
                <div className="text-sm font-medium text-muted-foreground">
                  Press <kbd className="bg-muted px-1.5 py-0.5 rounded border shadow-sm font-bold text-primary">Enter</kbd> in the last row to quickly add new execution items.
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full whitespace-nowrap">
                <Table className="border-collapse">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="h-10">
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[250px]">BOQ Item Description</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[120px]">Category</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[100px]">Qty Done</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[150px]">Material Name</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[80px]">Mat Qty</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[100px]">Eq. Source</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[150px]">Eq. Name</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[80px]">Eq. Hrs</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[150px]">Worker Type</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[80px]">W. Qty</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[80px]">H. Qty</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id} className="h-12 hover:bg-primary/5 transition-colors group">
                        <TableCell className="p-0 border-r">
                          <Select onValueChange={(val) => handleWorkItemSelect(val, index)} value={form.watch(`entries.${index}.itemOfWork`)}>
                            <SelectTrigger className="h-12 border-none rounded-none shadow-none focus:ring-0 px-4 text-xs font-bold">
                              <SelectValue placeholder="Select BOQ Item" />
                            </SelectTrigger>
                            <SelectContent>
                              {siteBoqOptions.map(boq => <SelectItem key={boq.id} value={boq.subItemOfWork}>{boq.subItemOfWork}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0 border-r bg-muted/5">
                          <Input readOnly disabled {...form.register(`entries.${index}.category`)} className="h-12 border-none rounded-none shadow-none focus-visible:ring-0 px-4 text-[10px] font-black uppercase opacity-60" />
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <div className="flex items-center px-2">
                            <Input type="number" step="any" {...form.register(`entries.${index}.quantityOfWork`)} className="h-12 border-none rounded-none shadow-none focus-visible:ring-0 text-xs font-black text-primary text-center" onKeyDown={(e) => handleKeyDown(e, index)} />
                            <span className="text-[8px] font-black opacity-40">{form.watch(`entries.${index}.unit`)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Select onValueChange={(val) => form.setValue(`entries.${index}.materialName`, val)} value={form.watch(`entries.${index}.materialName`)}>
                            <SelectTrigger className="h-12 border-none rounded-none shadow-none focus:ring-0 px-4 text-xs">
                              <SelectValue placeholder="Material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materialsRate.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Input type="number" step="any" {...form.register(`entries.${index}.materialQty`)} className="h-12 border-none rounded-none shadow-none focus-visible:ring-0 text-xs text-center" />
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Select onValueChange={(val) => form.setValue(`entries.${index}.equipmentSource`, val as any)} value={form.watch(`entries.${index}.equipmentSource`)}>
                            <SelectTrigger className="h-12 border-none rounded-none shadow-none focus:ring-0 px-4 text-[9px] font-black uppercase">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Owned">Own</SelectItem>
                              <SelectItem value="Rented">Rent</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Select onValueChange={(val) => form.setValue(`entries.${index}.equipmentName`, val)} value={form.watch(`entries.${index}.equipmentName`)}>
                            <SelectTrigger className="h-12 border-none rounded-none shadow-none focus:ring-0 px-4 text-xs">
                              <SelectValue placeholder="Equipment" />
                            </SelectTrigger>
                            <SelectContent>
                              {equipmentRate.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Input type="number" step="any" {...form.register(`entries.${index}.equipmentUsage`)} className="h-12 border-none rounded-none shadow-none focus-visible:ring-0 text-xs text-center" />
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Select onValueChange={(val) => form.setValue(`entries.${index}.workerType`, val)} value={form.watch(`entries.${index}.workerType`)}>
                            <SelectTrigger className="h-12 border-none rounded-none shadow-none focus:ring-0 px-4 text-xs">
                              <SelectValue placeholder="Worker Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {workersRate.map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Input type="number" {...form.register(`entries.${index}.workerCount`)} className="h-12 border-none rounded-none shadow-none focus-visible:ring-0 text-xs text-center" />
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Input type="number" {...form.register(`entries.${index}.helperCount`)} className="h-12 border-none rounded-none shadow-none focus-visible:ring-0 text-xs text-center" />
                        </TableCell>
                        <TableCell className="p-0 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => remove(index)} 
                            disabled={fields.length <= 1}
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              
              <div className="p-4 bg-muted/10 border-t flex justify-between items-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => append({ itemOfWork: '', category: '', quantityOfWork: 0, unit: '', equipmentSource: 'Owned' })}
                  className="font-bold text-primary"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Row (Ctrl+Enter)
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" type="button" onClick={() => form.reset()} className="h-11 px-8 font-bold">Clear Grid</Button>
                  <Button type="submit" size="lg" className="h-11 px-12 font-black uppercase tracking-widest shadow-xl" disabled={isSubmitting}>
                    <Save className="mr-2 h-5 w-5" /> {isSubmitting ? 'Syncing...' : 'Finalize Multi-Item Report'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-amber-500/20 bg-amber-500/5 shadow-none">
          <CardContent className="pt-6 flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-black text-sm uppercase tracking-tighter text-amber-900">Grid Usage Tip</h4>
              <p className="text-xs text-amber-800/70 leading-relaxed">
                Use the **Description of Work** dropdown to select items from your site's Master BOQ. Materials and worker rates are automatically fetched for cost analysis.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5 shadow-none">
          <CardContent className="pt-6 flex items-start gap-4">
            <RefreshCcw className="h-6 w-6 text-primary shrink-0" />
            <div className="space-y-1">
              <h4 className="font-black text-sm uppercase tracking-tighter text-primary-900">Real-Time Sync</h4>
              <p className="text-xs text-primary-800/70 leading-relaxed">
                Data entered here immediately feeds into the **BOQ vs Actual Analysis** and the **Global Inventory Ledger**. No manual calculation needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
