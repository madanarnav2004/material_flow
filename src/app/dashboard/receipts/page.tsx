'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PackageCheck, FileText, Download, Eye, AlertTriangle, CheckCircle, HelpCircle, ChevronDown, CalendarIcon, FileDiff, Upload, PlusCircle, Trash, Truck, CreditCard } from 'lucide-react';
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
import { useMaterialContext, InventoryItem, MaterialReceivedBill, ReceiptStatus } from '@/context/material-context';
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
  eWayBillNumber: z.string().optional(),
  vehicleNumber: z.string().optional(),
});

type FromSiteFormValues = z.infer<typeof fromSiteSchema>;

// Schema for direct shop purchase
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
        vehicleNumber?: string;
    } | null;
    receipt: MaterialReceivedBill | null;
}


export default function ReceiptsPage() {
  const { toast } = useToast();
  const { issuedMaterials, requests, inventory, setInventory, receipts: pastReceipts, setReceipts: setPastReceipts } = useMaterialContext();
  const searchParams = useSearchParams();
  const billContentRef = React.useRef<HTMLDivElement>(null);
  
  const [activeBillDetails, setActiveBillDetails] = React.useState<FullBillDetails | null>(null);
  const [activeShopPurchaseBill, setActiveShopPurchaseBill] = React.useState<ShopPurchase | null>(null);

  const [shopPurchases, setShopPurchases] = React.useState<ShopPurchase[]>([]);
  
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);
  const [selectedReceiptForUpdate, setSelectedReceiptForUpdate] = React.useState<{ receipt: MaterialReceivedBill, newStatus: ReceiptStatus } | null>(null);
  const [updateRemarks, setUpdateRemarks] = React.useState('');

  const [isShopPreviewDialogOpen, setIsShopPreviewDialogOpen] = React.useState(false);


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
            title: 'Auto-filled!',
            description: 'Material and vehicle details have been auto-filled from the Issued ID.',
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

    const requestDetails = requests.find(r => r.id === bill.requestId) || null;
    const issueDetails = issuedMaterials.find(i => i.issuedId === bill.issuedId) || null;
    setActiveBillDetails({ request: requestDetails, issue: issueDetails, receipt: bill });
    setActiveShopPurchaseBill(null);

    let toastDescription = `GRN for ${values.receivedQuantity} units of ${values.materialName} logged.`;
    if (status === 'Mismatch') {
      toastDescription += ' Quantity mismatch detected against Issued amount.';
    }
    toast({
      title: status === 'Mismatch' ? 'Quantity Mismatch Detected' : 'GRN Logged Successfully',
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
        description: `GRN ${receipt.receivedBillId} has been marked as ${newStatus}.`,
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
        title: "Download Started",
        description: `Consolidated Bill ${billId} is downloading.`,
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

  // New form for the preview dialog
  const previewForm = useForm<FromShopFormValues>({
    resolver: zodResolver(fromShopSchema),
    defaultValues: {
      materials: [{ materialName: '', classification: 'Consumable', unit: '', quantity: 0, rate: 0 }],
    },
  });

  const { fields: previewFields, append: appendPreviewMaterial, remove: removePreviewMaterial } = useFieldArray({
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
      description: `Invoice ${values.invoiceNumber} and E-Way Bill mapped successfully.`,
    });
  }


  return (
    <TooltipProvider>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-headline">Goods Received Note (GRN) & Bill Checking</h1>
        <Badge variant="outline" className="text-muted-foreground">Audit Verified Workflow</Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Tabs defaultValue="from-site" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="from-site">GRN (Internal Transfer)</TabsTrigger>
              <TabsTrigger value="from-shop">Direct Shop Purchase</TabsTrigger>
            </TabsList>
            
            <TabsContent value="from-site">
              <Card>
                <CardHeader>
                  <CardTitle>Log GRN from Other Site / Godown</CardTitle>
                  <CardDescription>Verify quantities against issued materials and log transport details.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...fromSiteForm}>
                    <form onSubmit={fromSiteForm.handleSubmit(onFromSiteSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField control={fromSiteForm.control} name="issuedId" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Issued ID</FormLabel>
                              <Select onValueChange={(value) => handleIssuedIdChange(value)} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select an Issued ID" /></SelectTrigger></FormControl>
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
                            <FormItem><FormLabel>Issued Quantity (Ref)</FormLabel><FormControl><Input type="number" placeholder="e.g., 50" {...field} readOnly value={field.value ?? 0} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                      </div>

                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={fromSiteForm.control} name="eWayBillNumber" render={({ field }) => (
                            <FormItem><FormLabel>E-Way Bill Number (Optional)</FormLabel><FormControl><Input placeholder="Enter E-Way Bill Number" {...field} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormField control={fromSiteForm.control} name="vehicleNumber" render={({ field }) => (
                            <FormItem><FormLabel>Vehicle Number</FormLabel><FormControl><Input placeholder="e.g., MH-12-AB-1234" {...field} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                      </div>

                      <FormField control={fromSiteForm.control} name="receiverName" render={({ field }) => (
                          <FormItem><FormLabel>Site Receiver Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                      <div className="rounded-md border p-4 bg-secondary/20 space-y-4">
                        <FormField control={fromSiteForm.control} name="receivedQuantity" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base flex items-center gap-2">
                                    Actual Received Quantity <TooltipProvider><Tooltip><TooltipTrigger asChild><AlertTriangle className="h-4 w-4 text-amber-500"/></TooltipTrigger><TooltipContent>Must be checked physically at site.</TooltipContent></Tooltip></TooltipProvider>
                                </FormLabel>
                                <FormControl><Input type="number" placeholder="Enter quantity received" {...field} className="bg-background text-lg"/></FormControl>
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
                              <FormLabel className="font-normal flex items-center gap-1">Was the material damaged?</FormLabel>
                            </FormItem>
                          )}
                        />
                        {isDamaged && <FormField control={fromSiteForm.control} name="damageDescription" render={({ field }) => (
                            <FormItem><FormLabel>Damage Description (Mandatory)</FormLabel><FormControl><Textarea placeholder="Detail the damage for audit..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />}
                      </div>
                      <FormField control={fromSiteForm.control} name="receivedDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Received Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="ml-auto h-4 w-4 opacity-50" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                      <Button type="submit" size="lg" className="w-full" disabled={fromSiteForm.formState.isSubmitting}><PackageCheck className="mr-2 h-4 w-4" />{fromSiteForm.formState.isSubmitting ? 'Verifying...' : 'Log GRN & Finalize Bill Match'}</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="from-shop">
              <Card>
                <CardHeader>
                  <CardTitle>Log New Purchase Material</CardTitle>
                  <CardDescription>Enter invoice and E-Way bill details for external purchases. Invoice upload is mandatory.</CardDescription>
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
                                  <SelectValue placeholder="With PO / Without PO" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="with-po">With Purchase Order (PO)</SelectItem>
                                <SelectItem value="without-po">Direct Purchase (No PO)</SelectItem>
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
                                <Input placeholder="Enter Approved PO Number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={fromShopForm.control} name="invoiceNumber" render={({ field }) => (<FormItem><FormLabel>Invoice Number</FormLabel><FormControl><Input placeholder="INV-2024-001" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={fromShopForm.control} name="vendorName" render={({ field }) => (<FormItem><FormLabel>Vendor Name</FormLabel><FormControl><Input placeholder="Acme Suppliers Ltd." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={fromShopForm.control} name="gstin" render={({ field }) => (<FormItem><FormLabel>Vendor GSTIN</FormLabel><FormControl><Input placeholder="22AAAAA0000A1Z5" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={fromShopForm.control} name="invoiceDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Invoice Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="ml-auto h-4 w-4 opacity-50" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                      </div>

                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={fromShopForm.control} name="eWayBillNumber" render={({ field }) => (<FormItem><FormLabel>E-Way Bill Number</FormLabel><FormControl><Input placeholder="Generated E-Way Bill #" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={fromShopForm.control} name="vehicleNumber" render={({ field }) => (<FormItem><FormLabel>Dispatch Vehicle Number</FormLabel><FormControl><Input placeholder="MH-XX-XX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      </div>
                      
                      <div>
                        <Label>Material Item Verification</Label>
                        <div className="mt-2 rounded-md border overflow-x-auto">
                          <Table>
                            <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Type</TableHead><TableHead>Ownership</TableHead><TableHead>Unit</TableHead><TableHead>Qty</TableHead><TableHead>Rate</TableHead><TableHead /></TableRow></TableHeader>
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
                                  <TableCell className="min-w-[100px]"><FormField control={fromShopForm.control} name={`materials.${index}.unit`} render={({ field }) => (<FormItem><FormControl><Input placeholder="bag" {...field}/></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                  <TableCell className="min-w-[100px]"><FormField control={fromShopForm.control} name={`materials.${index}.quantity`} render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="0" {...field}/></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                  <TableCell className="min-w-[100px]"><FormField control={fromShopForm.control} name={`materials.${index}.rate`} render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="0.00" {...field}/></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                  <TableCell><Button variant="ghost" size="icon" onClick={() => removeShopMaterial(index)} disabled={shopFields.length <= 1}><Trash className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendShopMaterial({ materialName: '', classification: 'Consumable', unit: '', quantity: 0, rate: 0 })} className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Add Material Row</Button>
                      </div>

                      <FormField
                        control={fromShopForm.control}
                        name="invoiceFile"
                        render={({ field: { onChange, value } }) => (
                          <FormItem className="border-2 border-dashed p-6 rounded-lg bg-secondary/10">
                            <FormLabel className="flex items-center gap-2 text-primary font-bold"><Upload className="h-5 w-5"/> Upload Verified Invoice & E-Way Bill Attachment</FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                className="mt-2"
                                onChange={(e) =>
                                  onChange(e.target.files ? e.target.files[0] : null)
                                }
                              />
                            </FormControl>
                            {value && <p className="text-sm font-medium text-green-600 mt-2 flex items-center gap-1"><CheckCircle className="h-4 w-4"/> Attached: {value.name}</p>}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" size="lg" className="w-full" disabled={fromShopForm.formState.isSubmitting}>
                        <Eye className="mr-2 h-4 w-4" />
                        {fromShopForm.formState.isSubmitting ? 'Processing Audit Data...' : 'Preview Audit-Ready Bill'}
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
                <Card className="border-primary/20 shadow-lg">
                    <CardHeader className="flex flex-row items-start justify-between bg-primary/5 rounded-t-lg">
                        <div>
                          <CardTitle className="flex items-center gap-2"><FileDiff className="text-primary" /> Final Bill Checking Process</CardTitle>
                          <CardDescription>Cross-verifying Indent, Issued, and GRN documents.</CardDescription>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => handleDownload(activeBillDetails.receipt?.receivedBillId ?? 'bill')}><Download className="mr-2 h-4 w-4" />Download</Button>
                    </CardHeader>
                    <CardContent className="space-y-6 text-sm py-6">
                        <div className={cn(
                            "rounded-lg border p-4 space-y-2",
                            activeBillDetails.receipt?.status === 'Mismatch' ? "bg-destructive/10 border-destructive/30" : "bg-green-50 border-green-200"
                        )}>
                            <h3 className="font-semibold text-base flex items-center gap-2">
                                Audit Status: 
                                {activeBillDetails.receipt?.status === 'Mismatch' ? (
                                    <Badge variant="destructive"> mismatch detected</Badge>
                                ) : (
                                    <Badge className="bg-green-600">Verified & Matched</Badge>
                                )}
                            </h3>
                            {activeBillDetails.receipt?.status === 'Mismatch' ? ( 
                                <div className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-5 w-5" />
                                    <p className="font-semibold">Query: The received quantity does not match the issued amount.</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="h-5 w-5" />
                                    <p className="font-semibold">Workflow Complete: All quantities match. Linked to Indent {activeBillDetails.request?.id}.</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><FileText className="h-3 w-3"/> 1. Material Indent Bill</h3>
                                <div className="rounded-lg border p-4 space-y-2 bg-secondary/5">
                                    <div className="flex justify-between">
                                        <p><strong>Indent ID:</strong> {activeBillDetails.request?.id}</p>
                                        <p><strong>Site:</strong> {activeBillDetails.request?.site}</p>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span>{activeBillDetails.request?.material}</span>
                                        <span className="font-bold text-lg">{activeBillDetails.request?.quantity} units</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Truck className="h-3 w-3"/> 2. Issued Bill & Transport</h3>
                                <div className="rounded-lg border p-4 space-y-2 bg-secondary/5">
                                    <div className="flex justify-between">
                                        <p><strong>Issued ID:</strong> {activeBillDetails.issue?.issuedId}</p>
                                        <p><strong>From:</strong> {activeBillDetails.issue?.issuingSite}</p>
                                    </div>
                                    {activeBillDetails.receipt?.eWayBillNumber && <p><strong>E-Way Bill:</strong> {activeBillDetails.receipt.eWayBillNumber}</p>}
                                    <p><strong>Vehicle No:</strong> {activeBillDetails.receipt?.vehicleNumber || activeBillDetails.issue?.vehicleNumber || 'N/A'}</p>
                                    <Separator />
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>{activeBillDetails.issue?.materialName}</span>
                                        <span className="font-bold">{activeBillDetails.issue?.issuedQuantity} units</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><PackageCheck className="h-3 w-3"/> 3. Goods Received Note (GRN)</h3>
                                <div className="rounded-lg border p-4 space-y-2 bg-primary/5">
                                    <div className="flex justify-between">
                                        <p><strong>GRN ID:</strong> {activeBillDetails.receipt?.receivedBillId}</p>
                                        <p><strong>Receiver:</strong> {activeBillDetails.receipt?.receiver?.name}</p>
                                    </div>
                                    <p><strong>Rec. Date:</strong> {activeBillDetails.receipt?.receivedDate ? format(new Date(activeBillDetails.receipt.receivedDate), 'PPP') : 'N/A'}</p>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{activeBillDetails.receipt?.materialName}</span>
                                        <span className={cn("font-bold text-xl", activeBillDetails.receipt?.status === 'Mismatch' && 'text-destructive')}>
                                            {activeBillDetails.receipt?.receivedQuantity} units
                                        </span>
                                    </div>
                                    {activeBillDetails.receipt?.remarks && <p className="text-xs text-muted-foreground pt-2 italic">"{activeBillDetails.receipt.remarks}"</p>}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              )}
              {activeShopPurchaseBill && (
                 <Card className="border-green-200 shadow-lg">
                    <CardHeader className="flex flex-row items-start justify-between bg-green-50 rounded-t-lg">
                        <div>
                          <CardTitle className="flex items-center gap-2"><CreditCard className="text-green-600" /> Audit-Ready Purchase Bill</CardTitle>
                          <CardDescription>Verified external purchase with linked attachments.</CardDescription>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => handleDownload(activeShopPurchaseBill.receivedBillId)}><Download className="mr-2 h-4 w-4" />Download</Button>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm py-6">
                       <div className="rounded-lg border p-4 space-y-2 bg-green-50/30">
                          <h3 className="font-semibold text-base">Invoice & E-Way Verification</h3>
                          <div className="grid grid-cols-2 gap-y-2">
                            <p><strong>Invoice #:</strong> {activeShopPurchaseBill.invoiceNumber}</p>
                            <p><strong>Vendor:</strong> {activeShopPurchaseBill.vendorName}</p>
                            <p><strong>GSTIN:</strong> {activeShopPurchaseBill.gstin || 'N/A'}</p>
                            <p><strong>E-Way Bill:</strong> {activeShopPurchaseBill.eWayBillNumber || 'N/A'}</p>
                            <p><strong>Vehicle No:</strong> {activeShopPurchaseBill.vehicleNumber || 'N/A'}</p>
                            <p><strong>Type:</strong> {activeShopPurchaseBill.purchaseType === 'with-po' ? 'PO Linked' : 'Direct'}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Verified Materials</h3>
                           <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {activeShopPurchaseBill.materials.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.materialName}</TableCell>
                                  <TableCell>{item.quantity} {item.unit}</TableCell>
                                  <TableCell>${Number(item.rate).toFixed(2)}</TableCell>
                                  <TableCell className="text-right">${(Number(item.quantity) * Number(item.rate)).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <Separator className="my-2"/>
                          <div className="text-right font-bold text-lg text-primary">
                            Total Taxable Value: ${activeShopPurchaseBill.totalAmount.toFixed(2)}
                          </div>
                        </div>
                    </CardContent>
                 </Card>
              )}
            </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
              <CardTitle>Recent Internal Verification Log</CardTitle>
              <CardDescription>Verified goods movement between organizational locations.</CardDescription>
          </CardHeader>
          <CardContent>
              {pastReceipts.length > 0 ? (
                  <Table>
                      <TableHeader><TableRow><TableHead>REC ID</TableHead><TableHead>Material</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Audit</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {pastReceipts.map(rec => (
                              <TableRow key={rec.receivedBillId}>
                                  <TableCell className="font-medium">{rec.receivedBillId}</TableCell>
                                  <TableCell>{rec.materialName}</TableCell>
                                  <TableCell><Badge variant={rec.status === 'Accepted' ? 'default' : rec.status === 'Completed' ? 'outline' : 'destructive'} className={cn(rec.status === 'Accepted' && 'bg-green-600/80', rec.status === 'Completed' && 'border-green-600 text-green-600')}>{rec.status}</Badge></TableCell>
                                  <TableCell className="text-right space-x-2">
                                      <Button variant="ghost" size="sm" onClick={() => handleViewBill(rec.receivedBillId)}><Eye className="mr-2 h-4 w-4" />View</Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Update <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleStatusUpdateClick(rec, 'Accepted')}>Mark Accepted</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusUpdateClick(rec, 'Mismatch')}>Mark Mismatch</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusUpdateClick(rec, 'Completed')}>Mark Completed</DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              ) : (<div className="flex items-center justify-center p-8"><p className="text-center text-muted-foreground">No verification logs available.</p></div>)}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Shop Audit Log</CardTitle>
            <CardDescription>Direct purchases from external vendors with invoice verification.</CardDescription>
          </CardHeader>
          <CardContent>
            {shopPurchases.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Inv #</TableHead><TableHead>Vendor</TableHead><TableHead>E-Way Bill</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {shopPurchases.map((purchase) => (
                    <TableRow key={purchase.receivedBillId}>
                      <TableCell className="font-medium">{purchase.invoiceNumber}</TableCell>
                      <TableCell>{purchase.vendorName}</TableCell>
                      <TableCell>{purchase.eWayBillNumber || 'N/A'}</TableCell>
                      <TableCell className="text-right font-bold">${purchase.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (<div className="flex items-center justify-center p-8"><p className="text-center text-muted-foreground">No shop audit records found.</p></div>)}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Audit Status: {selectedReceiptForUpdate?.receipt.receivedBillId}</DialogTitle>
            <DialogDescription>
              Confirming status change to <Badge variant={selectedReceiptForUpdate?.newStatus === 'Mismatch' ? 'destructive' : 'default'}>{selectedReceiptForUpdate?.newStatus}</Badge>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
              <Label htmlFor="update-remarks">Internal Audit Remarks</Label>
              <Textarea
                  id="update-remarks"
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                  placeholder="Justify status change for the record..."
              />
          </div>
          <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmStatusUpdate}>Confirm Audit Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isShopPreviewDialogOpen} onOpenChange={setIsShopPreviewDialogOpen}>
          <DialogContent className="max-w-4xl">
              <DialogHeader>
                  <DialogTitle>Final Audit Preview: External Purchase</DialogTitle>
                  <DialogDescription>Review mapped E-Way Bill and Invoice details before inventory entry.</DialogDescription>
              </DialogHeader>
              <Form {...previewForm}>
                  <form onSubmit={previewForm.handleSubmit(onGenerateFinalBill)} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-sm bg-secondary/10 p-4 rounded-lg">
                          <p><strong>Invoice #:</strong> {previewForm.getValues('invoiceNumber')}</p>
                          <p><strong>Vendor:</strong> {previewForm.getValues('vendorName')}</p>
                          <p><strong>E-Way Bill:</strong> {previewForm.getValues('eWayBillNumber') || 'N/A'}</p>
                          <p><strong>Vehicle:</strong> {previewForm.getValues('vehicleNumber') || 'N/A'}</p>
                      </div>
                      <div className="max-h-[40vh] overflow-y-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Material</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {previewFields.map((item, index) => {
                                  const quantity = previewForm.watch(`materials.${index}.quantity`);
                                  const rate = previewForm.watch(`materials.${index}.rate`);
                                  const amount = Number(quantity) * Number(rate);
                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell><Input readOnly disabled value={item.materialName} /></TableCell>
                                      <TableCell><FormField control={previewForm.control} name={`materials.${index}.unit`} render={({ field }) => (<FormItem><FormControl><Input placeholder="Unit" {...field}/></FormControl><FormMessage/></FormItem>)} /></TableCell>
                                      <TableCell><FormField control={previewForm.control} name={`materials.${index}.quantity`} render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="Qty" {...field}/></FormControl><FormMessage/></FormItem>)} /></TableCell>
                                      <TableCell><FormField control={previewForm.control} name={`materials.${index}.rate`} render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="Rate" {...field}/></FormControl><FormMessage/></FormItem>)} /></TableCell>
                                      <TableCell className="font-medium">${amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                  )
                                })}
                            </TableBody>
                        </Table>
                      </div>
                      <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsShopPreviewDialogOpen(false)}>Cancel</Button>
                          <Button type="submit">Approve & Generate Final Bill</Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}