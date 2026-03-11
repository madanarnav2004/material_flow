'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, PlusCircle, Trash, ClipboardList, Download, ArrowRightLeft, UserCheck, FileText, PackageCheck, AlertTriangle, CheckCircle2, History, Eye } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { useMaterialContext, type SiteIssueVoucher, type SiteIssueItem, type MaterialIssueSlip } from '@/context/material-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/hooks/use-user';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

// --- SCHEMAS ---

const misItemSchema = z.object({
  materialName: z.string().min(1, 'Material is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  unit: z.string().min(1, 'Unit is required.'),
  isReturnable: z.boolean().default(false),
  requestedBy: z.string().min(1, 'Requester name is required.'),
  issuedBy: z.string().min(1, 'Store Keeper name is required.'),
  remarks: z.string().optional(),
});

const shiftItemSchema = z.object({
  materialName: z.string().min(1, 'Material is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  unit: z.string().min(1, 'Unit is required.'),
  rate: z.coerce.number().optional(),
  remarks: z.string().optional(),
});

const issueSchema = z.object({
  issueMode: z.enum(['MIS', 'Indent', 'Shifting']),
  indentId: z.string().optional(),
  siteName: z.string(),
  receivingSite: z.string().optional(),
  issueDate: z.date({ required_error: 'Date is required.' }),
  
  // MIS specific
  materialName: z.string().optional(),
  quantity: z.coerce.number().optional(),
  unit: z.string().optional(),
  isReturnable: z.boolean().optional(),
  requestedBy: z.string().optional(),
  issuedBy: z.string().optional(),
  remarks: z.string().optional(),

  // Shifting specific
  materials: z.array(shiftItemSchema).optional(),
  issuedTo: z.string().optional(), // For shifting/indent
}).refine(data => {
    if (data.issueMode === 'MIS') {
        return !!data.materialName && !!data.quantity && !!data.requestedBy && !!data.issuedBy;
    }
    return true;
}, {
    message: "Required MIS fields missing.",
    path: ["materialName"]
});

type IssueFormValues = z.infer<typeof issueSchema>;

// --- COMPONENT ---

export default function MaterialIssuePage() {
  const { toast } = useToast();
  const { user, site } = useUser();
  const { inventory, setInventory, requests, issueSlips, setIssueSlips, setIssuedMaterials, setSiteIssues } = useMaterialContext();
  const [activeSlip, setActiveSlip] = React.useState<MaterialIssueSlip | null>(null);
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
      issueMode: 'MIS',
      siteName: siteName,
      issueDate: new Date(),
      isReturnable: false,
      issuedBy: user?.name || '',
      materials: [{ materialName: '', quantity: 0, unit: '', remarks: '', rate: 0 }],
    },
  });

  const issueMode = form.watch('issueMode');
  const selectedMaterial = form.watch('materialName');
  const requestedQty = form.watch('quantity') || 0;

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  // Real-time stock validation for MIS
  const availableStock = React.useMemo(() => {
    if (!selectedMaterial) return null;
    return siteStock.find(s => s.material === selectedMaterial);
  }, [selectedMaterial, siteStock]);

  const isStockInsufficient = availableStock ? requestedQty > availableStock.quantity : false;

  React.useEffect(() => {
    if (siteName) form.setValue('siteName', siteName);
    if (user?.name) form.setValue('issuedBy', user.name);
  }, [siteName, user, form]);

  const handleMaterialChange = (materialName: string) => {
    const stock = siteStock.find(s => s.material === materialName);
    if (stock) {
      form.setValue('unit', stock.unit);
    }
  };

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
            remarks: m.remarks || ''
        }));
        replace(mappedMaterials);
        toast({ title: "Indent Details Loaded" });
    }
  };

  function onSubmit(values: IssueFormValues) {
    if (values.issueMode === 'MIS') {
        if (isStockInsufficient) {
            toast({ variant: 'destructive', title: 'Low Stock Alert', description: 'Requested quantity exceeds available inventory.' });
            return;
        }

        const slipNumber = `MIS-${new Date().getFullYear()}-${(issueSlips.length + 1).toString().padStart(3, '0')}`;
        const newSlip: MaterialIssueSlip = {
            slipNumber,
            siteName: values.siteName,
            date: values.issueDate.toISOString(),
            materialName: values.materialName!,
            quantity: Number(values.quantity),
            unit: values.unit!,
            isReturnable: !!values.isReturnable,
            requestedBy: values.requestedBy!,
            issuedBy: values.issuedBy!,
            remarks: values.remarks,
            status: 'Generated',
        };

        setIssueSlips(prev => [newSlip, ...prev]);
        setActiveSlip(newSlip);
        toast({ title: 'Slip Generated', description: `Material Issue Slip ${slipNumber} is ready for signing.` });
        form.reset({ ...values, materialName: '', quantity: 0, remarks: '', requestedBy: '' });
    } else {
        const voucherId = `${values.issueMode === 'Indent' ? 'IND' : 'SHIFT'}-${format(new Date(), 'yyyyMMdd-HHmm')}`;
        const newVoucher: SiteIssueVoucher = {
            voucherId,
            siteName: values.siteName,
            issueDate: values.issueDate.toISOString(),
            issuedTo: values.issuedTo || 'N/A',
            buildingName: 'N/A',
            issueType: values.issueMode === 'Shifting' ? 'Shifting' : 'Local',
            receivingSite: values.receivingSite,
            materials: (values.materials || []).map(m => ({ ...m, returnable: false })),
        };
        
        setSiteIssues(prev => [newVoucher, ...prev]);
        
        setInventory(prev => {
            const next = [...prev];
            values.materials?.forEach(m => {
                const idx = next.findIndex(i => i.site === values.siteName && i.material === m.materialName);
                if (idx > -1) next[idx].quantity -= m.quantity;
            });
            return next;
        });

        toast({ title: 'Dispatch Completed', description: `Voucher ${voucherId} generated.` });
        form.reset({ ...values, materials: [{ materialName: '', quantity: 0, unit: '', remarks: '', rate: 0 }] });
    }
  }

  const handleConfirmIssue = (slip: MaterialIssueSlip) => {
    const stock = inventory.find(i => i.site === slip.siteName && i.material === slip.materialName);
    if (!stock || stock.quantity < slip.quantity) {
        toast({ variant: 'destructive', title: 'Error', description: 'Stock levels changed. Insufficient material to issue.' });
        return;
    }

    setInventory(prev => prev.map(item => {
        if (item.site === slip.siteName && item.material === slip.materialName) {
            return { ...item, quantity: item.quantity - slip.quantity };
        }
        return item;
    }));

    setIssueSlips(prev => prev.map(s => s.slipNumber === slip.slipNumber ? { ...s, status: 'Issued' } : s));
    
    if (activeSlip?.slipNumber === slip.slipNumber) {
        setActiveSlip(prev => prev ? { ...prev, status: 'Issued' } : null);
    }

    toast({ title: 'Material Issued', description: `Inventory updated for slip ${slip.slipNumber}. Record added to register.` });
  };

  const handleDownload = (slipNumber: string) => {
    if (voucherContentRef.current) {
      const content = voucherContentRef.current.innerHTML;
      const blob = new Blob([`<html><head><title>${slipNumber}</title><style>body{font-family:sans-serif;padding:40px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:12px;text-align:left}.header{text-align:center;margin-bottom:30px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.font-bold{font-weight:bold}.mt-40{margin-top:40px}.border-t{border-top:1px solid #000}</style></head><body>${content}</body></html>`], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${slipNumber}.html`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <ClipboardList className="text-primary" /> Material Issue Slip Management
        </h1>
        <Badge variant="outline" className="uppercase text-[10px] tracking-widest font-bold px-3 py-1">Controlled Site Issuance</Badge>
      </div>

      <Tabs defaultValue="MIS" value={issueMode} onValueChange={(val) => form.setValue('issueMode', val as any)}>
        <TabsList className="grid w-full grid-cols-3 max-w-2xl bg-muted/50 p-1">
          <TabsTrigger value="MIS" className="flex items-center gap-2"><FileText className="h-4 w-4" /> Issue Slip (Local)</TabsTrigger>
          <TabsTrigger value="Indent" className="flex items-center gap-2"><PackageCheck className="h-4 w-4" /> Fulfill Indent</TabsTrigger>
          <TabsTrigger value="Shifting" className="flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" /> Inter-Site Transfer</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mt-6">
            <div className="lg:col-span-3 space-y-6">
                <Card className="border-primary/10 shadow-md">
                    <CardHeader className="bg-primary/5 border-b rounded-t-lg">
                        <CardTitle className="text-xl">
                            {issueMode === 'MIS' ? 'Generate New Material Issue Slip' : 
                             issueMode === 'Indent' ? 'Dispatch for Approved Indent' : 'Inter-Site Shifting'}
                        </CardTitle>
                        <CardDescription>
                            {issueMode === 'MIS' ? 'Create a slip for physical approval before stock deduction.' : 
                             issueMode === 'Indent' ? 'Dispatch materials linked to an authorized site indent.' : 
                             'Move stock between project hubs or central store.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <FormField control={form.control} name="siteName" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">Operating Site</FormLabel><FormControl><Input {...field} readOnly disabled className="bg-muted font-bold" /></FormControl></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="issueDate" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">Date</FormLabel><FormControl><Input value={format(field.value, 'PPP')} readOnly disabled className="bg-muted" /></FormControl></FormItem>
                                    )}/>
                                </div>

                                <Separator />

                                {issueMode === 'MIS' ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField control={form.control} name="materialName" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-primary font-bold">Select Material</FormLabel>
                                                    <Select onValueChange={(val) => { field.onChange(val); handleMaterialChange(val); }} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select from site stock" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {siteStock.map(s => <SelectItem key={s.id} value={s.material}>{s.material} ({s.quantity} {s.unit} available)</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                            <FormField control={form.control} name="quantity" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={cn("font-bold", isStockInsufficient ? "text-destructive" : "text-primary")}>Quantity to Issue</FormLabel>
                                                    <FormControl><Input type="number" step="any" placeholder="0.00" {...field} className={cn(isStockInsufficient && "border-destructive focus-visible:ring-destructive")} /></FormControl>
                                                    {isStockInsufficient && <p className="text-[10px] font-bold text-destructive flex items-center gap-1 mt-1"><AlertTriangle className="h-3 w-3"/> Low Stock Alert: Max {availableStock?.quantity} {availableStock?.unit}</p>}
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField control={form.control} name="requestedBy" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs font-bold uppercase">Requested By (Engineer/Supervisor)</FormLabel><FormControl><Input placeholder="Full Name" {...field} /></FormControl><FormMessage /></FormItem>
                                            )}/>
                                            <FormField control={form.control} name="issuedBy" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs font-bold uppercase">Issued By (Store Keeper)</FormLabel><FormControl><Input readOnly disabled {...field} className="bg-muted" /></FormControl></FormItem>
                                            )}/>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/10">
                                            <FormField control={form.control} name="isReturnable" render={({ field }) => (
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                    <FormLabel className="font-bold text-xs uppercase cursor-pointer">Returnable Asset</FormLabel>
                                                </FormItem>
                                            )}/>
                                            <Separator orientation="vertical" className="h-8" />
                                            <p className="text-[10px] text-muted-foreground italic">If enabled, this item will be tracked in the Returnable Material Report.</p>
                                        </div>
                                        <FormField control={form.control} name="remarks" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs font-bold uppercase">Remarks / Task Location</FormLabel><FormControl><Textarea placeholder="e.g., For slab casting, Tower B" {...field} /></FormControl></FormItem>
                                        )}/>
                                    </div>
                                ) : issueMode === 'Shifting' ? (
                                    <div className="space-y-6">
                                        <FormField control={form.control} name="receivingSite" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-primary font-bold">Target Destination</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select target site" /></SelectTrigger></FormControl>
                                                    <SelectContent>{otherSites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Shifting Line Items</Label>
                                            <div className="rounded-xl border overflow-hidden">
                                                <Table>
                                                    <TableHeader className="bg-muted/50"><TableRow><TableHead className="text-[9px]">Material</TableHead><TableHead className="text-[9px] w-24">Qty</TableHead><TableHead className="w-8"></TableHead></TableRow></TableHeader>
                                                    <TableBody>
                                                        {fields.map((field, idx) => (
                                                            <TableRow key={field.id}>
                                                                <TableCell>
                                                                    <Select onValueChange={(val) => form.setValue(`materials.${idx}.materialName`, val)} value={form.watch(`materials.${idx}.materialName`)}>
                                                                        <SelectTrigger className="h-8 text-xs border-none"><SelectValue placeholder="Item" /></SelectTrigger>
                                                                        <SelectContent>{siteStock.map(s => <SelectItem key={s.id} value={s.material}>{s.material}</SelectItem>)}</SelectContent>
                                                                    </Select>
                                                                </TableCell>
                                                                <TableCell><Input type="number" step="any" {...form.register(`materials.${idx}.quantity`)} className="h-8 text-xs font-bold" /></TableCell>
                                                                <TableCell><Button variant="ghost" size="icon" onClick={() => remove(idx)} className="h-6 w-6 text-destructive"><Trash className="h-3 w-3" /></Button></TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => append({ materialName: '', quantity: 0, unit: '', rate: 0 })} className="h-7 text-[10px] font-bold">Add Item</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <FormField control={form.control} name="indentId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-primary font-bold">Approved Indent ID</FormLabel>
                                                <Select onValueChange={handleIndentChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select indent to fulfill" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {requests.filter(r => r.status === 'Director Approved').map(r => <SelectItem key={r.id} value={r.id}>{r.id}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <FormField control={form.control} name="issuedTo" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs font-bold uppercase">Authorized Receiver</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )}/>
                                    </div>
                                )}

                                <Button type="submit" size="lg" className="w-full font-black uppercase tracking-widest py-6" disabled={form.formState.isSubmitting || isStockInsufficient}>
                                    {issueMode === 'MIS' ? 'Generate Slip for Signing' : 'Execute Dispatch'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Pending Physical Confirmations</CardTitle>
                        <CardDescription className="text-xs">Generated slips awaiting physical signature and Store Keeper confirmation.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {issueSlips.filter(s => s.status === 'Generated' && s.siteName === siteName).length > 0 ? (
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="text-[10px] h-8">Slip #</TableHead>
                                        <TableHead className="text-[10px] h-8">Material</TableHead>
                                        <TableHead className="text-[10px] h-8">Qty</TableHead>
                                        <TableHead className="text-right text-[10px] h-8 pr-4">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {issueSlips.filter(s => s.status === 'Generated' && s.siteName === siteName).map(slip => (
                                        <TableRow key={slip.slipNumber}>
                                            <TableCell className="font-bold text-xs">{slip.slipNumber}</TableCell>
                                            <TableCell className="text-xs">{slip.materialName}</TableCell>
                                            <TableCell className="text-xs font-black">{slip.quantity} {slip.unit}</TableCell>
                                            <TableCell className="text-right pr-2 space-x-1">
                                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setActiveSlip(slip)}><Eye className="h-3 w-3" /></Button>
                                                <Button variant="outline" size="sm" className="h-7 px-2 text-[10px] font-bold" onClick={() => handleConfirmIssue(slip)}>Confirm Issue</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="p-12 text-center text-muted-foreground text-xs italic">No pending confirmations for this site.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                {activeSlip ? (
                    <Card className="border-primary/20 shadow-2xl overflow-hidden sticky top-20">
                        <CardHeader className="flex flex-row items-start justify-between bg-primary/5 p-6 border-b">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-primary"><FileText className="h-5 w-5" /> Material Issue Slip</CardTitle>
                                <CardDescription className="uppercase tracking-[0.2em] text-[10px] font-black opacity-60">Audit Document</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 font-bold text-[10px] uppercase" onClick={() => handleDownload(activeSlip.slipNumber)}>
                                <Download className="mr-1 h-3 w-3" /> EXPORT PDF
                            </Button>
                        </CardHeader>
                        <CardContent ref={voucherContentRef} className="space-y-8 p-8 bg-background text-sm">
                            <div className="header space-y-1">
                                <h2 className="text-2xl font-black font-headline text-primary tracking-tighter uppercase">MaterialFlow Projects</h2>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Material Issue Certificate</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 p-6 border-2 border-primary/10 rounded-2xl bg-primary/5 relative">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><FileText className="h-12 w-12"/></div>
                                <div><p className="text-[8px] uppercase font-black opacity-50">Slip Identification</p><p className="font-black text-sm text-primary">{activeSlip.slipNumber}</p></div>
                                <div><p className="text-[8px] uppercase font-black opacity-50">Authorized Date</p><p className="font-bold text-xs">{format(new Date(activeSlip.date), 'dd MMM yyyy')}</p></div>
                                <div><p className="text-[8px] uppercase font-black opacity-50">Managed Site</p><p className="font-bold text-xs">{activeSlip.siteName}</p></div>
                                <div><p className="text-[8px] uppercase font-black opacity-50">Issuance Status</p><Badge variant={activeSlip.status === 'Issued' ? 'default' : 'secondary'} className="text-[9px] h-4 uppercase">{activeSlip.status}</Badge></div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-black text-[9px] uppercase tracking-widest text-muted-foreground border-b pb-2">Material Allocation Ledger</h3>
                                <Table>
                                    <TableHeader className="bg-muted/50"><TableRow><TableHead className="h-8 text-[9px] px-4">Resource Description</TableHead><TableHead className="h-8 text-[9px] text-right">Quantity</TableHead><TableHead className="h-8 text-[9px] text-center">AssetType</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        <TableRow className="h-12">
                                            <TableCell className="font-bold text-xs px-4">{activeSlip.materialName}</TableCell>
                                            <TableCell className="text-right font-black text-sm text-primary">{activeSlip.quantity} {activeSlip.unit}</TableCell>
                                            <TableCell className="text-center">
                                                {activeSlip.isReturnable ? <Badge className="text-[8px] bg-amber-500">RETURNABLE</Badge> : <span className="text-[10px] opacity-40">CONS.</span>}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                                {activeSlip.remarks && (
                                    <div className="p-4 bg-muted/20 border rounded-xl italic text-xs text-muted-foreground">" {activeSlip.remarks} "</div>
                                )}
                            </div>

                            <div className="mt-40 grid grid-cols-2 gap-12">
                                <div className="text-center space-y-12">
                                    <div className="border-t pt-2"><p className="text-[9px] font-black uppercase tracking-tighter">{activeSlip.requestedBy}</p><p className="text-[8px] opacity-50">Authorized Requester</p></div>
                                </div>
                                <div className="text-center space-y-12">
                                    <div className="border-t pt-2"><p className="text-[9px] font-black uppercase tracking-tighter">{activeSlip.issuedBy}</p><p className="text-[8px] opacity-50">Store Keeper (Issuer)</p></div>
                                </div>
                                <div className="col-span-2 text-center pt-8">
                                    <div className="w-1/2 mx-auto border-t-2 border-primary/20 pt-2"><p className="text-[10px] font-black uppercase tracking-widest text-primary">SITE INCHARGE SIGNATURE</p></div>
                                </div>
                            </div>
                        </CardContent>
                        {activeSlip.status === 'Generated' && (
                            <CardContent className="bg-muted/30 border-t p-6 flex flex-col gap-3">
                                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg text-primary text-xs font-medium">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <p>Physical Signature Required: Print this slip and receive Site Incharge authorization before clicking "Confirm Physical Issue".</p>
                                </div>
                                <Button size="lg" className="w-full font-black uppercase tracking-widest" onClick={() => handleConfirmIssue(activeSlip)}>
                                    <CheckCircle2 className="mr-2 h-5 w-5" /> Confirm Physical Issue
                                </Button>
                            </CardContent>
                        )}
                    </Card>
                ) : (
                    <div className="lg:col-span-2 flex items-center justify-center p-12 border-2 border-dashed rounded-3xl bg-secondary/5 h-[600px] text-center opacity-50">
                        <div className="space-y-4">
                            <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
                            <div className="space-y-1">
                                <p className="font-bold text-lg">MIS Preview Waiting</p>
                                <p className="text-xs text-muted-foreground max-w-[200px]">Generate or select a slip to view the official audit document.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </Tabs>
    </div>
  );
}
