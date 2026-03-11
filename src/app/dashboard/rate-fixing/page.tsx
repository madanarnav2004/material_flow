'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  DollarSign, 
  Upload, 
  Download, 
  PlusCircle, 
  Save, 
  Trash, 
  FileSpreadsheet, 
  CheckCircle2, 
  Wrench, 
  Users, 
  UserPlus, 
  Package
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useMaterialContext, type MasterRateItem } from '@/context/material-context';

// --- SCHEMAS ---

const rateItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Item name is required.'),
  unit: z.string().min(1, 'Unit is required.'),
  rate: z.coerce.number().min(0, 'Rate must be a positive number.'),
});

const categoryRatesSchema = z.object({
  items: z.array(rateItemSchema),
});

type CategoryRatesValues = z.infer<typeof categoryRatesSchema>;

// --- REUSABLE CATEGORY COMPONENT ---

interface RateCategoryProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  categoryKey: 'material' | 'equipment' | 'worker' | 'helper';
  initialData: MasterRateItem[];
}

function RateCategoryManager({ title, description, icon, categoryKey, initialData }: RateCategoryProps) {
  const { toast } = useToast();
  const { setMaterialsRate, setEquipmentRate, setWorkersRate, setHelpersRate } = useMaterialContext();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const form = useForm<CategoryRatesValues>({
    resolver: zodResolver(categoryRatesSchema),
    defaultValues: {
      items: initialData.length > 0 ? initialData : [{ id: `initial-${Date.now()}`, name: '', unit: '', rate: 0 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Keep form in sync if context initial data changes (e.g. first load)
  React.useEffect(() => {
    if (initialData.length > 0) {
      replace(initialData);
    }
  }, [initialData, replace]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    // Simulate Excel parsing delay
    setTimeout(() => {
      // Mock parsed data from Excel based on category
      const mockParsedData = [
        { id: `xl-${Date.now()}-1`, name: `${title} Master A`, unit: categoryKey === 'material' ? 'bag' : 'day', rate: 150 },
        { id: `xl-${Date.now()}-2`, name: `${title} Master B`, unit: categoryKey === 'material' ? 'ton' : 'hr', rate: 275 },
        { id: `xl-${Date.now()}-3`, name: `${title} Master C`, unit: categoryKey === 'material' ? 'cu.m.' : 'day', rate: 420 },
      ];

      replace(mockParsedData);
      setIsProcessing(false);
      toast({
        title: 'Excel Data Processed',
        description: `Successfully loaded ${mockParsedData.length} items from ${file.name}. Review them below.`,
      });
    }, 1000);
  };

  const onExport = () => {
    const items = form.getValues().items;
    if (items.length === 0) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No data to export.' });
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Item Name,Unit,Rate\n"
      + items.map(i => `"${i.name}","${i.unit}",${i.rate}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${categoryKey}-rates.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: `Rate sheet for ${title} has been downloaded.`,
    });
  };

  const onSubmit = (values: CategoryRatesValues) => {
    console.log(`Saving ${categoryKey} rates to context:`, values);
    
    if (categoryKey === 'material') setMaterialsRate(values.items);
    else if (categoryKey === 'equipment') setEquipmentRate(values.items);
    else if (categoryKey === 'worker') setWorkersRate(values.items);
    else if (categoryKey === 'helper') setHelpersRate(values.items);

    toast({
      title: 'Rates Finalized & Sync Enabled',
      description: `All ${values.items.length} ${title.toLowerCase()} rates are now live across all Site Daily Work Reports.`,
    });
  };

  return (
    <Card className="border-primary/10 shadow-lg">
      <CardHeader className="bg-primary/5 border-b rounded-t-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-xl border shadow-sm">
              {icon}
            </div>
            <div>
              <CardTitle>{title} Rate Fixing</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button variant="outline" className="h-10 px-4 font-bold" disabled={isProcessing}>
                <Upload className="mr-2 h-4 w-4" /> 
                {isProcessing ? 'Reading...' : 'Sync via Excel'}
              </Button>
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
              />
            </div>
            <Button variant="outline" className="h-10 px-4 font-bold" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" /> Export Ledger
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-xl border overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-1/2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item Description</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unit</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fix Rate ($)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((item, index) => (
                    <TableRow key={item.id} className="h-14 hover:bg-muted/20">
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Enter item name..." {...field} className="h-9 text-sm font-medium border-none shadow-none focus-visible:ring-1" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="e.g. Kg, Bag" {...field} className="h-9 text-sm border-none shadow-none focus-visible:ring-1" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.rate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" step="any" {...field} className="h-9 text-sm font-black text-primary border-none shadow-none focus-visible:ring-1" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => remove(index)} 
                          disabled={fields.length <= 1}
                          className="h-8 w-8 text-destructive opacity-20 hover:opacity-100"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-6">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => append({ id: Date.now().toString(), name: '', unit: '', rate: 0 })}
                className="font-bold text-primary"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Manual Row
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" type="button" onClick={() => replace([{ id: Date.now().toString(), name: '', unit: '', rate: 0 }])}>
                  Clear Table
                </Button>
                <Button type="submit" size="lg" className="px-8 font-black uppercase tracking-widest">
                  <Save className="mr-2 h-5 w-5" /> Save {title} Master
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// --- MAIN PAGE ---

export default function RateFixingPage() {
  const { materialsRate, equipmentRate, workersRate, helpersRate } = useMaterialContext();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black font-headline text-primary flex items-center gap-2">
          <DollarSign className="h-8 w-8" /> Pricing Master & Rate Fixing
        </h1>
        <p className="text-muted-foreground">Standardize project costs for Materials, Equipment, and Workforce across all sites.</p>
      </div>

      <Tabs defaultValue="material" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-3xl bg-muted/50 p-1 mb-8">
          <TabsTrigger value="material" className="flex items-center gap-2 font-bold data-[state=active]:bg-background">
            <Package className="h-4 w-4" /> Material
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2 font-bold data-[state=active]:bg-background">
            <Wrench className="h-4 w-4" /> Equipment
          </TabsTrigger>
          <TabsTrigger value="worker" className="flex items-center gap-2 font-bold data-[state=active]:bg-background">
            <Users className="h-4 w-4" /> Skilled Worker
          </TabsTrigger>
          <TabsTrigger value="helper" className="flex items-center gap-2 font-bold data-[state=active]:bg-background">
            <UserPlus className="h-4 w-4" /> Helper
          </TabsTrigger>
        </TabsList>

        <TabsContent value="material" className="mt-0 outline-none">
          <RateCategoryManager 
            title="Material" 
            description="Manage purchase rates. Linked to Site Material Dropdowns."
            icon={<Package className="h-6 w-6 text-blue-600" />}
            categoryKey="material"
            initialData={materialsRate}
          />
        </TabsContent>

        <TabsContent value="equipment" className="mt-0 outline-none">
          <RateCategoryManager 
            title="Equipment" 
            description="Hourly hire rates. Auto-populates Site Equipment Selectors."
            icon={<Wrench className="h-6 w-6 text-amber-600" />}
            categoryKey="equipment"
            initialData={equipmentRate}
          />
        </TabsContent>

        <TabsContent value="worker" className="mt-0 outline-none">
          <RateCategoryManager 
            title="Skilled Worker" 
            description="Trade payroll rates. Standardizes designation select lists."
            icon={<Users className="h-6 w-6 text-green-600" />}
            categoryKey="worker"
            initialData={workersRate}
          />
        </TabsContent>

        <TabsContent value="helper" className="mt-0 outline-none">
          <RateCategoryManager 
            title="Helper" 
            description="Basic labor daily rates. Updates labor cost analysis."
            icon={<UserPlus className="h-6 w-6 text-purple-600" />}
            categoryKey="helper"
            initialData={helpersRate}
          />
        </TabsContent>
      </Tabs>

      <div className="p-6 rounded-2xl bg-muted/30 border-2 border-dashed flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h4 className="font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" /> Auto-Sync Active
          </h4>
          <p className="text-sm text-muted-foreground">Changes saved here are instantly reflected in the 'Daily Work Done' dropdowns for all Site Managers.</p>
        </div>
        <Badge variant="outline" className="uppercase tracking-widest text-[10px] font-black px-4 py-2 border-primary/20">
          Organization Master Live
        </Badge>
      </div>
    </div>
  );
}
