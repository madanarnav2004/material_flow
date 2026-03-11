'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  PlusCircle, 
  Trash, 
  Save, 
  CheckCircle2, 
  RefreshCcw,
  Search,
  Table as TableIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMaterialContext, type BOQItem } from '@/context/material-context';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const boqItemSchema = z.object({
  id: z.string(),
  categoryNo: z.string().min(1, 'Category No is required.'),
  itemNo: z.string().min(1, 'Item No is required.'),
  itemOfWork: z.string().min(1, 'Item of Work is required.'),
  subItemOfWork: z.string().min(1, 'Sub-Item is required.'),
  boqQty: z.coerce.number().min(0.1, 'Qty must be > 0.'),
  unit: z.string().min(1, 'Unit is required.'),
  boqRate: z.coerce.number().min(0, 'Rate must be positive.'),
  materialTypes: z.string().optional(),
  equipment: z.string().optional(),
  source: z.string().optional(),
  workforce: z.string().optional(),
  skillsAndRates: z.string().optional(),
});

const boqFormSchema = z.object({
  site: z.string().min(1, 'Please select a site.'),
  items: z.array(boqItemSchema),
});

type BOQFormValues = z.infer<typeof boqFormSchema>;

export default function BOQManagementPage() {
  const { toast } = useToast();
  const { boqItems, setBoqItems, inventory } = useMaterialContext();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const sites = Array.from(new Set(inventory.map(i => i.site))).filter(s => s !== 'MAPI Godown' && s !== 'Global');

  const form = useForm<BOQFormValues>({
    resolver: zodResolver(boqFormSchema),
    defaultValues: {
      site: '',
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const activeSite = form.watch('site');

  React.useEffect(() => {
    if (activeSite) {
      const siteBoq = boqItems.filter(item => item.site === activeSite);
      replace(siteBoq.length > 0 ? siteBoq : [{ 
        id: Date.now().toString(), 
        categoryNo: '', 
        itemNo: '', 
        itemOfWork: '', 
        subItemOfWork: '', 
        boqQty: 0, 
        unit: '', 
        boqRate: 0 
      }]);
    }
  }, [activeSite, boqItems, replace]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeSite) {
      toast({ variant: 'destructive', title: 'Action Required', description: 'Please select a site first.' });
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    setTimeout(() => {
      const mockParsedData: BOQItem[] = [
        { 
          id: `xl-${Date.now()}-1`, 
          categoryNo: '1', 
          itemNo: '1.1', 
          itemOfWork: 'Earthwork', 
          subItemOfWork: 'Excavation in soft soil', 
          boqQty: 1250, 
          unit: 'm³', 
          boqRate: 15.50,
          site: activeSite
        },
        { 
          id: `xl-${Date.now()}-2`, 
          categoryNo: '2', 
          itemNo: '2.1', 
          itemOfWork: 'Concrete', 
          subItemOfWork: 'PCC 1:4:8 Foundation', 
          boqQty: 450, 
          unit: 'm³', 
          boqRate: 110.00,
          site: activeSite
        },
      ];

      replace(mockParsedData);
      setIsProcessing(false);
      toast({
        title: 'BOQ Excel Processed',
        description: `Loaded ${mockParsedData.length} line items for ${activeSite}.`,
      });
    }, 1200);
  };

  const onSubmit = (values: BOQFormValues) => {
    const otherSitesItems = boqItems.filter(item => item.site !== values.site);
    const updatedSiteItems = values.items.map(item => ({ ...item, site: values.site }));
    
    setBoqItems([...otherSitesItems, ...updatedSiteItems]);

    toast({
      title: 'BOQ Master Updated',
      description: `Finalized ${values.items.length} line items. These are now integrated with site reports.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary uppercase tracking-tighter flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8" /> BOQ Master Configuration
          </h1>
          <p className="text-muted-foreground font-medium">Upload and manage site-specific Bill of Quantities</p>
        </div>
        {activeSite && <Badge variant="outline" className="h-10 px-4 font-black">Active: {activeSite}</Badge>}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <FormField
                  control={form.control}
                  name="site"
                  render={({ field }) => (
                    <FormItem className="w-full md:w-72">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Project Site Context</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="font-bold border-2"><SelectValue placeholder="Select site" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>{sites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Button variant="outline" className="font-black border-2 border-dashed" disabled={!activeSite || isProcessing}>
                      <Upload className="mr-2 h-4 w-4" /> {isProcessing ? 'Processing...' : 'Upload BOQ Excel'}
                    </Button>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} disabled={!activeSite} />
                  </div>
                  <Button variant="outline" type="button" onClick={() => replace([{ id: Date.now().toString(), categoryNo: '', itemNo: '', itemOfWork: '', subItemOfWork: '', boqQty: 0, unit: '', boqRate: 0 }])} disabled={!activeSite}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                </div>
              </div>
            </CardHeader>

            {activeSite ? (
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-[9px] font-black uppercase w-20">Cat #</TableHead>
                        <TableHead className="text-[9px] font-black uppercase w-20">Item #</TableHead>
                        <TableHead className="text-[9px] font-black uppercase w-48">Description of Work</TableHead>
                        <TableHead className="text-[9px] font-black uppercase w-64">Sub-Item Details</TableHead>
                        <TableHead className="text-[9px] font-black uppercase w-24 text-right">BOQ Qty</TableHead>
                        <TableHead className="text-[9px] font-black uppercase w-20">Unit</TableHead>
                        <TableHead className="text-[9px] font-black uppercase w-32 text-right">Rate ($)</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((item, index) => (
                        <TableRow key={item.id} className="h-14 hover:bg-muted/10 group">
                          <TableCell><FormField control={form.control} name={`items.${index}.categoryNo`} render={({ field }) => (<FormItem><FormControl><Input {...field} className="h-8 text-xs text-center border-none shadow-none"/></FormControl></FormItem>)}/></TableCell>
                          <TableCell><FormField control={form.control} name={`items.${index}.itemNo`} render={({ field }) => (<FormItem><FormControl><Input {...field} className="h-8 text-xs text-center border-none shadow-none"/></FormControl></FormItem>)}/></TableCell>
                          <TableCell><FormField control={form.control} name={`items.${index}.itemOfWork`} render={({ field }) => (<FormItem><FormControl><Input {...field} className="h-8 text-xs font-bold border-none shadow-none"/></FormControl></FormItem>)}/></TableCell>
                          <TableCell><FormField control={form.control} name={`items.${index}.subItemOfWork`} render={({ field }) => (<FormItem><FormControl><Input {...field} className="h-8 text-xs border-none shadow-none"/></FormControl></FormItem>)}/></TableCell>
                          <TableCell><FormField control={form.control} name={`items.${index}.boqQty`} render={({ field }) => (<FormItem><FormControl><Input type="number" step="any" {...field} className="h-8 text-xs font-black text-right border-none shadow-none text-primary"/></FormControl></FormItem>)}/></TableCell>
                          <TableCell><FormField control={form.control} name={`items.${index}.unit`} render={({ field }) => (<FormItem><FormControl><Input {...field} className="h-8 text-xs border-none shadow-none text-center"/></FormControl></FormItem>)}/></TableCell>
                          <TableCell><FormField control={form.control} name={`items.${index}.boqRate`} render={({ field }) => (<FormItem><FormControl><Input type="number" step="any" {...field} className="h-8 text-xs font-black text-right border-none shadow-none text-green-600"/></FormControl></FormItem>)}/></TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100"><Trash className="h-3 w-3" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-6 bg-muted/10 border-t flex justify-between">
                  <Button type="button" variant="ghost" onClick={() => append({ id: Date.now().toString(), categoryNo: '', itemNo: '', itemOfWork: '', subItemOfWork: '', boqQty: 0, unit: '', boqRate: 0 })} className="font-bold text-primary"><PlusCircle className="mr-2 h-4 w-4" /> Add Row</Button>
                  <div className="flex gap-3">
                    <Button variant="outline" type="button" onClick={() => form.reset()}>Discard</Button>
                    <Button type="submit" className="font-black uppercase tracking-widest"><Save className="mr-2 h-5 w-5" /> Finalize BOQ Master</Button>
                  </div>
                </div>
              </CardContent>
            ) : (
              <div className="p-32 text-center text-muted-foreground italic">Choose a site to manage its BOQ configuration.</div>
            )}
          </Card>
        </form>
      </Form>
    </div>
  );
}
