'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PackageCheck, FileText, Download, Eye, AlertTriangle, CheckCircle, ChevronDown, CalendarIcon, FileDiff, Upload, PlusCircle, Trash, Truck, CreditCard } from 'lucide-react';
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
import { useMaterialContext, InventoryItem, MaterialReceivedBill, ReceiptStatus, MaterialIndent, IssuedMaterial } from '@/context/material-context';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';


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
  eWayBillNumber: z.string().optional(),
  vehicleNumber: z.string().optional(),
});

type FromSiteFormValues = z.infer<typeof fromSiteSchema>;

const shopMaterialItemSchema = z.object({
  materialName: z.string().min(1, 'Material name is required.'),
  classification: z.enum(['Asset', 'Consumable'], { required_error: 'Classification is required.' }),
  ownership: z.enum(['Own', 'Rent']).optional(),
  vendorName: z.string().optional(),
  unit: z.string().min(1, 'Unit is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  rate: z.coerce.number().min(0.01, 'Rate must be > 0.01'),
}).refine(data => data.classification !== 'Asset' || !!data.ownership, {
    message: 'Ownership is required for assets.',
    path: ['ownership'],
}).refine(data => !(data.classification === 'Asset' && data.ownership === 'Rent') || (data.vendorName && data.vendorName.length > 0), {
    message: 'Vendor name is required for rented assets.',
    path: ['vendorName'],
});

const fromShopSchema = z.object({
  purchaseType: z.enum(['with-po', 'without-po'], { required_error: 'Purchase type is required.' }),
  poNumber: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
  vendorName: z.string().min(1, 'Vendor name is required.'),
  invoiceDate: z.date({ required_error: 'Invoice date is required.' }),
  gstin: z.string().optional(),
  eWayBillNumber: z.string().optional(),
  vehicleNumber: z.string().optional(),
  materials: z.array(shopMaterialItemSchema).min(1, 'Please add at least one material.'),
  invoiceFile: (typeof window !== 'undefined' ? z.instanceof(File) : z.any())
    .refine(file => file, 'Invoice attachment is mandatory for shop purchases.'),
}).refine(data => data.purchaseType !== 'with-po' || (data.poNumber && data.poNumber.length > 0), {
    message: 'PO Number is required for purchases with a PO.',
    path: ['poNumber'],
});


type FromShopFormValues = z.infer<typeof fromShopSchema>;
type ShopPurchase = FromShopFormValues & { totalAmount: number; receivedBillId: string };


type FullBillDetails = {
    request: MaterialIndent | null;
    issue: IssuedMaterial | null;
    receipt: MaterialReceivedBill | null;
}


export default function ReceiptsPage() {
  const { toast } = useToast();
  const { issuedMaterials, requests, setRequests, inventory, setInventory, receipts: pastReceipts, setReceipts: setPastReceipts } = useMaterialContext();
  const searchParams = useSearchParams();
  const billContentRef = React.useRef<HTMLDivElement>(null);
  
  const [activeBillDetails, setActiveBillDetails] = React.useState<FullBillDetails | null>(null);
  const [activeShopPurchaseBill, setActiveShopPurchaseBill] = React.useState<ShopPurchase | null>(null);

  const [shopPurchases, setShopPurchases] = React.useState<ShopPurchase[]>([]);
  
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);
  const [selectedReceiptForUpdate, setSelectedReceiptForUpdate] = React.useState<{ receipt: MaterialReceivedBill, newStatus: ReceiptStatus } | null>(null);
  const [updateRemarks, setUpdateRemarks] = React.useState('');

  const [isShopPreviewDialogOpen, setIsShopPreviewDialogOpen] = React.useState(false);


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
      eWayBillNumber: '',
      vehicleNumber: '',
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
        fromSiteForm.setValue('vehicleNumber', issuedItem.vehicleNumber || '');
        toast({
            title: 'Audit Mapping Active',
            description: 'Source indent and transport details identified.',
        });
    } else {
        fromSiteForm.reset();
    }
  };

  React.useEffect(() => {
    const issuedIdFromQuery = searchParams.get('issuedId');
    if (issuedIdFromQuery) {
        handleIssuedIdChange(issuedIdFromQuery);
    }
  }, [searchParams]);

  const availableIssuedMaterials = React.useMemo(() => {
      const receivedIds = new Set(pastReceipts.map(r => r.issuedId));
      return issuedMaterials.filter(im => !receivedIds.has(im.issuedId));
  }, [issuedMaterials, pastReceipts]);


  function onFromSiteSubmit(values: FromSiteFormValues) {
    const today = new Date();
    const datePart = format(today, 'yyyyMMdd');
    const countPart = (Date.now() % 1000).toString().padStart(3, '0');
    const newBillId = `REC-${datePart}-${countPart}`;
    
    const status: ReceiptStatus = Number(values.issuedQuantity) === Number(values.receivedQuantity) ? 'Accepted' : 'Mismatch';

    const bill: MaterialReceivedBill = {
      ...values,
      receivedBillId: newBillId,
      receiver: { name: values.receiverName },
      status: status,
      receivedDate: values.receivedDate.toISOString(),
    };
    
    setPastReceipts(prev => [bill, ...prev]);

    setInventory(prevInventory => {
      let newInventory = [...prevInventory];
      const receivingItemIndex = newInventory.findIndex(item => item.site === values.receivingSite && item.material.toLowerCase() === values.materialName.toLowerCase());
      
      if(receivingItemIndex > -1) {
        newInventory[receivingItemIndex].quantity += Number(values.receivedQuantity);
      } else {
         const issuingItem = prevInventory.find(item => item.site === values.issuingSite && item.material.toLowerCase() === values.materialName.toLowerCase());
         if(issuingItem) {
           const newItem: InventoryItem = {
             id: `inv-${Date.now()}`,
             site: values.receivingSite,
             material: values.materialName,
             classification: issuingItem.classification,
             ownership: issuingItem.ownership,
             vendorName: issuingItem.vendorName,
             quantity: Number(values.receivedQuantity),
             unit: issuingItem.unit,
             minQty: 10,
             maxQty: 100,
           };
           newInventory.push(newItem);
         }
      }
      return newInventory;
    });

    if (status === 'Accepted') {
        setRequests(prev => prev.map(req => req.id === values.requestId ? { ...req, status: 'Completed' } : req));
    }

    const requestDetails = requests.find(r => r.id === bill.requestId) || null;
    const issueDetails = issuedMaterials.find(i => i.issuedId === bill.issuedId) || null;
    setActiveBillDetails({ request: requestDetails, issue: issueDetails, receipt: bill });
    setActiveShopPurchaseBill(null);

    let toastDescription = `GRN for ${values.receivedQuantity} units of ${values.materialName} logged.`;
    if (status === 'Mismatch') {
      toastDescription += ' Quantity mismatch detected against Issued amount.';
    }
    toast({
      title: status === 'Mismatch' ? 'Audit Warning: Mismatch' : 'Audit Complete: GRN Logged',
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
      setActiveShopPurchaseBill(null);
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
        title: 'Verification Status Updated',
        description: `GRN ${receipt.receivedBillId} has been marked as ${newStatus}. Audit trail updated.`,
      });
  
      setIsUpdateDialogOpen(false);
      setSelectedReceiptForUpdate(null);
      setUpdateRemarks('');
  };

  
  const handleDownload = (billId: string) => {
    if (billContentRef.current) {
      const billHtml = billContentRef.current.innerHTML;
      const blob = new Blob([`<html><head><title>${billId}</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}.font-bold{font-weight:bold}.text-destructive{color:#ef4444}.bg-secondary{background-color:#f1f5f9}.p-4{padding:1rem}.rounded-lg{border-radius:0.5rem}</style></head><body>${billHtml}</body></html>`], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${billId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Audit Document Ready",
        description: `Consolidated Bill ${billId} downloaded.`,
      });
    }
  };

  const isDamaged = fromSiteForm.watch('isDamaged');

  const fromShopForm = useForm<FromShopFormValues>({
    resolver: zodResolver(fromShopSchema),
    defaultValues: {
      purchaseType: 'without-po',
      poNumber: '',
      invoiceNumber: '',
      vendorName: '',
      invoiceDate: new Date(),
      materials: [{ materialName: '', classification: 'Consumable', unit: '', quantity: 0, rate: 0 }],
      invoiceFile: undefined,
      gstin: '',
      eWayBillNumber: '',
      vehicleNumber: '',
    },
  });

  const { fields: shopFields, append: appendShopMaterial, remove: removeShopMaterial } = useFieldArray({
    control: fromShopForm.control,
    name: 'materials',
  });

  const purchaseType = fromShopForm.watch('purchaseType');
  const shopMaterials = fromShopForm.watch('materials');

  const previewForm = useForm<FromShopFormValues>({
    resolver: zodResolver(fromShopSchema),
    defaultValues: {
      materials: [{ materialName: '', classification: 'Consumable', unit: '', quantity: 0, rate: 0 }],
    },
  });

  const { fields: previewFields } = useFieldArray({
      control: previewForm.control,
      name: 'materials',
  });

  function onPreviewShopPurchaseSubmit(values: FromShopFormValues) {
      previewForm.reset(values);
      setIsShopPreviewDialogOpen(true);
  }

  function onGenerateFinalBill(values: FromShopFormValues) {
    const totalAmount = values.materials.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.rate)), 0);
    const newBillId = `SHOP-REC-${format(new Date(), 'yyyyMMdd-HHmmss')}`;

    const purchase: ShopPurchase = {
      ...values,
      totalAmount,
      receivedBillId: newBillId,
    };

    setShopPurchases(prev => [purchase, ...prev]);

    values.materials.forEach(purchasedMaterial => {
      setInventory(prevInventory => {
          const existingItemIndex = prevInventory.findIndex(
              item => item.site === 'MAPI Godown' && item.material.toLowerCase() === purchasedMaterial.materialName.toLowerCase()
          );

          if (existingItemIndex > -1) {
              const newInventory = [...prevInventory];
              newInventory[existingItemIndex].quantity += Number(purchasedMaterial.quantity);
              return newInventory;
          } else {
              const newItem: InventoryItem = {
                  id: `inv-${Date.now()}-${Math.random()}`,
                  site: 'MAPI Godown',
                  material: purchasedMaterial.materialName,
                  classification: purchasedMaterial.classification,
                  ownership: purchasedMaterial.ownership,
                  vendorName: purchasedMaterial.vendorName,
                  quantity: Number(purchasedMaterial.quantity),
                  unit: purchasedMaterial.unit,
                  minQty: 10,
                  maxQty: 100,
              };
              return [...prevInventory, newItem];
          }
      });
    });
    
    setIsShopPreviewDialogOpen(false);
    fromShopForm.reset();
    setActiveBillDetails(null);
    setActiveShopPurchaseBill(purchase);
    
    toast({
      title: 'Final Shop Bill Generated!',
      description: `Invoice ${values.invoiceNumber} mapped to final audit entry.`,
    });
  }


  return (
    <TooltipProvider>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-headline">Verification & Bill Audit</h1>
        <Badge variant="outline" className="text-muted-foreground uppercase tracking-widest text-[10px]">Swanag Infrastructures Audit Panel</Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Tabs defaultValue="from-site" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="from-site">Internal GRN (From Site/Godown)</TabsTrigger>
              <TabsTrigger value="from-shop">Direct Purchase (Vendor Shop)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="from-site">
              <Card>
                <CardHeader>
                  <CardTitle>Log GRN & Transport Audit</CardTitle>
                  <CardDescription>Physically verify quantity against Issued ID and map transport details.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...fromSiteForm}>
                    <form onSubmit={fromSiteForm.handleSubmit(onFromSiteSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField control={fromSiteForm.control} name="issuedId" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reference Issued ID</FormLabel>
                              <Select onValueChange={(value) => handleIssuedIdChange(value)} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select ID to match" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {availableIssuedMaterials.map(item => (<SelectItem key={item.issuedId} value={item.issuedId}>{item.issuedId} ({item.materialName})</SelectItem>))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={fromSiteForm.control} name="requestId" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Linked Indent ID</FormLabel>
                              <FormControl><Input {...field} readOnly disabled className="bg-muted" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField control={fromSiteForm.control} name="materialName" render={({ field }) => (
                            <FormItem><FormLabel>Material Name</FormLabel><FormControl><Input placeholder="Cement" {...field} readOnly disabled className="bg-muted" /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormField control={fromSiteForm.control} name="issuedQuantity" render={({ field }) => (
                            <FormItem><FormLabel>Issued Quantity (Invoiced)</FormLabel><FormControl><Input type="number" {...field} readOnly disabled className="bg-muted font-bold text-primary" /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                      </div>

                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={fromSiteForm.control} name="eWayBillNumber" render={({ field }) => (
                            <FormItem><FormLabel>E-Way Bill Number</FormLabel><FormControl><Input placeholder="Mandatory for audit mapping" {...field} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormField control={fromSiteForm.control} name="vehicleNumber" render={({ field }) => (
                            <FormItem><FormLabel>Dispatch Vehicle Number</FormLabel><FormControl><Input placeholder="e.g., MH-12-AB-1234" {...field} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                      </div>

                      <FormField control={fromSiteForm.control} name="receiverName" render={({ field }) => (
                          <FormItem><FormLabel>Site Receiver Name (Signatory)</FormLabel><FormControl><Input placeholder="Enter name of person verifying receipt" {...field} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                      <div className="rounded-lg border-2 border-primary/20 p-6 bg-primary/5 space-y-4">
                        <FormField control={fromSiteForm.control} name="receivedQuantity" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base flex items-center gap-2 font-bold text-primary">
                                    Actual Physical Quantity Received <TooltipProvider><Tooltip><TooltipTrigger asChild><AlertTriangle className="h-4 w-4 text-amber-500"/></TooltipTrigger><TooltipContent>Must match physical count at site.</TooltipContent></Tooltip></TooltipProvider>
                                </FormLabel>
                                <FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background text-xl font-bold border-primary"/></FormControl>
                                <FormMessage />
                            </FormItem>
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
                              <FormLabel className="font-normal flex items-center gap-1">Material Integrity Check</FormLabel>
                            </FormItem>
                          )}
                        />
                        {isDamaged && <FormField control={fromSiteForm.control} name="damageDescription" render={({ field }) => (
                            <FormItem><FormLabel className="text-destructive font-bold">Damage Description (Required for audit)</FormLabel><FormControl><Textarea placeholder="Detail the damage for audit trail..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />}
                      </div>
                      <FormField control={fromSiteForm.control} name="receivedDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Receipt Timestamp</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="ml-auto h-4 w-4 opacity-50" />{field.value ? format(field.value, 'PPP p') : <span>Pick timestamp</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                      <Button type="submit" size="lg" className="w-full" disabled={fromSiteForm.formState.isSubmitting}><PackageCheck className="mr-2 h-4 w-4" />{fromSiteForm.formState.isSubmitting ? 'Verifying Audit Trail...' : 'Confirm Receipt & Link Bill'}</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="from-shop">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Bill Verification</CardTitle>
                  <CardDescription>Process external purchases. Mandatory invoice attachment required for audit compliance.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...fromShopForm}>
                    <form onSubmit={fromShopForm.handleSubmit(onPreviewShopPurchaseSubmit)} className="space-y-6">
                       <FormField
                        control={fromShopForm.control}
                        name="purchaseType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purchase Context</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="PO Linked / Direct" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="with-po">PO Linked Purchase</SelectItem>
                                <SelectItem value="without-po">Direct Emergency Purchase</SelectItem>
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
                                <FormLabel>Approved PO Number</FormLabel>
                                <FormControl>
                                <Input placeholder="PO-XXXXX" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={fromShopForm.control} name="invoiceNumber" render={({ field }) => (<FormItem><FormLabel>Vendor Invoice #</FormLabel><FormControl><Input placeholder="INV-2024-001" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={fromShopForm.control} name="vendorName" render={({ field }) => (<FormItem><FormLabel>Vendor Entity Name</FormLabel><FormControl><Input placeholder="Acme Suppliers Ltd." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={fromShopForm.control} name="gstin" render={({ field }) => (<FormItem><FormLabel>Vendor GSTIN (Verified)</FormLabel><FormControl><Input placeholder="22AAAAA0000A1Z5" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={fromShopForm.control} name="invoiceDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Invoice Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="ml-auto h-4 w-4 opacity-50" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                      </div>

                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={fromShopForm.control} name="eWayBillNumber" render={({ field }) => (<FormItem><FormLabel>E-Way Bill Mapping</FormLabel><FormControl><Input placeholder="Enter mapped E-Way Bill #" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={fromShopForm.control} name="vehicleNumber" render={({ field }) => (<FormItem><FormLabel>Carrier Vehicle Number</FormLabel><FormControl><Input placeholder="MH-XX-XX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      </div>
                      
                      <div>
                        <Label className="font-bold text-primary">Material Audit Entry</Label>
                        <div className="mt-2 rounded-md border overflow-x-auto bg-primary/5">
                          <Table>
                            <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Classification</TableHead><TableHead>Ownership</TableHead><TableHead>Unit</TableHead><TableHead>Qty</TableHead><TableHead>Rate</TableHead><TableHead /></TableRow></TableHeader>
                            <TableBody>
                              {shopFields.map((field, index) => (
                                <TableRow key={field.id}>
                                  <TableCell className="min-w-[150px]">
                                    <FormField control={fromShopForm.control} name={`materials.${index}.materialName`} render={({ field }) => (
                                      <FormItem><FormControl><Input placeholder="Material" {...field} /></FormControl><FormMessage/></FormItem>
                                    )}/>
                                  </TableCell>
                                  <TableCell className="min-w-[150px]"><FormField control={fromShopForm.control} name={`materials.${index}.classification`} render={({ field }) => (<FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Type"/></SelectTrigger></FormControl><SelectContent><SelectItem value="Consumable">Consumable</SelectItem><SelectItem value="Asset">Asset</SelectItem></SelectContent></Select><FormMessage/></FormItem>)}/></TableCell>
                                  <TableCell className="min-w-[150px]">{shopMaterials[index]?.classification === 'Asset' && <FormField control={fromShopForm.control} name={`materials.${index}.ownership`} render={({ field }) => (<FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Ownership"/></SelectTrigger></FormControl><SelectContent><SelectItem value="Own">Own</SelectItem><SelectItem value="Rent">Rent</SelectItem></SelectContent></Select><FormMessage/></FormItem>)} />}</TableCell>
                                  <TableCell className="min-w-[100px]"><FormField control={fromShopForm.control} name={`materials.${index}.unit`} render={({ field }) => (<FormItem><FormControl><Input placeholder="Unit" {...field}/></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                  <TableCell className="min-w-[100px]"><FormField control={fromShopForm.control} name={`materials.${index}.quantity`} render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="0" {...field}/></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                  <TableCell className="min-w-[100px]"><FormField control={fromShopForm.control} name={`materials.${index}.rate`} render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="0.00" {...field}/></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                  <TableCell><Button variant="ghost" size="icon" onClick={() => removeShopMaterial(index)} disabled={shopFields.length <= 1}><Trash className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendShopMaterial({ materialName: '', classification: 'Consumable', unit: '', quantity: 0, rate: 0 })} className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Add Row</Button>
                      </div>

                      <FormField
                        control={fromShopForm.control}
                        name="invoiceFile"
                        render={({ field: { onChange, value } }) => (
                          <FormItem className="border-2 border-dashed p-8 rounded-lg bg-secondary/10 text-center">
                            <FormLabel className="flex flex-col items-center gap-2 text-primary font-bold cursor-pointer">
                                <Upload className="h-8 w-8 mb-2 opacity-50"/>
                                Click to Upload Signed Invoice & E-Way Bill Mapping
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                className="hidden"
                                id="invoice-upload"
                                onChange={(e) =>
                                  onChange(e.target.files ? e.target.files[0] : null)
                                }
                              />
                            </FormControl>
                            <Button asChild variant="secondary" className="mt-4"><label htmlFor="invoice-upload">Choose File</label></Button>
                            {value && <p className="text-sm font-medium text-green-600 mt-4 flex items-center justify-center gap-1"><CheckCircle className="h-4 w-4"/> Audit Document Attached: {value.name}</p>}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" size="lg" className="w-full" disabled={fromShopForm.formState.isSubmitting}>
                        <Eye className="mr-2 h-4 w-4" />
                        {fromShopForm.formState.isSubmitting ? 'Processing Audit Files...' : 'Verify & Preview Audit Bill'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {(activeBillDetails || activeShopPurchaseBill) && (
            <div className="lg:col-span-2" ref={billContentRef}>
              {activeBillDetails && (
                <Card className="border-primary/20 shadow-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-start justify-between bg-primary/5 p-6 border-b">
                        <div>
                          <CardTitle className="flex items-center gap-2"><FileDiff className="text-primary h-5 w-5" /> Consolidated Bill Audit</CardTitle>
                          <CardDescription>Triple-match verification: Indent, Issue, and GRN mapping.</CardDescription>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => handleDownload(activeBillDetails.receipt?.receivedBillId ?? 'bill')}><Download className="mr-2 h-4 w-4" />Export</Button>
                    </CardHeader>
                    <CardContent className="space-y-6 text-sm p-6 bg-background">
                        <div className={cn(
                            "rounded-lg border p-4 space-y-2",
                            activeBillDetails.receipt?.status === 'Mismatch' ? "bg-destructive/10 border-destructive/30" : "bg-green-50 border-green-200"
                        )}>
                            <h3 className="font-bold text-base flex items-center gap-2">
                                Audit Status: 
                                {activeBillDetails.receipt?.status === 'Mismatch' ? (
                                    <Badge variant="destructive" className="uppercase px-3">Warning: mismatch</Badge>
                                ) : (
                                    <Badge className="bg-green-600 uppercase px-3">Verified & Linked</Badge>
                                )}
                            </h3>
                            {activeBillDetails.receipt?.status === 'Mismatch' ? ( 
                                <div className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-5 w-5 shrink-0" />
                                    <p className="font-semibold leading-snug">QUERY: Received quantity does not match issued amount. Audit flag raised.</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="h-5 w-5 shrink-0" />
                                    <p className="font-semibold">WORKFLOW COMPLETE: Quantity verified. Indent {activeBillDetails.request?.id} marked for closure.</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2"><FileText className="h-3 w-3"/> 1. Original Material Indent</h3>
                                <div className="rounded-lg border p-4 space-y-2 bg-secondary/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10"><FileText className="h-12 w-12"/></div>
                                    <div className="flex justify-between">
                                        <p><strong>Indent ID:</strong> {activeBillDetails.request?.id}</p>
                                        <p><strong>Requesting Site:</strong> {activeBillDetails.request?.requestingSite}</p>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">{activeBillDetails.request?.materials.map(m=>m.materialName).join(', ')}</span>
                                        <span className="font-bold text-lg">{activeBillDetails.request?.materials.reduce((acc,m)=>acc+m.quantity,0)} units</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Truck className="h-3 w-3"/> 2. Issue & Transport Logistics</h3>
                                <div className="rounded-lg border p-4 space-y-2 bg-secondary/5 relative">
                                    <div className="absolute top-0 right-0 p-2 opacity-10"><Truck className="h-12 w-12"/></div>
                                    <div className="flex justify-between">
                                        <p><strong>Issue ID:</strong> {activeBillDetails.issue?.issuedId}</p>
                                        <p><strong>Issuing Site:</strong> {activeBillDetails.issue?.issuingSite}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <p><strong>E-Way Bill:</strong> {activeBillDetails.receipt?.eWayBillNumber || 'N/A'}</p>
                                        <p><strong>Vehicle No:</strong> {activeBillDetails.receipt?.vehicleNumber || activeBillDetails.issue?.vehicleNumber || 'N/A'}</p>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>Quantity Released:</span>
                                        <span className="font-bold">{activeBillDetails.issue?.issuedQuantity} units</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2"><PackageCheck className="h-3 w-3"/> 3. Goods Received Note (GRN) Verification</h3>
                                <div className="rounded-lg border-2 border-primary/10 p-4 space-y-3 bg-primary/5">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-primary">GRN ID: {activeBillDetails.receipt?.receivedBillId}</p>
                                            <p className="text-[10px] text-muted-foreground">Verified by {activeBillDetails.receipt?.receiver?.name} on {activeBillDetails.receipt?.receivedDate ? format(new Date(activeBillDetails.receipt.receivedDate), 'PPP p') : 'N/A'}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-background">Physical Receipt</Badge>
                                    </div>
                                    <Separator className="bg-primary/10" />
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-base">{activeBillDetails.receipt?.materialName}</span>
                                        <div className="text-right">
                                            <span className={cn("font-bold text-2xl block", activeBillDetails.receipt?.status === 'Mismatch' ? 'text-destructive' : 'text-primary')}>
                                                {activeBillDetails.receipt?.receivedQuantity} units
                                            </span>
                                            <p className="text-[10px] uppercase text-muted-foreground">Logged at site</p>
                                        </div>
                                    </div>
                                    {activeBillDetails.receipt?.remarks && (
                                        <div className="bg-background p-2 rounded border text-xs italic text-muted-foreground">
                                            "{activeBillDetails.receipt.remarks}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              )}
              {activeShopPurchaseBill && (
                 <Card className="border-green-200 shadow-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-start justify-between bg-green-50 p-6 border-b">
                        <div>
                          <CardTitle className="flex items-center gap-2"><CreditCard className="text-green-600 h-5 w-5" /> Audit-Ready Shop Bill</CardTitle>
                          <CardDescription>Verified external vendor purchase with mapped credentials.</CardDescription>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => handleDownload(activeShopPurchaseBill.receivedBillId)}><Download className="mr-2 h-4 w-4" />Export</Button>
                    </CardHeader>
                    <CardContent className="space-y-6 text-sm p-6 bg-background">
                       <div className="rounded-lg border border-green-200 p-4 space-y-3 bg-green-50/30">
                          <h3 className="font-bold text-[10px] uppercase tracking-widest text-green-700">Invoice & Logistics Verification</h3>
                          <div className="grid grid-cols-2 gap-y-3">
                            <div><p className="text-[10px] text-muted-foreground uppercase">Invoice #</p><p className="font-bold">{activeShopPurchaseBill.invoiceNumber}</p></div>
                            <div><p className="text-[10px] text-muted-foreground uppercase">Vendor</p><p className="font-bold truncate">{activeShopPurchaseBill.vendorName}</p></div>
                            <div><p className="text-[10px] text-muted-foreground uppercase">E-Way Bill</p><p className="font-bold">{activeShopPurchaseBill.eWayBillNumber || 'N/A'}</p></div>
                            <div><p className="text-[10px] text-muted-foreground uppercase">Vehicle</p><p className="font-bold">{activeShopPurchaseBill.vehicleNumber || 'N/A'}</p></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Audit-Verified Materials</h3>
                           <div className="rounded-md border overflow-hidden">
                               <Table>
                                <TableHeader className="bg-muted/50">
                                  <TableRow>
                                    <TableHead className="h-8 text-[10px]">Item</TableHead>
                                    <TableHead className="h-8 text-[10px]">Qty</TableHead>
                                    <TableHead className="h-8 text-[10px]">Rate</TableHead>
                                    <TableHead className="h-8 text-[10px] text-right">Amount</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {activeShopPurchaseBill.materials.map((item, index) => (
                                    <TableRow key={index} className="h-8">
                                      <TableCell className="py-1">{item.materialName}</TableCell>
                                      <TableCell className="py-1 font-bold">{item.quantity} {item.unit}</TableCell>
                                      <TableCell className="py-1">${Number(item.rate).toFixed(2)}</TableCell>
                                      <TableCell className="py-1 text-right font-medium">${(Number(item.quantity) * Number(item.rate)).toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                           </div>
                          <Separator className="my-2"/>
                          <div className="text-right">
                            <p className="text-[10px] uppercase text-muted-foreground mb-1">Total Taxable Value (Audit Confirmed)</p>
                            <span className="text-3xl font-black text-primary font-headline">${activeShopPurchaseBill.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                    </CardContent>
                 </Card>
              )}
            </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Audit Verification Log (Internal)</CardTitle>
              <CardDescription className="text-xs">History of verified material movements between sites.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
              {pastReceipts.length > 0 ? (
                  <Table>
                      <TableHeader className="bg-muted/30"><TableRow><TableHead className="text-[10px] h-8">GRN ID</TableHead><TableHead className="text-[10px] h-8">Material</TableHead><TableHead className="text-[10px] h-8">Audit Status</TableHead><TableHead className="text-right text-[10px] h-8 pr-4">Action</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {pastReceipts.map(rec => (
                              <TableRow key={rec.receivedBillId}>
                                  <TableCell className="font-bold text-xs">{rec.receivedBillId}</TableCell>
                                  <TableCell className="text-xs">{rec.materialName}</TableCell>
                                  <TableCell><Badge variant={rec.status === 'Accepted' ? 'default' : rec.status === 'Completed' ? 'outline' : 'destructive'} className={cn("text-[10px] uppercase px-2", rec.status === 'Accepted' && 'bg-green-600/80', rec.status === 'Completed' && 'border-green-600 text-green-600')}>{rec.status}</Badge></TableCell>
                                  <TableCell className="text-right pr-2 space-x-1">
                                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleViewBill(rec.receivedBillId)}><Eye className="h-3 w-3" /></Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-7 px-2"><ChevronDown className="h-3 w-3" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                          <DropdownMenuItem onClick={() => handleStatusUpdateClick(rec, 'Accepted')}>Mark Accepted</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusUpdateClick(rec, 'Mismatch')}>Flag Mismatch</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusUpdateClick(rec, 'Completed')}>Mark Completed</DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              ) : (<div className="flex items-center justify-center p-12 text-muted-foreground text-xs italic">No internal verification logs recorded.</div>)}
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg">Vendor Bill Audit Log</CardTitle>
            <CardDescription className="text-xs">Audit-verified direct vendor purchases with linked invoices.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {shopPurchases.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/30"><TableRow><TableHead className="text-[10px] h-8">Invoice #</TableHead><TableHead className="text-[10px] h-8">Vendor</TableHead><TableHead className="text-[10px] h-8">E-Way Bill</TableHead><TableHead className="text-right text-[10px] h-8 pr-4">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {shopPurchases.map((purchase) => (
                    <TableRow key={purchase.receivedBillId}>
                      <TableCell className="font-bold text-xs">{purchase.invoiceNumber}</TableCell>
                      <TableCell className="text-xs truncate max-w-[120px]">{purchase.vendorName}</TableCell>
                      <TableCell className="text-xs">{purchase.eWayBillNumber || 'N/A'}</TableCell>
                      <TableCell className="text-right pr-4 font-black text-xs">${purchase.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (<div className="flex items-center justify-center p-12 text-muted-foreground text-xs italic">No vendor audit records available.</div>)}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Audit Status Update: {selectedReceiptForUpdate?.receipt.receivedBillId}</DialogTitle>
            <DialogDescription>
              Submit an official audit justification to change status to <Badge variant={selectedReceiptForUpdate?.newStatus === 'Mismatch' ? 'destructive' : 'default'}>{selectedReceiptForUpdate?.newStatus}</Badge>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="update-remarks" className="text-xs font-bold uppercase text-primary">Internal Audit Remarks</Label>
                <Textarea
                    id="update-remarks"
                    value={updateRemarks}
                    onChange={(e) => setUpdateRemarks(e.target.value)}
                    placeholder="Provide details for this status change (e.g., 'Mismatch resolved via secondary count')..."
                    className="min-h-[100px]"
                />
              </div>
          </div>
          <DialogFooter className="sm:justify-between">
              <Button variant="outline" type="button" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleConfirmStatusUpdate} disabled={!updateRemarks.trim()}>Submit Audit Justification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isShopPreviewDialogOpen} onOpenChange={setIsShopPreviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="p-6 border-b shrink-0">
                  <DialogTitle className="text-2xl">Final Audit Preview: External Purchase</DialogTitle>
                  <DialogDescription>Verify mapped E-Way Bill and Invoice integrity before final ledger entry.</DialogDescription>
              </DialogHeader>
              <Form {...previewForm}>
                  <form onSubmit={previewForm.handleSubmit(onGenerateFinalBill)} className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6 text-sm bg-secondary/5 p-6 rounded-xl border relative">
                          <div className="absolute top-0 right-0 p-2 opacity-5"><CreditCard className="h-16 w-12"/></div>
                          <div><p className="text-[10px] uppercase text-muted-foreground">Invoice #</p><p className="font-bold text-lg">{previewForm.getValues('invoiceNumber')}</p></div>
                          <div><p className="text-[10px] uppercase text-muted-foreground">Vendor</p><p className="font-bold text-lg">{previewForm.getValues('vendorName')}</p></div>
                          <div><p className="text-[10px] uppercase text-muted-foreground">Mapped E-Way Bill</p><p className="font-medium">{previewForm.getValues('eWayBillNumber') || 'N/A'}</p></div>
                          <div><p className="text-[10px] uppercase text-muted-foreground">Verified Carrier</p><p className="font-medium">{previewForm.getValues('vehicleNumber') || 'N/A'}</p></div>
                      </div>
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead className="text-xs">Material Description</TableHead>
                                    <TableHead className="text-xs">Audit unit</TableHead>
                                    <TableHead className="text-xs">Qty</TableHead>
                                    <TableHead className="text-xs">Rate ($)</TableHead>
                                    <TableHead className="text-xs text-right">Extended Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {previewFields.map((item, index) => {
                                  const quantity = previewForm.watch(`materials.${index}.quantity`);
                                  const rate = previewForm.watch(`materials.${index}.rate`);
                                  const amount = Number(quantity) * Number(rate);
                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell className="font-bold text-xs">{item.materialName}</TableCell>
                                      <TableCell className="text-xs">{previewForm.watch(`materials.${index}.unit`)}</TableCell>
                                      <TableCell className="text-xs font-black">{quantity}</TableCell>
                                      <TableCell className="text-xs">{Number(rate).toFixed(2)}</TableCell>
                                      <TableCell className="font-black text-xs text-right">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                    </TableRow>
                                  )
                                })}
                            </TableBody>
                        </Table>
                      </div>
                      <div className="text-right space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Verified Taxable Value</p>
                          <p className="text-4xl font-black font-headline text-primary">
                            ${previewFields.reduce((acc, _, i) => acc + (Number(previewForm.watch(`materials.${i}.quantity`)) * Number(previewForm.watch(`materials.${i}.rate`))), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                      </div>
                      <DialogFooter className="pt-6 border-t mt-auto">
                          <Button type="button" variant="outline" size="lg" onClick={() => setIsShopPreviewDialogOpen(false)}>Edit Details</Button>
                          <Button type="submit" size="lg" className="px-8"><CheckCircle className="mr-2 h-4 w-4"/> Confirm Audit & Finalize Bill</Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}