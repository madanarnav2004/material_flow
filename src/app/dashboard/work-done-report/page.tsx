'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, PlusCircle, Trash, Download, Calendar as CalendarIcon, DollarSign, AlertCircle, RefreshCcw } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { useMaterialContext, type WorkDoneReport } from '@/context/material-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const materialSchema = z.object({
  materialName: z.string().min(1, 'Material selection required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity is required.'),
  unit: z.string().min(1, 'Unit is required.'),
  rate: z.coerce.number().optional(),
});

const equipmentSchema = z.object({
  source: z.string().min(1, 'Source is required.'),
  name: z.string().min(1, 'Equipment selection required.'),
  usage: z.coerce.number().min(0.1, 'Usage is required.'),
  unit: z.string(),
  rate: z.coerce.number().min(0, 'Rate must be a positive number.').optional(),
});

const workforceSchema = z.object({
  skill: z.enum(['Skilled Worker', 'Helper'], { required_error: 'Skill required.' }),
  designation: z.string().min(1, 'Designation required.'),
  count: z.coerce.number().min(1, 'Count is required.'),
  hours: z.coerce.number().min(0.1, 'Hours are required'),
  otHours: z.coerce.number().min(0, 'OT hours required.').default(0),
  rate: z.coerce.number().min(0, 'Rate required.').optional(),
  otRate: z.coerce.number().min(0, 'OT rate required.').optional(),
});

const workDoneSchema = z.object({
  siteName: z.string(),
  reportDate: z.date(),
  itemOfWork: z.string().min(1, 'BOQ Item of work is required.'),
  subItemOfWork: z.string().optional(),
  quantityOfWork: z.coerce.number().min(0.1, 'Quantity must be greater than 0.'),
  materials: z.array(materialSchema).optional(),
  equipment: z.array(equipmentSchema).optional(),
  workforce: z.array(workforceSchema).optional(),
});

type WorkDoneFormValues = z.infer<typeof workDoneSchema>;

type SubmittedReport = WorkDoneFormValues & {
  costs: {
    materialCost: number;
    equipmentCost: number;
    workforceCost: number;
    totalCost: number;
  };
};

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
  
  const [submittedReport, setSubmittedReport] = React.useState<SubmittedReport | null>(null);

  const yesterday = subDays(new Date(), 1);
  const siteReports = workDoneReports.filter(r => r.siteName === site);
  const hasYesterdayReport = siteReports.some(report => isSameDay(new Date(report.reportDate), yesterday));

  const form = useForm<WorkDoneFormValues>({
    resolver: zodResolver(workDoneSchema),
    defaultValues: {
      siteName: site || '',
      reportDate: !hasYesterdayReport ? yesterday : new Date(),
      itemOfWork: '',
      quantityOfWork: 0,
      materials: [{ materialName: '', quantity: 0, unit: '', rate: 0 }],
      equipment: [{ source: 'Owned', name: '', usage: 0, unit: '', rate: 0 }],
      workforce: [{ skill: 'Skilled Worker', designation: '', count: 0, hours: 0, otHours: 0, rate: 0, otRate: 0 }],
    },
  });

  React.useEffect(() => {
    if (site) form.setValue('siteName', site);
  }, [site, form]);

  const siteBoqOptions = React.useMemo(() => {
    if (!site) return [];
    return boqItems.filter(item => item.site === site);
  }, [site, boqItems]);

  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({ control: form.control, name: 'materials' });
  const { fields: equipmentFields, append: appendEquipment, remove: removeEquipment } = useFieldArray({ control: form.control, name: 'equipment' });
  const { fields: workforceFields, append: appendWorkforce, remove: removeWorkforce } = useFieldArray({ control: form.control, name: 'workforce' });
  
  const handleItemChange = (value: string) => {
    form.setValue('itemOfWork', value);
    const selected = siteBoqOptions.find(i => i.subItemOfWork === value);
    if (selected) {
      form.setValue('subItemOfWork', selected.category);
    }
  };

  const handleMaterialSelect = (value: string, index: number) => {
    const selected = materialsRate.find(m => m.name === value);
    if (selected) {
      form.setValue(`materials.${index}.materialName`, value);
      form.setValue(`materials.${index}.unit`, selected.unit);
      form.setValue(`materials.${index}.rate`, selected.rate);
    }
  };

  const handleEquipmentSelect = (value: string, index: number) => {
    const selected = equipmentRate.find(e => e.name === value);
    if (selected) {
      form.setValue(`equipment.${index}.name`, value);
      form.setValue(`equipment.${index}.unit`, selected.unit);
      form.setValue(`equipment.${index}.rate`, selected.rate);
    }
  };

  const handleWorkforceSelect = (value: string, index: number) => {
    const skill = form.watch(`workforce.${index}.skill`);
    const rateList = skill === 'Skilled Worker' ? workersRate : helpersRate;
    const selected = rateList.find(w => w.name === value);
    if (selected) {
      form.setValue(`workforce.${index}.designation`, value);
      form.setValue(`workforce.${index}.rate`, selected.rate);
      form.setValue(`workforce.${index}.otRate`, selected.rate * 1.5);
    }
  };

  function onSubmit(values: WorkDoneFormValues) {
    const materialCost = values.materials?.reduce((acc, mat) => acc + (mat.quantity * (mat.rate || 0)), 0) || 0;
    const equipmentCost = values.equipment?.reduce((acc, eq) => acc + (eq.usage * (eq.rate || 0)), 0) || 0;
    const workforceCost = values.workforce?.reduce((acc, wf) => {
      const regularCost = wf.count * wf.hours * (wf.rate || 0);
      const otCost = wf.count * (wf.otHours || 0) * (wf.otRate || wf.rate || 0);
      return acc + regularCost + otCost;
    }, 0) || 0;
    const totalCost = materialCost + equipmentCost + workforceCost;

    setSubmittedReport({
      ...values,
      costs: { materialCost, equipmentCost, workforceCost, totalCost },
    });

    const workDoneEntry: WorkDoneReport = {
        siteName: values.siteName,
        reportDate: values.reportDate.toISOString(),
        itemOfWork: values.itemOfWork,
        quantityOfWork: values.quantityOfWork,
        totalCost: totalCost
    };
    setWorkDoneReports(prev => [...prev, workDoneEntry]);

    toast({
      title: 'Site Report Submitted',
      description: `Daily progress for ${format(values.reportDate, 'PPP')} recorded against BOQ.`,
    });
    
    form.reset({
        ...values,
        itemOfWork: '',
        quantityOfWork: 0,
        materials: [{ materialName: '', quantity: 0, unit: '', rate: 0 }],
        equipment: [{ source: 'Owned', name: '', usage: 0, unit: '', rate: 0 }],
        workforce: [{ skill: 'Skilled Worker', designation: '', count: 0, hours: 0, otHours: 0, rate: 0, otRate: 0 }],
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary uppercase tracking-tighter">Daily Execution Log</h1>
          <p className="text-muted-foreground font-medium">Capture field progress and resource consumption</p>
        </div>
        {!hasYesterdayReport && (
            <Badge variant="destructive" className="py-2 px-4 bg-destructive/10 border-destructive animate-pulse text-[10px] font-black uppercase">
                <AlertCircle className="h-3 w-3 mr-2" /> Yesterday's report missing
            </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card className={cn("shadow-xl border-primary/10 overflow-hidden", !hasYesterdayReport && "ring-2 ring-destructive/20 border-destructive/30")}>
            <CardHeader className={cn("bg-primary/5 border-b", !hasYesterdayReport && "bg-destructive/5")}>
              <CardTitle className="text-lg">Execution Entry: {site}</CardTitle>
              <CardDescription>All work items are mapped to the Master BOQ for real-time tracking.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">Assigned Site</FormLabel>
                          <FormControl><Input {...field} readOnly disabled className="bg-muted font-bold h-11" /></FormControl>
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="reportDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">Report Date</FormLabel>
                           <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant="outline" className={cn("pl-3 text-left font-bold h-11", !hasYesterdayReport && "border-destructive text-destructive")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(field.value, 'PPP')}
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

                  <Separator />

                  <div className="space-y-4 rounded-2xl border-2 p-6 bg-muted/5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">BOQ Execution Scope</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="itemOfWork"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary font-bold">Sub-Item of Work (From Master BOQ)</FormLabel>
                            <Select onValueChange={handleItemChange} value={field.value}>
                                <FormControl><SelectTrigger className="h-11 border-2"><SelectValue placeholder={siteBoqOptions.length > 0 ? "Select work item" : "No BOQ items uploaded"} /></SelectTrigger></FormControl>
                              <SelectContent>
                                {siteBoqOptions.map(item => (
                                  <SelectItem key={item.id} value={item.subItemOfWork}>
                                    {item.subItemOfWork} ({item.category})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                          control={form.control}
                          name="subItemOfWork"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel className="text-muted-foreground font-bold">Category (Auto-fill)</FormLabel>
                              <FormControl><Input readOnly disabled {...field} className="h-11 bg-muted font-medium" /></FormControl>
                              </FormItem>
                          )}
                      />
                    </div>
                    <FormField
                        control={form.control}
                        name="quantityOfWork"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="font-black text-primary">Quantity Completed Today</FormLabel>
                            <FormControl><Input type="number" step="any" placeholder="0.00" {...field} className="h-12 text-xl font-black border-2 border-primary/20" /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                  </div>

                  {/* Resource Sections: Materials, Equipment, Workforce */}
                  <div className="space-y-6">
                    {/* Materials */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2"><DollarSign className="h-3 w-3" /> Material Consumption</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => appendMaterial({ materialName: '', quantity: 0, unit: '', rate: 0 })} className="h-7 text-[9px] font-black uppercase"><PlusCircle className="h-3 w-3 mr-1"/> Add Row</Button>
                      </div>
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-blue-50/50">
                            <TableRow className="h-8">
                              <TableHead className="text-[9px] font-black uppercase">Material</TableHead>
                              <TableHead className="text-[9px] font-black uppercase w-20">Qty</TableHead>
                              <TableHead className="text-[9px] font-black uppercase w-16">Unit</TableHead>
                              <TableHead className="w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {materialFields.map((field, idx) => (
                              <TableRow key={field.id} className="h-12">
                                <TableCell>
                                  <Select onValueChange={(val) => handleMaterialSelect(val, idx)} value={form.watch(`materials.${idx}.materialName`)}>
                                    <SelectTrigger className="h-8 text-xs border-none shadow-none"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{materialsRate.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell><Input type="number" step="any" {...form.register(`materials.${idx}.quantity`)} className="h-8 text-xs border-none shadow-none font-bold" /></TableCell>
                                <TableCell><Input readOnly disabled {...form.register(`materials.${idx}.unit`)} className="h-8 text-[10px] border-none shadow-none bg-transparent opacity-60" /></TableCell>
                                <TableCell><Button variant="ghost" size="icon" onClick={() => removeMaterial(idx)} className="h-6 w-6 text-destructive"><Trash className="h-3 w-3" /></Button></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Equipment */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">Machinery & Equipment</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => appendEquipment({ source: 'Owned', name: '', usage: 0, unit: '', rate: 0 })} className="h-7 text-[9px] font-black uppercase"><PlusCircle className="h-3 w-3 mr-1"/> Add Row</Button>
                      </div>
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-amber-50/50">
                            <TableRow className="h-8">
                              <TableHead className="text-[9px] font-black uppercase w-20">Source</TableHead>
                              <TableHead className="text-[9px] font-black uppercase">Machine</TableHead>
                              <TableHead className="text-[9px] font-black uppercase w-16">Hrs</TableHead>
                              <TableHead className="w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {equipmentFields.map((field, idx) => (
                              <TableRow key={field.id} className="h-12">
                                <TableCell>
                                  <Select onValueChange={(val) => form.setValue(`equipment.${idx}.source`, val)} value={form.watch(`equipment.${idx}.source`)}>
                                    <SelectTrigger className="h-8 text-[9px] border-none shadow-none"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="Owned">Owned</SelectItem><SelectItem value="Rented">Rented</SelectItem></SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select onValueChange={(val) => handleEquipmentSelect(val, idx)} value={form.watch(`equipment.${idx}.name`)}>
                                    <SelectTrigger className="h-8 text-xs border-none shadow-none"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{equipmentRate.map(eq => <SelectItem key={eq.id} value={eq.name}>{eq.name}</SelectItem>)}</SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell><Input type="number" step="any" {...form.register(`equipment.${idx}.usage`)} className="h-8 text-xs border-none shadow-none font-bold" /></TableCell>
                                <TableCell><Button variant="ghost" size="icon" onClick={() => removeEquipment(idx)} className="h-6 w-6 text-destructive"><Trash className="h-3 w-3" /></Button></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Workforce */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">Workforce & Labor</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => appendWorkforce({ skill: 'Skilled Worker', designation: '', count: 0, hours: 0, otHours: 0, rate: 0, otRate: 0 })} className="h-7 text-[9px] font-black uppercase"><PlusCircle className="h-3 w-3 mr-1"/> Add Row</Button>
                      </div>
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-indigo-50/50">
                            <TableRow className="h-8">
                              <TableHead className="text-[9px] font-black uppercase">Skill</TableHead>
                              <TableHead className="text-[9px] font-black uppercase">Designation</TableHead>
                              <TableHead className="text-[9px] font-black uppercase w-12">Qty</TableHead>
                              <TableHead className="text-[9px] font-black uppercase w-12">Hrs</TableHead>
                              <TableHead className="w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {workforceFields.map((field, idx) => (
                              <TableRow key={field.id} className="h-12">
                                <TableCell>
                                  <Select onValueChange={(val) => { form.setValue(`workforce.${idx}.skill`, val as any); form.setValue(`workforce.${idx}.designation`, ''); }} value={form.watch(`workforce.${idx}.skill`)}>
                                    <SelectTrigger className="h-8 text-[9px] border-none shadow-none"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="Skilled Worker">Skilled</SelectItem><SelectItem value="Helper">Helper</SelectItem></SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select onValueChange={(val) => handleWorkforceSelect(val, idx)} value={form.watch(`workforce.${idx}.designation`)}>
                                    <SelectTrigger className="h-8 text-xs border-none shadow-none"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                      {(form.watch(`workforce.${idx}.skill`) === 'Skilled Worker' ? workersRate : helpersRate).map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell><Input type="number" {...form.register(`workforce.${idx}.count`)} className="h-8 text-xs border-none shadow-none font-bold" /></TableCell>
                                <TableCell><Input type="number" {...form.register(`workforce.${idx}.hours`)} className="h-8 text-xs border-none shadow-none" /></TableCell>
                                <TableCell><Button variant="ghost" size="icon" onClick={() => removeWorkforce(idx)} className="h-6 w-6 text-destructive"><Trash className="h-3 w-3" /></Button></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full font-black uppercase tracking-widest py-8 text-lg shadow-2xl" disabled={form.formState.isSubmitting}>
                    <Save className="mr-3 h-6 w-6" /> Finalize Today's Progress Report
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          {submittedReport ? (
            <Card className="sticky top-24 border-primary/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2"><DollarSign className="text-primary" /> Cost Audit Summary</CardTitle>
                <CardDescription>Verified breakdown for {format(submittedReport.reportDate, 'PPP')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2 rounded-xl border-2 border-primary/10 p-4 bg-muted/20">
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">BOQ Target Item</h3>
                  <p className="text-lg font-black text-primary">{submittedReport.itemOfWork}</p>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="font-black text-xs">{submittedReport.quantityOfWork} Execution Units</Badge>
                    <span className="text-[10px] font-bold uppercase opacity-60">{submittedReport.subItemOfWork}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Calculated Expenditure</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl border bg-background shadow-sm">
                        <span className="text-xs font-bold">Materials Consumed</span>
                        <span className="font-black text-sm">${submittedReport.costs.materialCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl border bg-background shadow-sm">
                        <span className="text-xs font-bold">Equipment Hours</span>
                        <span className="font-black text-sm">${submittedReport.costs.equipmentCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl border bg-background shadow-sm">
                        <span className="text-xs font-bold">Workforce Payroll</span>
                        <span className="font-black text-sm">${submittedReport.costs.workforceCost.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t-2 border-dashed border-primary/20">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Total Execution Cost</p>
                            <p className="text-muted-foreground text-[9px] italic">Based on Master-Rate fixed units</p>
                        </div>
                        <span className="text-4xl font-black text-primary font-headline">${submittedReport.costs.totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full font-black uppercase text-[10px] tracking-widest h-12" onClick={() => setSubmittedReport(null)}>
                    Clear Review
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-secondary/5 text-center opacity-40">
              <TrendingUp className="h-16 w-16 mb-4 text-muted-foreground" />
              <p className="font-black uppercase tracking-widest text-sm">Waiting for Submission</p>
              <p className="text-xs text-muted-foreground max-w-[200px] mt-2">Submit a daily report to see the real-time cost breakdown against BOQ.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}