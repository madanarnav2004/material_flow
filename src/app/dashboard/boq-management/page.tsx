'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileUp, 
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
  category: z.string().min(1, 'Category is required.'),
  subItemOfWork: z.string().min(1, 'Sub-item is required.'),
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

  // Load existing site BOQ into the editable table
  React.useEffect(() => {
    if (activeSite) {
      const siteBoq = boqItems.filter(item => item.site === activeSite);
      replace(siteBoq.length > 0 ? siteBoq : [{ 
        id: Date.now().toString(), 
        category: '', 
        subItemOfWork: '', 
        boqQty: 0, 
        unit: '', 
        boqRate: 0 
      }]);
    }
  }, [activeSite, boqItems, replace]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeSite) {
      toast({ variant: 'destructive', title: 'Action Required', description: 'Please select a site before uploading Excel.' });
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    // Simulate Excel parsing logic for required fields
    setTimeout(() => {
      const mockParsedData: BOQItem[] = [
        { 
          id: `xl-${Date.now()}-1`, 
          category: 'Earthwork', 
          subItemOfWork: 'Excavation in soft soil', 
          boqQty: 1250, 
          unit: 'm³', 
          boqRate: 15.50,
          materialTypes: 'None',
          equipment: 'JCB, Dumper',
          source: 'Rented',
          workforce: 'Helper',
          site: activeSite
        },
        { 
          id: `xl-${Date.now()}-2`, 
          category: 'Concrete', 
          subItemOfWork: 'PCC 1:4:8 Foundation', 
          boqQty: 450, 
          unit: 'm³', 
          boqRate: 110.00,
          materialTypes: 'Cement, Sand, Aggregate',
          equipment: 'Mixer',
          source: 'Owned',
          workforce: 'Mason, Helper',
          site: activeSite
        },
        { 
          id: `xl-${Date.now()}-3`, 
          category: 'Steel', 
          subItemOfWork: 'Reinforcement FE500', 
          boqQty: 25, 
          unit: 'ton', 
          boqRate: 850.00,
          materialTypes: 'Rebar',
          equipment: 'Cutter',
          source: 'Owned',
          workforce: 'Fitter',
          site: activeSite
        },
      ];

      replace(mockParsedData);
      setIsProcessing(false);
      toast({
        title: 'Excel BOQ Processed',
        description: `Successfully loaded ${mockParsedData.length} line items for ${activeSite}. Review and edit below.`,
      });
    }, 1200);
  };

  const onSubmit = (values: BOQFormValues) => {
    // Merge new items with other site items
    const otherSitesItems = boqItems.filter(item => item.site !== values.site);
    const updatedSiteItems = values.items.map(item => ({ ...item, site: values.site }));
    
    setBoqItems([...otherSitesItems, ...updatedSiteItems]);

    toast({
      title: 'BOQ Master Updated',
      description: `Finalized ${values.items.length} items for ${values.site}. These will now appear in Work Done reports.`,
    });
  };

  const filteredFields = fields.filter(field => 
    field.subItemOfWork.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary flex items-center gap-3 uppercase tracking-tighter">
            <FileSpreadsheet className="h-8 w-8" /> BOQ Master Management
          </h1>
          <p className="text-muted-foreground font-medium">Upload, edit, and synchronize site-wise Bill of Quantities</p>
        </div>
        {activeSite && (
          <Badge variant="outline" className="h-10 px-4 text-sm font-black border-primary/20 bg-primary/5 uppercase tracking-widest">
            Active Site: {activeSite}
          </Badge>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-primary/10 shadow-lg overflow-hidden">
            <CardHeader className="bg-primary/5 border-b py-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <FormField
                  control={form.control}
                  name="site"
                  render={({ field }) => (
                    <FormItem className="w-full md:w-72">
                      <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Project Site Context</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 font-bold border-2">
                            <SelectValue placeholder="Select site to configure BOQ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sites.map(site => <SelectItem key={site} value={site}>{site}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <Button variant="outline" className="h-11 px-6 font-black uppercase tracking-widest border-2 border-dashed hover:border-primary hover:text-primary transition-all" disabled={!activeSite || isProcessing}>
                      <Upload className="mr-2 h-4 w-4" /> 
                      {isProcessing ? 'Parsing...' : 'Upload overall BOQ Excel'}
                    </Button>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      accept=".xlsx, .xls, .csv" 
                      onChange={handleFileUpload}
                      disabled={!activeSite || isProcessing}
                    />
                  </div>
                  <Button variant="outline" type="button" className="h-11 font-bold" onClick={() => replace([{ id: Date.now().toString(), category: '', subItemOfWork: '', boqQty: 0, unit: '', boqRate: 0 }])} disabled={!activeSite}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                </div>
              </div>
            </CardHeader>

            {activeSite ? (
              <CardContent className="p-0">
                <div className="p-4 bg-muted/20 border-b flex items-center justify-between">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search sub-items..." 
                      className="pl-9 h-9 border-none bg-background shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase text-muted-foreground">
                    <span>Total Line Items: {fields.length}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>Estimated Site Value: ${fields.reduce((acc, f) => acc + (Number(f.boqQty) * Number(f.boqRate)), 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="h-10">
                        <TableHead className="text-[9px] font-black uppercase px-4 w-48">Category</TableHead>
                        <TableHead className="text-[9px] font-black uppercase w-64">Sub-Item of Work</TableHead>
                        <TableHead className="text-[9px] font-black uppercase w-24">BOQ Qty</TableHead>
                        <TableHead className="text-[9px] font-black uppercase w-20">Unit</TableHead>
                        <TableHead className="text-[9px] font-black uppercase w-32">BOQ Rate ($)</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Metadata (Mat/Eq/Lbr)</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((item, index) => {
                        // Applying search filter visually
                        if (searchTerm && !item.subItemOfWork.toLowerCase().includes(searchTerm.toLowerCase()) && !item.category.toLowerCase().includes(searchTerm.toLowerCase())) return null;
                        
                        return (
                          <TableRow key={item.id} className="h-14 hover:bg-muted/10 group transition-colors">
                            <TableCell className="px-4">
                              <FormField
                                control={form.control}
                                name={`items.${index}.category`}
                                render={({ field }) => (
                                  <FormItem><FormControl><Input placeholder="Category" {...field} className="h-8 text-xs font-bold border-none shadow-none focus-visible:ring-1" /></FormControl></FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.subItemOfWork`}
                                render={({ field }) => (
                                  <FormItem><FormControl><Input placeholder="Sub-Item Description" {...field} className="h-8 text-xs border-none shadow-none focus-visible:ring-1" /></FormControl></FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.boqQty`}
                                render={({ field }) => (
                                  <FormItem><FormControl><Input type="number" step="any" {...field} className="h-8 text-xs font-black border-none shadow-none focus-visible:ring-1 text-primary" /></FormControl></FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.unit`}
                                render={({ field }) => (
                                  <FormItem><FormControl><Input placeholder="Unit" {...field} className="h-8 text-xs border-none shadow-none focus-visible:ring-1" /></FormControl></FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.boqRate`}
                                render={({ field }) => (
                                  <FormItem><FormControl><Input type="number" step="any" {...field} className="h-8 text-xs font-black border-none shadow-none focus-visible:ring-1 text-green-600" /></FormControl></FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Badge variant="secondary" className="text-[8px] h-4">M: {form.watch(`items.${index}.materialTypes`) || '-'}</Badge>
                                <Badge variant="secondary" className="text-[8px] h-4">E: {form.watch(`items.${index}.equipment`) || '-'}</Badge>
                                <Badge variant="secondary" className="text-[8px] h-4">W: {form.watch(`items.${index}.workforce`) || '-'}</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="px-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => remove(index)} 
                                disabled={fields.length <= 1}
                                className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="p-6 bg-muted/10 border-t flex justify-between items-center">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => append({ id: Date.now().toString(), category: '', subItemOfWork: '', boqQty: 0, unit: '', boqRate: 0 })}
                    className="font-bold text-primary h-9"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Manual Line Item
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="outline" type="button" className="h-11 px-8 font-bold" onClick={() => form.reset()}>Discard Changes</Button>
                    <Button type="submit" size="lg" className="h-11 px-10 font-black uppercase tracking-widest shadow-lg">
                      <Save className="mr-2 h-5 w-5" /> Finalize Site BOQ Master
                    </Button>
                  </div>
                </div>
              </CardContent>
            ) : (
              <div className="p-32 text-center space-y-4">
                <div className="bg-primary/10 h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <TableIcon className="h-10 w-10 text-primary opacity-40" />
                </div>
                <h3 className="text-xl font-black font-headline uppercase">Select a Site to Begin</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">Choose a project site from the dropdown above to manage its master Bill of Quantities or upload a new configuration.</p>
              </div>
            )}
          </Card>
        </form>
      </Form>

      {boqItems.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="py-4">
            <CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Active Master Configurations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0 pb-4">
            {Array.from(new Set(boqItems.map(i => i.site))).map(site => (
              <Badge key={site} variant="secondary" className="font-bold py-1 px-3">
                {site} ({boqItems.filter(i => i.site === site).length} items)
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}