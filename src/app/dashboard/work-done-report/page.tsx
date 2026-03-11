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
  Table as TableIcon,
  ChevronDown,
  TrendingUp,
  Package,
  Wrench,
  Users
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
  itemOfWork: z.string().min(1, 'Work item is required'),
  categoryNo: z.string(),
  itemNo: z.string(),
  subItemOfWork: z.string().min(1, 'Sub-item is required'),
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
        categoryNo: '',
        itemNo: '',
        subItemOfWork: '',
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

  const activeBoqItems = React.useMemo(() => {
    return boqItems.filter(item => item.site === site);
  }, [boqItems, site]);

  const uniqueWorkItems = React.useMemo(() => {
    return Array.from(new Set(activeBoqItems.map(i => i.itemOfWork)));
  }, [activeBoqItems]);

  const handleWorkItemChange = (val: string, index: number) => {
    const matchingBoq = activeBoqItems.find(i => i.itemOfWork === val);
    if (matchingBoq) {
      form.setValue(`entries.${index}.itemOfWork`, val);
      form.setValue(`entries.${index}.categoryNo`, matchingBoq.categoryNo);
      form.setValue(`entries.${index}.itemNo`, matchingBoq.itemNo);
      // Auto-select the first sub-item if only one exists
      const subs = activeBoqItems.filter(i => i.itemOfWork === val);
      if (subs.length === 1) {
        form.setValue(`entries.${index}.subItemOfWork`, subs[0].subItemOfWork);
        form.setValue(`entries.${index}.unit`, subs[0].unit);
      }
    }
  };

  const handleSubItemChange = (val: string, index: number) => {
    const sub = activeBoqItems.find(i => i.subItemOfWork === val);
    if (sub) {
      form.setValue(`entries.${index}.subItemOfWork`, val);
      form.setValue(`entries.${index}.unit`, sub.unit);
    }
  };

  const handleMaterialChange = (val: string, index: number) => {
    const mat = materialsRate.find(m => m.name === val);
    if (mat) {
      form.setValue(`entries.${index}.materialName`, val);
      // Unit is implicit in labels, but we can store it if needed
    }
  };

  const calculateCost = (entry: any) => {
    let cost = 0;
    const boqRate = activeBoqItems.find(i => i.subItemOfWork === entry.subItemOfWork)?.boqRate || 0;
    
    // Core cost is calculated using the BOQ rate for the work quantity
    cost += Number(entry.quantityOfWork) * boqRate;

    // Optional: Resource overages could be tracked, but here we prioritize work-item value mapping
    return cost;
  };

  function onSubmit(values: ReportFormValues) {
    setIsSubmitting(true);
    const finalEntries: WorkDoneEntry[] = values.entries.map((e, idx) => ({
      ...e,
      id: `entry-${Date.now()}-${idx}`,
      totalCost: calculateCost(e)
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
      title: 'Site Logs Finalized',
      description: `Daily grid for ${format(values.reportDate, 'PPP')} recorded successfully.`,
    });

    form.reset({
      ...values,
      entries: [{ itemOfWork: '', categoryNo: '', itemNo: '', subItemOfWork: '', quantityOfWork: 0, unit: '', equipmentSource: 'Owned' }]
    });
    setIsSubmitting(false);
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && index === fields.length - 1) {
      e.preventDefault();
      append({ itemOfWork: '', categoryNo: '', itemNo: '', subItemOfWork: '', quantityOfWork: 0, unit: '', equipmentSource: 'Owned' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary uppercase tracking-tighter flex items-center gap-3">
            <TableIcon className="h-8 w-8" /> Site Execution Grid
          </h1>
          <p className="text-muted-foreground font-medium">Excel-format daily reporting with automated BOQ mapping</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="h-10 px-4 font-black bg-primary/5">Site: {site}</Badge>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-2xl overflow-hidden border-primary/10">
            <CardHeader className="bg-primary/5 border-b py-4">
              <div className="flex items-center gap-6">
                <FormField control={form.control} name="reportDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground mb-1">Execution Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-10 font-bold border-2 bg-background w-48">
                          <CalendarIcon className="mr-2 h-4 w-4" /> {format(field.value, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}/>
                <Separator orientation="vertical" className="h-10" />
                <div className="text-sm font-medium text-muted-foreground">
                  Rapid Entry: Press <kbd className="bg-muted px-1.5 py-0.5 rounded border font-bold text-primary">Enter</kbd> in the last row to add a new line item.
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full whitespace-nowrap">
                <Table className="border-collapse">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="h-10">
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[200px]">Description of Work</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[80px]">Cat #</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[80px]">Item #</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[200px]">Sub-Item of Work</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[100px]">Qty Done</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[120px]">Material</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[80px]">Mat Qty</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[120px]">Eq. Name</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[80px]">Eq. Usage</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[120px]">Worker Type</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[80px]">W. Qty</TableHead>
                      <TableHead className="text-[9px] font-black uppercase px-4 border-r w-[80px]">H. Qty</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id} className="h-12 hover:bg-primary/5 transition-colors group">
                        <TableCell className="p-0 border-r">
                          <Select onValueChange={(val) => handleWorkItemChange(val, index)} value={form.watch(`entries.${index}.itemOfWork`)}>
                            <SelectTrigger className="h-12 border-none rounded-none shadow-none focus:ring-0 px-4 text-xs font-bold">
                              <SelectValue placeholder="Work Item" />
                            </SelectTrigger>
                            <SelectContent>{uniqueWorkItems.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0 border-r bg-muted/5">
                          <Input readOnly disabled {...form.register(`entries.${index}.categoryNo`)} className="h-12 border-none rounded-none shadow-none text-center text-[10px] font-black opacity-60" />
                        </TableCell>
                        <TableCell className="p-0 border-r bg-muted/5">
                          <Input readOnly disabled {...form.register(`entries.${index}.itemNo`)} className="h-12 border-none rounded-none shadow-none text-center text-[10px] font-black opacity-60" />
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Select onValueChange={(val) => handleSubItemChange(val, index)} value={form.watch(`entries.${index}.subItemOfWork`)}>
                            <SelectTrigger className="h-12 border-none rounded-none shadow-none focus:ring-0 px-4 text-xs">
                              <SelectValue placeholder="Sub-Item" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeBoqItems.filter(i => i.itemOfWork === form.watch(`entries.${index}.itemOfWork`)).map(sub => (
                                <SelectItem key={sub.id} value={sub.subItemOfWork}>{sub.subItemOfWork}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <div className="flex items-center px-2">
                            <Input type="number" step="any" {...form.register(`entries.${index}.quantityOfWork`)} className="h-12 border-none text-xs font-black text-primary text-center" onKeyDown={(e) => handleKeyDown(e, index)} />
                            <span className="text-[8px] font-black uppercase opacity-40">{form.watch(`entries.${index}.unit`)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Select onValueChange={(val) => handleMaterialChange(val, index)} value={form.watch(`entries.${index}.materialName`)}>
                            <SelectTrigger className="h-12 border-none rounded-none px-4 text-xs"><SelectValue placeholder="Material" /></SelectTrigger>
                            <SelectContent>{materialsRate.map(m => <SelectItem key={m.id} value={m.name}>{m.name} ({m.unit})</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Input type="number" step="any" {...form.register(`entries.${index}.materialQty`)} className="h-12 border-none text-xs text-center" />
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Select onValueChange={(val) => form.setValue(`entries.${index}.equipmentName`, val)} value={form.watch(`entries.${index}.equipmentName`)}>
                            <SelectTrigger className="h-12 border-none rounded-none px-4 text-xs"><SelectValue placeholder="Equipment" /></SelectTrigger>
                            <SelectContent>{equipmentRate.map(e => <SelectItem key={e.id} value={e.name}>{e.name} ({e.unit})</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Input type="number" step="any" {...form.register(`entries.${index}.equipmentUsage`)} className="h-12 border-none text-xs text-center" />
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Select onValueChange={(val) => form.setValue(`entries.${index}.workerType`, val)} value={form.watch(`entries.${index}.workerType`)}>
                            <SelectTrigger className="h-12 border-none rounded-none px-4 text-xs"><SelectValue placeholder="Worker" /></SelectTrigger>
                            <SelectContent>{workersRate.map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Input type="number" {...form.register(`entries.${index}.workerCount`)} className="h-12 border-none text-xs text-center" />
                        </TableCell>
                        <TableCell className="p-0 border-r">
                          <Input type="number" {...form.register(`entries.${index}.helperCount`)} className="h-12 border-none text-xs text-center" />
                        </TableCell>
                        <TableCell className="p-0 text-center">
                          <Button variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"><Trash className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              
              <div className="p-4 bg-muted/10 border-t flex justify-between items-center">
                <Button type="button" variant="ghost" size="sm" onClick={() => append({ itemOfWork: '', categoryNo: '', itemNo: '', subItemOfWork: '', quantityOfWork: 0, unit: '', equipmentSource: 'Owned' })} className="font-bold text-primary"><PlusCircle className="mr-2 h-4 w-4" /> Add Execution Row</Button>
                <div className="flex gap-3">
                  <Button variant="outline" type="button" onClick={() => form.reset()} className="h-11 px-8 font-bold">Clear Grid</Button>
                  <Button type="submit" size="lg" className="h-11 px-12 font-black uppercase tracking-widest shadow-xl" disabled={isSubmitting}><Save className="mr-2 h-5 w-5" /> {isSubmitting ? 'Syncing...' : 'Finalize Multi-Item Report'}</Button>
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
              <h4 className="font-black text-sm uppercase tracking-tighter text-amber-900">BOQ Mapping Enabled</h4>
              <p className="text-xs text-amber-800/70 leading-relaxed">Selecting a work item automatically populates its category and item number from the master BOQ for precise audit tracking.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5 shadow-none">
          <CardContent className="pt-6 flex items-start gap-4">
            <TrendingUp className="h-6 w-6 text-primary shrink-0" />
            <div className="space-y-1">
              <h4 className="font-black text-sm uppercase tracking-tighter text-primary-900">Cost Engine Sync</h4>
              <p className="text-xs text-primary-800/70 leading-relaxed">Quantities entered here are instantly multiplied by master rates to update the organization's actual expenditure ledger.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
