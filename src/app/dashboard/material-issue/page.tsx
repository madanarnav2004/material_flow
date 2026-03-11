'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, PlusCircle, Trash, ClipboardList, Download, ArrowRightLeft, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { useMaterialContext, type SiteIssueVoucher } from '@/context/material-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/hooks/use-user';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const materialIssueItemSchema = z.object({
  materialName: z.string().min(1, 'Material is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  unit: z.string(),
  returnable: z.boolean().default(false),
  remarks: z.string().optional(),
});

const issueSchema = z.object({
  issueType: z.enum(['Local', 'Shifting']),
  siteName: z.string(),
  receivingSite: z.string().optional(),
  issueDate: z.date({ required_error: 'Issue date is required.' }),
  issuedTo: z.string().min(1, 'Engineer/Contractor name is required.'),
  buildingName: z.string().min(1, 'Building/Location is required.'),
  materials: z.array(materialIssueItemSchema).min(1, 'Please add at least one material.'),
});

type IssueFormValues = z.infer<typeof issueSchema>;

export default function MaterialIssuePage() {
  const { toast } = useToast();
  const { site } = useUser();
  const { inventory, setInventory, setSiteIssues, setIssuedMaterials } = useMaterialContext();
  const [lastVoucher, setLastVoucher] = React.useState<SiteIssueVoucher | null>(null);
  const voucherContentRef = React.useRef<HTMLDivElement>(null);
  
  const siteName = site || '';

  const siteStock = React.useMemo(() => {
    return inventory.filter(item => item.site === siteName);
  }, [inventory, siteName]);

  const otherSites = React.useMemo(() => {
    const sites = Array.from(new Set(inventory.map(i => i.site)));
    return sites.filter(s => s !== siteName);
  }, [inventory, siteName]);

  const form = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      issueType: 'Local',
      siteName: siteName,
      issueDate: new Date(),
      issuedTo: '',
      buildingName: '',
      materials: [{ materialName: '', quantity: 0, unit: '', returnable: false, remarks: '' }],
    },
  });

  const issueType = form.watch('issueType');

  React.useEffect(() => {
    if (siteName) {
      form.setValue('siteName', siteName);
    }
  }, [siteName, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  const handleMaterialChange = (materialName: string, index: number) => {
    const selectedStock = siteStock.find(stock => stock.material === materialName);
    form.setValue(`materials.${index}.materialName`, materialName);
    if (selectedStock) {
      form.setValue(`materials.${index}.unit`, selectedStock.unit);
    }
  };

  function onSubmit(values: IssueFormValues) {
    // 1. Check for sufficient stock
    for (const material of values.materials) {
      const stockItem = siteStock.find(s => s.material === material.materialName);
      if (!stockItem || stockItem.quantity < material.quantity) {
        toast({
          variant: 'destructive',
          title: 'Insufficient Stock',
          description: `Not enough ${material.materialName} available at ${values.siteName}. Available: ${stockItem?.quantity || 0}.`,
        });
        return;
      }
    }

    // 2. Generate Voucher
    const voucherId = `${values.issueType === 'Local' ? 'LOC' : 'SHIFT'}-${format(new Date(), 'yyyyMMdd-HHmmss')}`;
    const newVoucher: SiteIssueVoucher = {
      ...values,
      voucherId,
      issueDate: values.issueDate.toISOString(),
      issueType: values.issueType,
      issuedTo: values.issuedTo,
      buildingName: values.buildingName,
    };
    
    setLastVoucher(newVoucher);
    setSiteIssues(prev => [newVoucher, ...prev]);

    // If Shifting, also add to Inter-site tracking for the receipt page
    if (values.issueType === 'Shifting' && values.receivingSite) {
        values.materials.forEach(material => {
            setIssuedMaterials(prev => [...prev, {
                requestId: 'MANUAL-SHIFT',
                issuedId: voucherId,
                materialName: material.materialName,
                issuedQuantity: material.quantity,
                issuingSite: values.siteName,
                receivingSite: values.receivingSite!,
                unit: material.unit,
                rate: 0, // Manual shift might not have rate immediately available
            }]);
        });
    }

    // 3. Update Inventory (Deduct from current site)
    setInventory(prevInventory => {
      const newInventory = [...prevInventory];
      values.materials.forEach(material => {
        const itemIndex = newInventory.findIndex(i => i.site === values.siteName && i.material === material.materialName);
        if (itemIndex > -1) {
          newInventory[itemIndex].quantity -= material.quantity;
        }
      });
      return newInventory;
    });

    toast({
      title: values.issueType === 'Local' ? 'Local Issue Voucher Generated!' : 'Inter-Site Transfer Generated!',
      description: `Inventory for ${values.siteName} has been updated.`,
    });
    
    form.reset({
        issueType: values.issueType,
        siteName: siteName,
        issueDate: new Date(),
        issuedTo: '',
        buildingName: '',
        materials: [{ materialName: '', quantity: 0, unit: '', returnable: false, remarks: '' }],
    });
  }
  
  const handleDownload = (voucherId: string) => {
    if (voucherContentRef.current) {
      const voucherHtml = voucherContentRef.current.innerHTML;
      const blob = new Blob([`<html><head><title>${voucherId}</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}.grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.font-semibold{font-weight:600}.uppercase{text-transform:uppercase}</style></head><body>${voucherHtml}</body></html>`], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${voucherId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Download Started",
        description: `Voucher ${voucherId} is downloading.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <ClipboardList /> Site Material Management
      </h1>

      <Tabs defaultValue="Local" onValueChange={(val) => form.setValue('issueType', val as any)}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="Local" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" /> Local Consumption
          </TabsTrigger>
          <TabsTrigger value="Shifting" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" /> Inter-Site Shifting
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mt-6">
            <div className="lg:col-span-3">
            <Card>
                <CardHeader>
                <CardTitle>{issueType === 'Local' ? 'Local Site Issue' : 'Site to Site Shifting'}</CardTitle>
                <CardDescription>
                    {issueType === 'Local' 
                        ? 'Log materials issued for local construction to employees or contractors.' 
                        : 'Dispatch materials to another Swanag site or central godown.'}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                        control={form.control}
                        name="siteName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Source Site</FormLabel>
                            <FormControl><Input {...field} readOnly disabled /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="issueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Issue Date</FormLabel>
                            <FormControl><Input value={format(field.value, 'PPP')} readOnly disabled className="bg-muted" /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                        control={form.control}
                        name="issuedTo"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{issueType === 'Local' ? 'Engineer / Contractor Name' : 'Sender / Representative'}</FormLabel>
                            <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        {issueType === 'Local' ? (
                            <FormField
                                control={form.control}
                                name="buildingName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Site Location (Building/Tower)</FormLabel>
                                    <FormControl><Input placeholder="e.g., Tower A, Basement" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : (
                            <FormField
                                control={form.control}
                                name="receivingSite"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Receiving Site</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select target site" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {otherSites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    <div>
                        <Label>Material Details</Label>
                        <div className="mt-2 rounded-md border">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-2/5">Material</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Unit</TableHead>
                                {issueType === 'Local' && <TableHead>Returnable</TableHead>}
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                    control={form.control}
                                    name={`materials.${index}.materialName`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <Select onValueChange={(value) => handleMaterialChange(value, index)} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select from stock" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                            {siteStock.map(stock => (
                                                <SelectItem key={stock.id} value={stock.material}>
                                                {stock.material} ({stock.quantity} {stock.unit} available)
                                                </SelectItem>
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
                                    name={`materials.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem><FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                    control={form.control}
                                    name={`materials.${index}.unit`}
                                    render={({ field }) => (
                                        <FormItem><FormControl><Input readOnly disabled {...field} className="bg-muted" /></FormControl><FormMessage /></FormItem>
                                    )}
                                    />
                                </TableCell>
                                {issueType === 'Local' && (
                                    <TableCell>
                                        <FormField
                                        control={form.control}
                                        name={`materials.${index}.returnable`}
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-center h-full">
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )}
                                        />
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                    <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ materialName: '', quantity: 0, unit: '', returnable: false, remarks: '' })} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Material Row
                        </Button>
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting || !siteName}>
                        {form.formState.isSubmitting ? 'Processing...' : `Generate ${issueType} Voucher`}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            </div>

            {lastVoucher && (
            <div className="lg:col-span-2">
                <Card className="border-primary/20 shadow-lg">
                <CardHeader className="flex flex-row items-start justify-between bg-primary/5 rounded-t-lg">
                    <div>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="text-primary" /> Audit Voucher
                    </CardTitle>
                    <CardDescription className="uppercase tracking-widest text-[10px] font-bold">
                        {lastVoucher.issueType} Resource Allocation
                    </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(lastVoucher.voucherId)}>
                    <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                </CardHeader>
                <CardContent ref={voucherContentRef} className="space-y-4 text-sm p-6">
                    <div className="space-y-2 rounded-lg border p-4 bg-muted/30">
                    <h3 className="font-bold text-[10px] uppercase text-muted-foreground">Voucher Header</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <p><strong>Voucher ID:</strong> {lastVoucher.voucherId}</p>
                        <p><strong>Issue Date:</strong> {format(new Date(lastVoucher.issueDate), 'PPP')}</p>
                        <p><strong>Site:</strong> {lastVoucher.siteName}</p>
                        <p><strong>Issued To:</strong> {lastVoucher.issuedTo}</p>
                        {lastVoucher.issueType === 'Local' ? (
                            <p><strong>Location:</strong> {lastVoucher.buildingName}</p>
                        ) : (
                            <p><strong>Target Site:</strong> {lastVoucher.receivingSite}</p>
                        )}
                    </div>
                    </div>

                    <div className="space-y-2">
                    <h3 className="font-bold text-[10px] uppercase text-muted-foreground px-1">Resource Table</h3>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="h-8 text-[10px]">Resource</TableHead>
                                <TableHead className="h-8 text-[10px]">Qty</TableHead>
                                {lastVoucher.issueType === 'Local' && <TableHead className="h-8 text-[10px]">Returnable</TableHead>}
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {lastVoucher.materials.map((item, index) => (
                                <TableRow key={index} className="h-10">
                                <TableCell className="font-medium">{item.materialName} ({item.unit})</TableCell>
                                <TableCell className="font-bold">{item.quantity}</TableCell>
                                {lastVoucher.issueType === 'Local' && <TableCell>{item.returnable ? <Badge variant="secondary" className="text-[9px]">YES</Badge> : 'No'}</TableCell>}
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                    </div>
                </CardContent>
                </Card>
            </div>
            )}
        </div>
      </Tabs>
    </div>
  );
}
