'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, PlusCircle, Trash, ClipboardList, Download, ArrowRightLeft, UserCheck, FileText, PackageCheck } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { useMaterialContext, type SiteIssueVoucher, type SiteIssueItem } from '@/context/material-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/hooks/use-user';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockBoqData } from '@/lib/mock-data';

// Updated Schema to handle Indent fulfillment as well
const materialIssueItemSchema = z.object({
  materialName: z.string().min(1, 'Material is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  unit: z.string().min(1, 'Unit is required.'),
  returnable: z.boolean().default(false),
  rate: z.coerce.number().optional(),
  remarks: z.string().optional(),
});

const issueSchema = z.object({
  issueMode: z.enum(['Indent', 'Local', 'Shifting']),
  indentId: z.string().optional(),
  siteName: z.string(),
  receivingSite: z.string().optional(),
  issueDate: z.date({ required_error: 'Issue date is required.' }),
  issuedTo: z.string().min(1, 'Engineer/Contractor name is required.'),
  buildingName: z.string().optional(),
  materials: z.array(materialIssueItemSchema).min(1, 'Please add at least one material.'),
}).refine(data => {
    if (data.issueMode === 'Indent') return !!data.indentId;
    return true;
}, {
    message: "Please select an indent to fulfill.",
    path: ["indentId"]
}).refine(data => {
    if (data.issueMode === 'Local') return !!data.buildingName;
    return true;
}, {
    message: "Building location is required for local issues.",
    path: ["buildingName"]
}).refine(data => {
    if (data.issueMode === 'Shifting') return !!data.receivingSite;
    return true;
}, {
    message: "Receiving site is required for shifting.",
    path: ["receivingSite"]
});

type IssueFormValues = z.infer<typeof issueSchema>;

export default function MaterialIssuePage() {
  const { toast } = useToast();
  const { user, site } = useUser();
  const { inventory, setInventory, setSiteIssues, setIssuedMaterials, requests } = useMaterialContext();
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
      issueMode: 'Local',
      siteName: siteName,
      issueDate: new Date(),
      issuedTo: '',
      buildingName: '',
      materials: [{ materialName: '', quantity: 0, unit: '', returnable: false, remarks: '', rate: 0 }],
    },
  });

  const issueMode = form.watch('issueMode');
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  // Effect to handle site update from user hook
  React.useEffect(() => {
    if (siteName) {
      form.setValue('siteName', siteName);
    }
  }, [siteName, form]);

  const handleIndentChange = (requestId: string) => {
    const selectedRequest = requests.find(r => r.id === requestId);
    if (selectedRequest) {
        form.setValue('indentId', requestId);
        form.setValue('issuedTo', selectedRequest.requesterName);
        
        const mappedMaterials = selectedRequest.materials.map(m => ({
            materialName: m.materialName,
            quantity: m.quantity,
            unit: m.unit,
            rate: m.rate || 0,
            returnable: false,
            remarks: m.remarks || ''
        }));
        
        replace(mappedMaterials);
        toast({ title: "Indent Loaded", description: "Material details have been auto-filled from the indent." });
    }
  };

  const handleMaterialChange = (materialName: string, index: number) => {
    const selectedStock = siteStock.find(stock => stock.material === materialName);
    form.setValue(`materials.${index}.materialName`, materialName);
    if (selectedStock) {
      form.setValue(`materials.${index}.unit`, selectedStock.unit);
      const boqInfo = mockBoqData.materials.find(m => m.type.toLowerCase() === materialName.toLowerCase());
      if (boqInfo) form.setValue(`materials.${index}.rate`, boqInfo.rate);
    }
  };

  function onSubmit(values: IssueFormValues) {
    // 1. Stock Check
    for (const material of values.materials) {
      const stockItem = siteStock.find(s => s.material === material.materialName);
      if (!stockItem || stockItem.quantity < material.quantity) {
        toast({
          variant: 'destructive',
          title: 'Insufficient Stock',
          description: `Only ${stockItem?.quantity || 0} ${stockItem?.unit || 'units'} of ${material.materialName} available at ${values.siteName}.`,
        });
        return;
      }
    }

    // 2. Generate Voucher ID
    const prefix = values.issueMode === 'Indent' ? 'IND' : values.issueMode === 'Local' ? 'LOC' : 'SHIFT';
    const voucherId = `${prefix}-${format(new Date(), 'yyyyMMdd-HHmmss')}`;
    
    const newVoucher: SiteIssueVoucher = {
      voucherId,
      siteName: values.siteName,
      issueDate: values.issueDate.toISOString(),
      issuedTo: values.issuedTo,
      buildingName: values.buildingName || 'N/A',
      issueType: values.issueMode === 'Shifting' ? 'Shifting' : 'Local',
      receivingSite: values.receivingSite,
      materials: values.materials as SiteIssueItem[],
    };
    
    setLastVoucher(newVoucher);
    setSiteIssues(prev => [newVoucher, ...prev]);

    // 3. Update Inter-site tracking if applicable
    if (values.issueMode === 'Shifting' && values.receivingSite) {
        values.materials.forEach(material => {
            setIssuedMaterials(prev => [...prev, {
                requestId: values.indentId || 'MANUAL-SHIFT',
                issuedId: voucherId,
                materialName: material.materialName,
                issuedQuantity: material.quantity,
                issuingSite: values.siteName,
                receivingSite: values.receivingSite!,
                unit: material.unit,
                rate: material.rate || 0,
            }]);
        });
    }

    // 4. Update Inventory (Deduct)
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
      title: 'Dispatch Successful',
      description: `Voucher ${voucherId} generated. Inventory updated.`,
    });
    
    form.reset({
        issueMode: values.issueMode,
        siteName: siteName,
        issueDate: new Date(),
        issuedTo: '',
        buildingName: '',
        materials: [{ materialName: '', quantity: 0, unit: '', returnable: false, remarks: '', rate: 0 }],
    });
  }
  
  const handleDownload = (voucherId: string) => {
    if (voucherContentRef.current) {
      const voucherHtml = voucherContentRef.current.innerHTML;
      const blob = new Blob([`<html><head><title>${voucherId}</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}.grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.font-bold{font-weight:700}.uppercase{text-transform:uppercase}.text-primary{color:hsl(206, 68%, 55%)}</style></head><body>${voucherHtml}</body></html>`], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${voucherId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Download Started", description: `Document ${voucherId} is downloading.` });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <ClipboardList className="text-primary" /> Material Dispatch & Issue
        </h1>
        <Badge variant="outline" className="uppercase text-[10px] tracking-widest font-bold px-3">Audit-Ready Dispatch</Badge>
      </div>

      <Tabs defaultValue="Local" value={issueMode} onValueChange={(val) => form.setValue('issueMode', val as any)}>
        <TabsList className="grid w-full grid-cols-3 max-w-2xl bg-muted/50 p-1">
          <TabsTrigger value="Indent" className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4" /> Fulfill Indent
          </TabsTrigger>
          <TabsTrigger value="Local" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" /> Local Consumption
          </TabsTrigger>
          <TabsTrigger value="Shifting" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" /> Inter-Site Transfer
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mt-6">
            <div className="lg:col-span-3">
            <Card className="border-primary/10 shadow-md">
                <CardHeader className="bg-primary/5 border-b rounded-t-lg">
                <CardTitle className="text-xl">
                    {issueMode === 'Indent' ? 'Dispatch for Approved Indent' : 
                     issueMode === 'Local' ? 'Direct On-Site Issue' : 'Inter-Site Shifting'}
                </CardTitle>
                <CardDescription>
                    {issueMode === 'Indent' ? 'Select an authorized indent to fulfill and generate an issue bill.' : 
                     issueMode === 'Local' ? 'Issue materials directly to contractors or for site tasks.' : 
                     'Move stock to another Swanag site or central godown.'}
                </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                        control={form.control}
                        name="siteName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Source Site (Issuing Point)</FormLabel>
                            <FormControl><Input {...field} readOnly disabled className="bg-muted font-bold" /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="issueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Issue Date</FormLabel>
                            <FormControl><Input value={format(field.value, 'PPP')} readOnly disabled className="bg-muted" /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {issueMode === 'Indent' ? (
                            <FormField
                                control={form.control}
                                name="indentId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-primary font-bold">Select Approved Indent</FormLabel>
                                    <Select onValueChange={handleIndentChange} value={field.value}>
                                        <FormControl><SelectTrigger className="border-primary/30"><SelectValue placeholder="Choose indent to fulfill" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {requests.filter(r => r.status === 'Director Approved').map(r => (
                                                <SelectItem key={r.id} value={r.id}>{r.id} - {r.requestingSite}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : null}

                        <FormField
                        control={form.control}
                        name="issuedTo"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs font-bold uppercase">Receiver (Engineer / Contractor)</FormLabel>
                            <FormControl><Input placeholder="Full Name" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        {issueMode === 'Local' ? (
                            <FormField
                                control={form.control}
                                name="buildingName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase">Work Location (Building/Tower)</FormLabel>
                                    <FormControl><Input placeholder="e.g., Tower A, 4th Floor" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : null}

                        {issueMode === 'Shifting' ? (
                            <FormField
                                control={form.control}
                                name="receivingSite"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-primary font-bold">Target Site (Receiving Point)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {otherSites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : null}
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <Label className="text-xs font-black uppercase text-primary tracking-widest">Material Line Items</Label>
                            {issueMode !== 'Indent' && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => append({ materialName: '', quantity: 0, unit: '', returnable: false, remarks: '', rate: 0 })} className="text-primary hover:bg-primary/5">
                                    <PlusCircle className="mr-1 h-3 w-3" /> Add Row
                                </Button>
                            )}
                        </div>
                        <div className="rounded-xl border overflow-hidden shadow-inner">
                        <Table>
                            <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-[10px] uppercase font-bold px-4">Material</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold w-24">Qty</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold w-20">Unit</TableHead>
                                {issueMode === 'Local' && <TableHead className="text-[10px] uppercase font-bold w-24 text-center">Returnable</TableHead>}
                                {issueMode !== 'Indent' && <TableHead className="w-10"></TableHead>}
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id} className="hover:bg-muted/20">
                                <TableCell className="px-4">
                                    <FormField
                                    control={form.control}
                                    name={`materials.${index}.materialName`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <Select onValueChange={(value) => handleMaterialChange(value, index)} value={field.value} disabled={issueMode === 'Indent'}>
                                            <FormControl><SelectTrigger className="h-8 text-xs border-none shadow-none focus:ring-0 px-0 bg-transparent"><SelectValue placeholder="Select Resource" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                            {siteStock.map(stock => (
                                                <SelectItem key={stock.id} value={stock.material}>
                                                {stock.material} ({stock.quantity} {stock.unit} avail)
                                                </SelectItem>
                                            ))}
                                            </SelectContent>
                                        </Select>
                                        </FormItem>
                                    )}
                                    />
                                </TableCell>
                                <TableCell className="py-1">
                                    <FormField
                                    control={form.control}
                                    name={`materials.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem><FormControl><Input type="number" step="any" placeholder="0" {...field} className="h-8 text-xs font-bold" /></FormControl></FormItem>
                                    )}
                                    />
                                </TableCell>
                                <TableCell className="py-1">
                                    <FormField
                                    control={form.control}
                                    name={`materials.${index}.unit`}
                                    render={({ field }) => (
                                        <FormItem><FormControl><Input readOnly disabled {...field} className="h-8 text-xs bg-transparent border-none font-medium opacity-70" /></FormControl></FormItem>
                                    )}
                                    />
                                </TableCell>
                                {issueMode === 'Local' && (
                                    <TableCell className="text-center">
                                        <FormField
                                        control={form.control}
                                        name={`materials.${index}.returnable`}
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-center h-full">
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} scale={0.8} /></FormControl>
                                            </FormItem>
                                        )}
                                        />
                                    </TableCell>
                                )}
                                {issueMode !== 'Indent' && (
                                    <TableCell className="px-2">
                                        <Button variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="h-6 w-6 text-destructive opacity-50 hover:opacity-100">
                                            <Trash className="h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                )}
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full font-black uppercase tracking-widest py-6" disabled={form.formState.isSubmitting || !siteName}>
                        {form.formState.isSubmitting ? 'Verifying Stock & Processing...' : `Generate ${issueMode} Audit Voucher`}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            </div>

            {lastVoucher ? (
            <div className="lg:col-span-2">
                <Card className="border-primary/20 shadow-2xl overflow-hidden sticky top-20">
                <CardHeader className="flex flex-row items-start justify-between bg-primary/5 p-6 border-b">
                    <div>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="text-primary h-5 w-5" /> Official Issue Voucher
                    </CardTitle>
                    <CardDescription className="uppercase tracking-[0.2em] text-[10px] font-black opacity-60">
                        {lastVoucher.issueType} Audit Document
                    </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(lastVoucher.voucherId)} className="h-8 font-bold text-[10px] uppercase">
                        <Download className="mr-1 h-3 w-3" /> Export PDF
                    </Button>
                </CardHeader>
                <CardContent ref={voucherContentRef} className="space-y-6 text-sm p-6 bg-background">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 rounded-xl border p-4 bg-muted/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-5"><FileText className="h-12 w-12"/></div>
                            <div><p className="text-[8px] uppercase font-bold opacity-50">Voucher ID</p><p className="font-black text-xs">{lastVoucher.voucherId}</p></div>
                            <div><p className="text-[8px] uppercase font-bold opacity-50">Issue Timestamp</p><p className="font-bold text-xs">{format(new Date(lastVoucher.issueDate), 'dd MMM yyyy HH:mm')}</p></div>
                            <div><p className="text-[8px] uppercase font-bold opacity-50">Authorized Source</p><p className="font-bold text-xs">{lastVoucher.siteName}</p></div>
                            <div><p className="text-[8px] uppercase font-bold opacity-50">Authorized Receiver</p><p className="font-bold text-xs">{lastVoucher.issuedTo}</p></div>
                            {lastVoucher.issueType === 'Local' ? (
                                <div className="col-span-2"><p className="text-[8px] uppercase font-bold opacity-50">Designated Site Location</p><p className="font-bold text-xs">{lastVoucher.buildingName}</p></div>
                            ) : (
                                <div className="col-span-2"><p className="text-[8px] uppercase font-bold opacity-50">Target Destination</p><p className="font-bold text-xs text-primary">{lastVoucher.receivingSite}</p></div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-black text-[9px] uppercase tracking-widest text-muted-foreground px-1">Resource Fulfillment Ledger</h3>
                            <div className="rounded-xl border shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="h-8 text-[9px] px-4">ResourceIdentifier</TableHead>
                                        <TableHead className="h-8 text-[9px] text-right">Qty</TableHead>
                                        {lastVoucher.issueType === 'Local' && <TableHead className="h-8 text-[9px] text-center">Rtn</TableHead>}
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {lastVoucher.materials.map((item, index) => (
                                        <TableRow key={index} className="h-10 hover:bg-muted/10 transition-colors">
                                        <TableCell className="font-bold text-[11px] px-4">{item.materialName} ({item.unit})</TableCell>
                                        <TableCell className="text-right font-black text-xs text-primary">{item.quantity}</TableCell>
                                        {lastVoucher.issueType === 'Local' && (
                                            <TableCell className="text-center">
                                                {item.returnable ? <Badge className="text-[8px] h-4 bg-amber-500 hover:bg-amber-600">YES</Badge> : <span className="opacity-30">NO</span>}
                                            </TableCell>
                                        )}
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 flex flex-col items-end px-2 space-y-4">
                        <div className="text-right border-t pt-4 w-full">
                            <p className="text-[10px] font-black uppercase tracking-tighter opacity-50 mb-4">Site Manager Authorization</p>
                            <div className="h-12 w-32 border-b-2 border-dashed ml-auto mb-1"></div>
                            <p className="text-[10px] font-bold">{user?.name}</p>
                        </div>
                    </div>
                </CardContent>
                </Card>
            </div>
            ) : (
                <div className="lg:col-span-2 flex items-center justify-center p-12 border-2 border-dashed rounded-3xl bg-secondary/5 h-[600px] text-center opacity-50">
                    <div className="space-y-4">
                        <PackageCheck className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
                        <div className="space-y-1">
                            <p className="font-bold text-lg">Voucher Preview Waiting</p>
                            <p className="text-xs text-muted-foreground max-w-[200px]">Complete the form to generate a unified audit voucher for dispatch.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </Tabs>
    </div>
  );
}
