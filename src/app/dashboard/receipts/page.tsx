
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PackageCheck, FileText, Download, Eye, AlertTriangle, CheckCircle, HelpCircle, ChevronDown, CalendarIcon, FileDiff, Upload, PlusCircle, Trash } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useMaterialContext } from '@/context/material-context';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';


// Schema for receiving from another site
const fromSiteSchema = z.object({
  issuedId: z.string().min(1, 'An Issued Material ID must be selected.'),
  receiverName: z.string().min(2, "Receiver name is required."),
  requestId: z.string(),
  issuingSite: z.string(),
  receivingSite: z.string(),
  materialName: z.string(),
  issuedQuantity: z.coerce.number(),
  receivedQuantity: z.coerce.number().min(0.1, 'Received quantity must be > 0.'),
  isDamaged: z.boolean().default(false),
  damageDescription: z.string().optional(),
  remarks: z.string().optional(),
  receivedDate: z.date({ required_error: 'Received date is required.' }),
});

type FromSiteFormValues = z.infer<typeof fromSiteSchema>;

// Schema for direct shop purchase
const shopMaterialItemSchema = z.object({
  materialName: z.string().min(1, 'Material name is required.'),
  unit: z.string().min(1, 'Unit is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  rate: z.coerce.number().min(0.01, 'Rate must be > 0.01'),
});

const fromShopSchema = z.object({
  purchaseType: z.enum(['with-po', 'without-po'], { required_error: 'Purchase type is required.' }),
  poNumber: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
  vendorName: z.string().min(1, 'Vendor name is required.'),
  invoiceDate: z.date({ required_error: 'Invoice date is required.' }),
  materials: z.array(shopMaterialItemSchema).min(1, 'Please add at least one material.'),
  invoiceFile: z.any().optional(),
}).refine(data => data.purchaseType !== 'with-po' || (data.poNumber && data.poNumber.length > 0), {
    message: 'PO Number is required for purchases with a PO.',
    path: ['poNumber'],
});


type FromShopFormValues = z.infer<typeof fromShopSchema>;
type ShopPurchase = FromShopFormValues & { totalAmount: number; receivedBillId: string };


type ReceiptStatus = 'Accepted' | 'Mismatch' | 'Completed';

type MaterialReceivedBill = FromSiteFormValues & {
  receivedBillId: string;
  receiver: { name: string; } | null;
  status: ReceiptStatus;
};

type FullBillDetails = {
    request: {
        id: string;
        material: string;
        quantity: number;
        site: string;
        returnDate: string;
    } | null;
    issue: {
        issuedId: string;
        materialName: string;
        issuedQuantity: number;
        issuingSite: string;
    } | null;
    receipt: MaterialReceivedBill | null;
}

const initialPastReceipts: MaterialReceivedBill[] = [];

export default function ReceiptsPage() {
  const { toast } = useToast();
  const { issuedMaterials, requests } = useMaterialContext();
  const [pastReceipts, setPastReceipts] = React.useState<MaterialReceivedBill[]>(initialPastReceipts);
  const [activeBillDetails, setActiveBillDetails] = React.useState<FullBillDetails | null>(null);
  const billContentRef = React.useRef<HTMLDivElement>(null);

  const [shopPurchases, setShopPurchases] = React.useState<ShopPurchase[]>([]);
  
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);
  const [selectedReceiptForUpdate, setSelectedReceiptForUpdate] = React.useState<{ receipt: MaterialReceivedBill, newStatus: ReceiptStatus } | null>(null);
  const [updateRemarks, setUpdateRemarks] = React.useState('');


  // Form for site-to-site transfers
  const fromSiteForm = useForm<FromSiteFormValues>({
    resolver: zodResolver(fromSiteSchema),
    defaultValues: {
      issuedId: '',
      receiverName: '',
      receivedQuantity: 0,
      isDamaged: false,
      damageDescription: '',
      remarks: '',
      receivedDate: new Date(),
      requestId: '',
      issuingSite: '',
      receivingSite: '',
      materialName: '',
      issuedQuantity: 0,
    },
  });

  const handleIssuedIdChange = (issuedId: string) => {
    fromSiteForm.setValue('issuedId', issuedId);
    const issuedItem = issuedMaterials.find(item => item.issuedId === issuedId);
    
    if (issuedItem) {
        fromSiteForm.setValue('requestId', issuedItem.requestId);
        fromSiteForm.setValue('materialName', issuedItem.materialName);
        fromSiteForm.setValue('issuedQuantity', issuedItem.issuedQuantity);
        fromSiteForm.setValue('issuingSite', issuedItem.issuingSite);
        fromSiteForm.setValue('receivingSite', issuedItem.receivingSite);
        fromSiteForm.setValue('receivedQuantity', issuedItem.issuedQuantity);
        toast({
            title: 'Auto-filled!',
            description: 'Material details have been auto-filled from the Issued ID.',
        });
    } else {
        fromSiteForm.setValue('requestId', '');
        fromSiteForm.setValue('materialName', '');
        fromSiteForm.setValue('issuedQuantity', 0);
        fromSiteForm.setValue('issuingSite', '');
        fromSiteForm.setValue('receivingSite', '');
    }
  };

  function onFromSiteSubmit(values: FromSiteFormValues) {
    const today = new Date();
    const datePart = format(today, 'yyyyMMdd');
    const countPart = (Date.now() % 1000).toString().padStart(3, '0');
    const newBillId = `REC-${datePart}-${countPart}`;
    
    const status: ReceiptStatus = values.issuedQuantity === values.receivedQuantity ? 'Accepted' : 'Mismatch';

    const bill: MaterialReceivedBill = {
      ...values,
      receivedBillId: newBillId,
      receiver: { name: values.receiverName },
      status: status,
    };
    
    setPastReceipts(prev => [bill, ...prev]);

    const requestDetails = requests.find(r => r.id === bill.requestId) || null;
    const issueDetails = issuedMaterials.find(i => i.issuedId === bill.issuedId) || null;
    setActiveBillDetails({ request: requestDetails, issue: issueDetails, receipt: bill });


    let toastDescription = `GRN for ${values.receivedQuantity} units of ${values.materialName} logged.`;
    if (status === 'Mismatch') {
      toastDescription += ' Quantity mismatch detected.';
    }
    toast({
      title: 'GRN Logged!',
      description: toastDescription,
      variant: status === 'Mismatch' ? 'destructive' : 'default',
    });
  }

  const handleViewBill = (receiptId: string) => {
    const receipt = pastReceipts.find(r => r.receivedBillId === receiptId);
    if (receipt) {
      const requestDetails = requests.find(r => r.id === receipt.requestId) || null;
      const issueDetails = issuedMaterials.find(i => i.issuedId === receipt.issuedId) || null;
      setActiveBillDetails({ request: requestDetails, issue: issueDetails, receipt: receipt });
    }
  };

  const handleStatusUpdateClick = (receipt: MaterialReceivedBill, newStatus: ReceiptStatus) => {
    setSelectedReceiptForUpdate({ receipt, newStatus });
    setUpdateRemarks(receipt.remarks || '');
    setIsUpdateDialogOpen(true);
  };
  
  const handleConfirmStatusUpdate = () => {
      if (!selectedReceiptForUpdate) return;
      const { receipt, newStatus } = selectedReceiptForUpdate;
  
      setPastReceipts(receipts =>
          receipts.map(r =>
              r.receivedBillId === receipt.receivedBillId
                  ? { ...r, status: newStatus, remarks: updateRemarks }
                  : r
          )
      );
      
      if (activeBillDetails?.receipt?.receivedBillId === receipt.receivedBillId) {
          setActiveBillDetails(prev =>
              prev
                  ? {
                        ...prev,
                        receipt: prev.receipt
                            ? { ...prev.receipt, status: newStatus, remarks: updateRemarks }
                            : null,
                    }
                  : null
          );
      }
  
      toast({
        title: 'Status Updated',
        description: `GRN ${receipt.receivedBillId} has been marked as ${newStatus}.`,
      });
  
      setIsUpdateDialogOpen(false);
      setSelectedReceiptForUpdate(null);
      setUpdateRemarks('');
  };

  
  const handleDownload = (billId: string) => {
    if (billContentRef.current) {
      const billHtml = billContentRef.current.innerHTML;
      const blob = new Blob([`<html><head><title>${billId}</title></head><body>${billHtml}</body></html>`], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${billId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Download Started",
        description: `Bill ${billId} is downloading.`,
      });
    }
  };

  const isDamaged = fromSiteForm.watch('isDamaged');

  // Form for shop purchases
  const fromShopForm = useForm<FromShopFormValues>({
    resolver: zodResolver(fromShopSchema),
    defaultValues: {
      purchaseType: 'without-po',
      poNumber: '',
      invoiceNumber: '',
      vendorName: '',
      invoiceDate: new Date(),
      materials: [{ materialName: '', unit: '', quantity: 0, rate: 0 }],
    },
  });

  const { fields: shopFields, append: appendShopMaterial, remove: removeShopMaterial } = useFieldArray({
    control: fromShopForm.control,
    name: 'materials',
  });

  const purchaseType = fromShopForm.watch('purchaseType');

  function onFromShopSubmit(values: FromShopFormValues) {
    const totalAmount = values.materials.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const newBillId = `SHOP-REC-${format(new Date(), 'yyyyMMdd-HHmmss')}`;

    const purchase: ShopPurchase = {
      ...values,
      totalAmount,
      receivedBillId: newBillId,
    };

    setShopPurchases(prev => [purchase, ...prev]);
    toast({
      title: 'Shop Purchase Logged!',
      description: `Invoice ${values.invoiceNumber} has been successfully logged.`,
    });
    fromShopForm.reset({
        purchaseType: 'without-po',
        poNumber: '',
        invoiceNumber: '',
        vendorName: '',
        invoiceDate: new Date(),
        materials: [{ materialName: '', unit: '', quantity: 0, rate: 0 }],
    });
    setActiveBillDetails(null); // Clear detailed 3-way view
  }


  return (
    <TooltipProvider>
      <h1 className="text-3xl font-bold font-headline">Goods Received Note (GRN)</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Tabs defaultValue="from-site" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="from-site">GRN (other site / store)</TabsTrigger>
              <TabsTrigger value="from-shop">New Purchase Material</TabsTrigger>
            </TabsList>
            
            <TabsContent value="from-site">
              <Card>
                <CardHeader>
                  <CardTitle>Log GRN from Other Site / Store</CardTitle>
                  <CardDescription>Select an Issued Material ID to log the received goods.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...fromSiteForm}>
                    <form onSubmit={fromSiteForm.handleSubmit(onFromSiteSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField control={fromSiteForm.control} name="issuedId" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Issued ID</FormLabel>
                              <Select onValueChange={(value) => handleIssuedIdChange(value)} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select an Issued ID" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {issuedMaterials.map(item => (<SelectItem key={item.issuedId} value={item.issuedId}>{item.issuedId} ({item.materialName})</SelectItem>))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={fromSiteForm.control} name="requestId" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Indent ID</FormLabel>
                              <FormControl><Input {...field} readOnly value={field.value ?? ''} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField control={fromSiteForm.control} name="materialName" render={({ field }) => (
                            <FormItem><FormLabel>Material Name</FormLabel><FormControl><Input placeholder="e.g., Cement" {...field} readOnly value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormField control={fromSiteForm.control} name="issuedQuantity" render={({ field }) => (
                            <FormItem><FormLabel>Issued Quantity</FormLabel><FormControl><Input type="number" placeholder="e.g., 50" {...field} readOnly value={field.value ?? 0} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                      </div>
                      <FormField control={fromSiteForm.control} name="receiverName" render={({ field }) => (
                          <FormItem><FormLabel>Receiver Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                      <div className="rounded-md border p-4 bg-secondary/20 space-y-4">
                        <FormField control={fromSiteForm.control} name="receivedQuantity" render={({ field }) => (
                            <FormItem><FormLabel className="text-base">Enter Received Quantity</FormLabel><FormControl><Input type="number" placeholder="e.g., 50" {...field} className="bg-background text-lg"/></FormControl><FormMessage /></FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-4">
                        <FormField control={fromSiteForm.control} name="isDamaged" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Select onValueChange={(value) => field.onChange(value === 'true')} defaultValue={String(field.value)}>
                                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Damage Status" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="false">No Damage</SelectItem>
                                    <SelectItem value="true">Damage Reported</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormLabel className="font-normal flex items-center gap-1">Was the material damaged?</FormLabel>
                            </FormItem>
                          )}
                        />
                        {isDamaged && <FormField control={fromSiteForm.control} name="damageDescription" render={({ field }) => (<FormItem><FormLabel>Damage Description</FormLabel><FormControl><Textarea placeholder="Describe the damage..." {...field} /></FormControl><FormMessage /></FormItem>)} />}
                      </div>
                      <FormField control={fromSiteForm.control} name="remarks" render={({ field }) => (<FormItem><FormLabel>Remarks (Optional)</FormLabel><FormControl><Textarea placeholder="Add any additional remarks..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={fromSiteForm.control} name="receivedDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Received Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="ml-auto h-4 w-4 opacity-50" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                      <Button type="submit" size="lg" disabled={fromSiteForm.formState.isSubmitting}><PackageCheck className="mr-2 h-4 w-4" />{fromSiteForm.formState.isSubmitting ? 'Logging...' : 'Log GRN & Generate Bill'}</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="from-shop">
              <Card>
                <CardHeader>
                  <CardTitle>Log New Purchase Material</CardTitle>
                  <CardDescription>Enter invoice details for materials purchased with or without a Purchase Order.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...fromShopForm}>
                    <form onSubmit={fromShopForm.handleSubmit(onFromShopSubmit)} className="space-y-6">
                       <FormField
                        control={fromShopForm.control}
                        name="purchaseType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purchase Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select purchase type (With PO / Without PO)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="with-po">With PO</SelectItem>
                                <SelectItem value="without-po">Without PO</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {purchaseType === 'with-po' && (
                        <FormField
                            control={fromShopForm.control}
                            name="poNumber"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Purchase Order Number</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter PO Number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={fromShopForm.control} name="invoiceNumber" render={({ field }) => (<FormItem><FormLabel>Invoice Number</FormLabel><FormControl><Input placeholder="e.g., INV-2024-001" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={fromShopForm.control} name="vendorName" render={({ field }) => (<FormItem><FormLabel>Vendor Name</FormLabel><FormControl><Input placeholder="e.g., Acme Suppliers" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      </div>
                      <FormField control={fromShopForm.control} name="invoiceDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Invoice Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="ml-auto h-4 w-4 opacity-50" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                      
                      <div>
                        <Label>Purchased Materials</Label>
                        <div className="mt-2 rounded-md border">
                          <Table>
                            <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Unit</TableHead><TableHead>Qty</TableHead><TableHead>Rate</TableHead><TableHead /></TableRow></TableHeader>
                            <TableBody>
                              {shopFields.map((field, index) => (
                                <TableRow key={field.id}>
                                  <TableCell><FormField control={fromShopForm.control} name={`materials.${index}.materialName`} render={({ field }) => (<FormItem><FormControl><Input placeholder="Cement" {...field}/></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                  <TableCell><FormField control={fromShopForm.control} name={`materials.${index}.unit`} render={({ field }) => (<FormItem><FormControl><Input placeholder="bag" {...field}/></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                  <TableCell><FormField control={fromShopForm.control} name={`materials.${index}.quantity`} render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="50" {...field}/></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                  <TableCell><FormField control={fromShopForm.control} name={`materials.${index}.rate`} render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="10" {...field}/></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                  <TableCell><Button variant="ghost" size="icon" onClick={() => removeShopMaterial(index)} disabled={shopFields.length <= 1}><Trash className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendShopMaterial({ materialName: '', unit: '', quantity: 0, rate: 0 })} className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Add Material</Button>
                      </div>

                      <FormField control={fromShopForm.control} name="invoiceFile" render={({ field }) => (<FormItem><FormLabel>Upload Invoice Copy</FormLabel><FormControl><Input type="file" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>)}/>
                      <Button type="submit" size="lg" disabled={fromShopForm.formState.isSubmitting}><Upload className="mr-2 h-4 w-4" />{fromShopForm.formState.isSubmitting ? 'Logging...' : 'Log Shop Purchase'}</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        {activeBillDetails && (
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2"><FileDiff /> Bill Checking Process</CardTitle>
                          <CardDescription>Comparing Indent, Issued, and GRN bills.</CardDescription>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => handleDownload(activeBillDetails.receipt?.receivedBillId ?? 'bill')}><Download className="mr-2 h-4 w-4" />Download</Button>
                    </CardHeader>
                    <CardContent ref={billContentRef} className="space-y-6 text-sm">
                        <div className="rounded-lg border p-4 space-y-2">
                            <h3 className="font-semibold text-base">Verification Status</h3>
                            {activeBillDetails.receipt?.status === 'Mismatch' ? ( <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /><p className="font-semibold">Query: Mismatch in quantities.</p></div>) 
                            : activeBillDetails.receipt?.status === 'Completed' ? (<div className="flex items-center gap-2 text-green-600"><CheckCircle className="h-5 w-5" /><p className="font-semibold">Process Completed: All bills match.</p></div>) 
                            : (<div className="flex items-center gap-2 text-blue-600"><HelpCircle className="h-5 w-5" /><p className="font-semibold">Process Pending: Verification required.</p></div>)}
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-base text-muted-foreground">1. Material Indent Bill</h3>
                            <div className="rounded-lg border p-4 space-y-2"><p><strong>Indent ID:</strong> {activeBillDetails.request?.id}</p><p><strong>Requesting Site:</strong> {activeBillDetails.request?.site}</p><Separator /><div className="flex justify-between items-center"><span>{activeBillDetails.request?.material}</span><span className="font-bold text-lg">{activeBillDetails.request?.quantity} units</span></div></div>
                        </div>
                        <div className="space-y-2">
                             <h3 className="font-semibold text-base text-muted-foreground">2. Material Issued Bill</h3>
                            <div className="rounded-lg border p-4 space-y-2"><p><strong>Issued ID:</strong> {activeBillDetails.issue?.issuedId}</p><p><strong>Issuing Site:</strong> {activeBillDetails.issue?.issuingSite}</p><Separator /><div className="flex justify-between items-center"><span>{activeBillDetails.issue?.materialName}</span><span className="font-bold text-lg">{activeBillDetails.issue?.issuedQuantity} units</span></div></div>
                        </div>
                         <div className="space-y-2">
                             <h3 className="font-semibold text-base text-muted-foreground">3. Final Goods Received Note (GRN)</h3>
                            <div className="rounded-lg border p-4 space-y-2 bg-secondary/30"><p><strong>GRN ID:</strong> {activeBillDetails.receipt?.receivedBillId}</p><p><strong>Receiver:</strong> {activeBillDetails.receipt?.receiver?.name}</p><Separator /><div className="flex justify-between items-center"><span>{activeBillDetails.receipt?.materialName}</span><span className={cn("font-bold text-xl", activeBillDetails.receipt?.status === 'Mismatch' && 'text-destructive')}>{activeBillDetails.receipt?.receivedQuantity} units</span></div>{activeBillDetails.receipt?.remarks && <p className="text-xs text-muted-foreground pt-2"><strong>Remarks:</strong> {activeBillDetails.receipt.remarks}</p>}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
              <CardTitle>Past Site-to-Site GRNs</CardTitle>
              <CardDescription>A log of recently verified GRNs from other sites.</CardDescription>
          </CardHeader>
          <CardContent>
              {pastReceipts.length > 0 ? (
                  <Table>
                      <TableHeader><TableRow><TableHead>GRN ID</TableHead><TableHead>Indent ID</TableHead><TableHead>Material</TableHead><TableHead>Qty</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {pastReceipts.map(rec => (
                              <TableRow key={rec.receivedBillId}>
                                  <TableCell className="font-medium">{rec.receivedBillId}</TableCell>
                                  <TableCell>{rec.requestId}</TableCell>
                                  <TableCell>{rec.materialName}</TableCell>
                                  <TableCell>{rec.receivedQuantity}</TableCell>
                                  <TableCell><Badge variant={rec.status === 'Accepted' ? 'default' : rec.status === 'Completed' ? 'outline' : 'destructive'} className={cn(rec.status === 'Accepted' && 'bg-green-600/80', rec.status === 'Completed' && 'border-green-600 text-green-600')}>{rec.status}</Badge></TableCell>
                                  <TableCell className="text-right space-x-2">
                                      <Button variant="outline" size="sm" onClick={() => handleViewBill(rec.receivedBillId)}><Eye className="mr-2 h-4 w-4" />Check</Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Update <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleStatusUpdateClick(rec, 'Accepted')}>Accepted</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusUpdateClick(rec, 'Mismatch')}>Mismatch</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusUpdateClick(rec, 'Completed')}>Completed</DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              ) : (<div className="flex items-center justify-center p-8"><p className="text-center text-muted-foreground">No site GRNs logged yet.</p></div>)}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Shop Purchases</CardTitle>
            <CardDescription>A log of materials purchased directly from shops.</CardDescription>
          </CardHeader>
          <CardContent>
            {shopPurchases.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>PO #</TableHead><TableHead>Vendor</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {shopPurchases.map((purchase) => (
                    <TableRow key={purchase.receivedBillId}>
                      <TableCell className="font-medium">{purchase.invoiceNumber}</TableCell>
                      <TableCell>{purchase.poNumber || 'N/A'}</TableCell>
                      <TableCell>{purchase.vendorName}</TableCell>
                      <TableCell>{purchase.purchaseType === 'with-po' ? 'With PO' : 'Without PO'}</TableCell>
                      <TableCell>{format(purchase.invoiceDate, 'PPP')}</TableCell>
                      <TableCell className="text-right">${purchase.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (<div className="flex items-center justify-center p-8"><p className="text-center text-muted-foreground">No shop purchases logged yet.</p></div>)}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update GRN Status: {selectedReceiptForUpdate?.receipt.receivedBillId}</DialogTitle>
            <DialogDescription>
              You are changing the status to <Badge variant={selectedReceiptForUpdate?.newStatus === 'Mismatch' ? 'destructive' : 'default'}>{selectedReceiptForUpdate?.newStatus}</Badge>. Add or update remarks below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
              <Label htmlFor="update-remarks">Remarks</Label>
              <Textarea
                  id="update-remarks"
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                  placeholder="Add remarks about this status change..."
              />
          </div>
          <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmStatusUpdate}>Confirm Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </TooltipProvider>
  );
}

    