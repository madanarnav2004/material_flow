'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, PlusCircle, Trash, Download, Calendar as CalendarIcon, DollarSign, AlertCircle } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { detailedBoqAnalysis, mockBoqData } from '@/lib/mock-data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { useMaterialContext, type WorkDoneReport } from '@/context/material-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const materialSchema = z.object({
  materialName: z.string().min(1, 'Material name is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity is required.'),
  unit: z.string().min(1, 'Unit is required.'),
  rate: z.coerce.number().optional(),
});

const equipmentSchema = z.object({
  source: z.string().min(1, 'Source is required.'),
  name: z.string().min(1, 'Equipment name is required.'),
  usage: z.coerce.number().min(0.1, 'Usage is required.'),
  unit: z.string(),
  rate: z.coerce.number().min(0, 'Rate must be a positive number.').optional(),
});

const workforceSchema = z.object({
  skill: z.string().min(1, 'Skill is required.'),
  designation: z.string().min(1, 'Designation is required.'),
  count: z.coerce.number().min(1, 'Count is required.'),
  hours: z.coerce.number().min(0.1, 'Hours are required'),
  otHours: z.coerce.number().min(0, 'OT hours must be a non-negative number.').optional(),
  rate: z.coerce.number().min(0, 'Rate must be a positive number.').optional(),
  otRate: z.coerce.number().min(0, 'OT rate must be a positive number.').optional(),
});

const workDoneSchema = z.object({
  siteName: z.string(),
  reportDate: z.date(),
  itemOfWork: z.string().min(1, 'Item of work is required.'),
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

const downloadSchema = z.object({
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
});

type DownloadFormValues = z.infer<typeof downloadSchema>;

export default function WorkDoneReportPage() {
  const { toast } = useToast();
  const { site } = useUser();
  const { setWorkDoneReports, workDoneReports } = useMaterialContext();
  const [submittedReport, setSubmittedReport] = React.useState<SubmittedReport | null>(null);

  const yesterday = subDays(new Date(), 1);
  const hasYesterdayReport = workDoneReports.some(report => 
    report.siteName === site && 
    isSameDay(new Date(report.reportDate), yesterday)
  );

  const form = useForm<WorkDoneFormValues>({
    resolver: zodResolver(workDoneSchema),
    defaultValues: {
      siteName: site || '',
      reportDate: !hasYesterdayReport ? yesterday : new Date(),
      itemOfWork: '',
      quantityOfWork: 0,
      materials: [{ materialName: '', quantity: 0, unit: '', rate: 0 }],
      equipment: [{ source: '', name: '', usage: 0, unit: '', rate: 0 }],
      workforce: [{ skill: '', designation: '', count: 0, hours: 0, otHours: 0, rate: 0, otRate: 0 }],
    },
  });

  React.useEffect(() => {
    if (site) {
        form.setValue('siteName', site);
    }
  }, [site, form]);

  const siteBoqItems = React.useMemo(() => {
    if (!site) return [];
    return detailedBoqAnalysis.filter(item => item.site === site);
  }, [site]);


  const downloadForm = useForm<DownloadFormValues>({
    resolver: zodResolver(downloadSchema),
  });

  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({
    control: form.control,
    name: 'materials',
  });
  const { fields: equipmentFields, append: appendEquipment, remove: removeEquipment } = useFieldArray({
    control: form.control,
    name: 'equipment',
  });
  const { fields: workforceFields, append: appendWorkforce, remove: removeWorkforce } = useFieldArray({
    control: form.control,
    name: 'workforce',
  });
  
  const handleItemChange = (value: string) => {
    form.setValue('itemOfWork', value);
  };

  const selectedEquipmentSource = form.watch('equipment');
  const availableEquipment = (index: number) => {
    const source = selectedEquipmentSource?.[index]?.source;
    if (!source) return [];
    return mockBoqData.equipment.filter(e => e.source.toLowerCase() === source.toLowerCase());
  }
  
  const handleEquipmentSourceChange = (value: string, index: number) => {
    form.setValue(`equipment.${index}.source`, value);
    form.setValue(`equipment.${index}.name`, '');
    form.setValue(`equipment.${index}.unit`, '');
    form.setValue(`equipment.${index}.rate`, 0);
  };
  
  const handleEquipmentNameChange = (value: string, index: number) => {
    form.setValue(`equipment.${index}.name`, value);
    const selectedEquipment = mockBoqData.equipment.find(e => e.name === value);
    form.setValue(`equipment.${index}.unit`, selectedEquipment?.unit || '');
    if (selectedEquipment) {
        form.setValue(`equipment.${index}.rate`, selectedEquipment.rate);
    }
  };

  const handleWorkforceDesignationChange = (value: string, index: number) => {
    form.setValue(`workforce.${index}.designation`, value);
    const selectedWorkforce = mockBoqData.workforce.find(w => w.designation === value);
    if (selectedWorkforce) {
        form.setValue(`workforce.${index}.rate`, selectedWorkforce.rate);
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
      title: 'Report Submitted Successfully',
      description: `Daily report for ${format(values.reportDate, 'PPP')} has been logged.`,
    });
    
    form.reset({
        ...values,
        itemOfWork: '',
        quantityOfWork: 0,
        materials: [{ materialName: '', quantity: 0, unit: '', rate: 0 }],
        equipment: [{ source: '', name: '', usage: 0, unit: '', rate: 0 }],
        workforce: [{ skill: '', designation: '', count: 0, hours: 0, otHours: 0, rate: 0, otRate: 0 }],
    });
  }

  function onDownloadSubmit(values: DownloadFormValues) {
    toast({
      title: 'Report Generation Started',
      description: `Generating progress report from ${format(values.startDate, 'PPP')} to ${format(values.endDate, 'PPP')}.`,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Daily Work Done Report</h1>
        {!hasYesterdayReport && (
            <Alert variant="destructive" className="w-auto py-2 bg-destructive/10 border-destructive shadow-none animate-pulse">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[10px] font-black uppercase">Yesterday's report missing</AlertDescription>
            </Alert>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Download Work Done Report</CardTitle>
          <CardDescription>Select a date range to download the daily progress reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...downloadForm}>
            <form onSubmit={downloadForm.handleSubmit(onDownloadSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <FormField
                  control={downloadForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={downloadForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">
                  <Download className="mr-2 h-4 w-4" /> Download Report
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card className={cn(!hasYesterdayReport && "border-destructive/50 ring-2 ring-destructive/20 shadow-xl")}>
            <CardHeader className={cn(!hasYesterdayReport && "bg-destructive/5")}>
              <CardTitle className="flex items-center gap-2">
                {!hasYesterdayReport ? "Urgent: Complete Yesterday's Entry" : "Submit Today's Progress"}
              </CardTitle>
              <CardDescription>Fill in the details below to report the work completed.</CardDescription>
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
                          <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">Operating Site</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly disabled className="bg-muted font-bold" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="reportDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">Work Execution Date</FormLabel>
                           <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant="outline" className={cn("pl-3 text-left font-bold", !hasYesterdayReport && "border-destructive text-destructive")}>
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

                  <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="text-lg font-medium">Work Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="itemOfWork"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item of Work</FormLabel>
                            <Select onValueChange={handleItemChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select work item for your site" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {siteBoqItems.map(item => (
                                  <SelectItem key={item.item} value={item.item}>{item.item}</SelectItem>
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
                              <FormLabel>Sub Item of Work (Optional)</FormLabel>
                              <FormControl><Input placeholder="e.g., Waterproofing" {...field} /></FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                    </div>
                    <FormField
                        control={form.control}
                        name="quantityOfWork"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Quantity of Work Done</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                  </div>

                  {/* Material Consumption */}
                  <Card>
                    <CardHeader>
                        <CardTitle>Material Consumption</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-2/5">Material Name</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {materialFields.map((field, index) => (
                                <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                    control={form.control}
                                    name={`materials.${index}.materialName`}
                                    render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input placeholder="Material Name" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                    control={form.control}
                                    name={`materials.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem><FormControl><Input type="number" placeholder="e.g., 50" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                    control={form.control}
                                    name={`materials.${index}.unit`}
                                    render={({ field }) => (
                                        <FormItem><FormControl><Input placeholder="Unit" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}
                                    />
                                </TableCell>
                                 <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`materials.${index}.rate`}
                                    render={({ field }) => (
                                        <FormItem><FormControl><Input type="number" placeholder="Rate" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeMaterial(index)} disabled={materialFields.length <= 1}>
                                    <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendMaterial({ materialName: '', quantity: 0, unit: '', rate: 0 })} className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Material
                        </Button>
                    </CardContent>
                  </Card>

                  {/* Equipment Usage */}
                  <Card>
                    <CardHeader><CardTitle>Equipment &amp; Vehicle Usage</CardTitle></CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Equipment/Vehicle</TableHead>
                                    <TableHead>Usage (Hrs)</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Rate/hr ($)</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {equipmentFields.map((field, index) => (
                                    <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`equipment.${index}.source`}
                                            render={({ field }) => (
                                                <FormItem>
                                                <Select onValueChange={(value) => handleEquipmentSourceChange(value, index)} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {[...new Set(mockBoqData.equipment.map(e => e.source))].map(source => (
                                                            <SelectItem key={source} value={source}>{source}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`equipment.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                <Select onValueChange={(value) => handleEquipmentNameChange(value, index)} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {availableEquipment(index).map(eq => (
                                                            <SelectItem key={eq.name} value={eq.name}>{eq.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`equipment.${index}.usage`}
                                            render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="e.g., 8" {...field} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`equipment.${index}.unit`}
                                            render={({ field }) => (
                                                <FormItem><FormControl><Input readOnly disabled {...field} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                      <FormField
                                        control={form.control}
                                        name={`equipment.${index}.rate`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" placeholder="Rate" {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>
                                        )}
                                      />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeEquipment(index)} disabled={equipmentFields.length <= 1}>
                                        <Trash className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendEquipment({ source: '', name: '', usage: 0, unit: '', rate: 0 })} className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Equipment
                        </Button>
                    </CardContent>
                  </Card>

                  {/* Workforce Details */}
                  <Card>
                    <CardHeader><CardTitle>Workforce Details</CardTitle></CardHeader>
                    <CardContent>
                       <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Skill Type</TableHead>
                                    <TableHead>Designation</TableHead>
                                    <TableHead>Worker Count</TableHead>
                                    <TableHead>Hours</TableHead>
                                    <TableHead>OT Hours</TableHead>
                                    <TableHead>Rate/hr ($)</TableHead>
                                    <TableHead>OT Rate/hr ($)</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {workforceFields.map((field, index) => (
                                    <TableRow key={field.id}>
                                    <TableCell>
                                         <FormField
                                            control={form.control}
                                            name={`workforce.${index}.skill`}
                                            render={({ field }) => (
                                                <FormItem>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select skill" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                       {[...new Set(mockBoqData.workforce.map(w => w.skill))].map(skill => (
                                                            <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                                                       ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                         <FormField
                                            control={form.control}
                                            name={`workforce.${index}.designation`}
                                            render={({ field }) => (
                                                <FormItem>
                                                <Select onValueChange={(value) => handleWorkforceDesignationChange(value, index)} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {[...new Set(mockBoqData.workforce.map(w => w.designation))].map(des => (
                                                            <SelectItem key={des} value={des}>{des}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`workforce.${index}.count`}
                                            render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`workforce.${index}.hours`}
                                            render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="e.g., 8" {...field} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`workforce.${index}.otHours`}
                                            render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="e.g., 2" {...field} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`workforce.${index}.rate`}
                                            render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="Rate" {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`workforce.${index}.otRate`}
                                            render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" placeholder="OT Rate" {...field} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeWorkforce(index)} disabled={workforceFields.length <= 1}>
                                        <Trash className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendWorkforce({ skill: '', designation: '', count: 0, hours: 0, otHours: 0, rate: 0, otRate: 0 })} className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Workforce
                        </Button>
                    </CardContent>
                  </Card>

                  <Button type="submit" size="lg" className="w-full font-black uppercase tracking-widest py-8 text-lg" disabled={form.formState.isSubmitting}>
                    <Save className="mr-2 h-6 w-6" />
                    {form.formState.isSubmitting ? 'Submitting...' : 'Finalize Daily Report & Calculate Cost'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {submittedReport && (
          <div className="lg:col-span-2">
            <Card className="sticky top-24 border-primary/20 shadow-2xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2"><DollarSign /> Cost Analysis Summary</CardTitle>
                <CardDescription>
                  Cost breakdown for the work done on {format(submittedReport.reportDate, 'PPP')}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2 rounded-xl border p-4 bg-muted/20">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Verified Work Item</h3>
                  <p className="text-lg font-black">{submittedReport.itemOfWork}</p>
                  <Badge variant="outline" className="font-bold">{submittedReport.quantityOfWork} Progress Units</Badge>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Resource Cost Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm p-3 rounded-lg border bg-background">
                        <div className="flex flex-col">
                            <span className="font-bold">Material Cost</span>
                            <span className="text-[10px] text-muted-foreground">Consumption Audit</span>
                        </div>
                        <span className="font-black text-lg">${submittedReport.costs.materialCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 rounded-lg border bg-background">
                        <div className="flex flex-col">
                            <span className="font-bold">Equipment Cost</span>
                            <span className="text-[10px] text-muted-foreground">Hours & Fuel Allocation</span>
                        </div>
                        <span className="font-black text-lg">${submittedReport.costs.equipmentCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 rounded-lg border bg-background">
                        <div className="flex flex-col">
                            <span className="font-bold">Workforce Cost</span>
                            <span className="text-[10px] text-muted-foreground">Regular & OT Payroll</span>
                        </div>
                        <span className="font-black text-lg">${submittedReport.costs.workforceCost.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t-2 border-primary/10">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Total Estimated Cost</p>
                            <p className="text-muted-foreground text-[9px] italic">Based on fixed project rates</p>
                        </div>
                        <span className="text-4xl font-black text-primary font-headline">${submittedReport.costs.totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full font-bold uppercase text-[10px] tracking-widest h-12" onClick={() => setSubmittedReport(null)}>
                    Dismiss Review
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
