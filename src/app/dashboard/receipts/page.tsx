'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PackageCheck, FileText, Download, Eye, AlertTriangle, CheckCircle, HelpCircle, ChevronDown, CalendarIcon, FileDiff } from 'lucide-react';
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

const materialReceiptSchema = z.object({
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

type ReceiptFormValues = z.infer<typeof materialReceiptSchema>;

type ReceiptStatus = 'Accepted' | 'Mismatch' | 'Completed';

type MaterialReceivedBill = ReceiptFormValues & {
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

// Mock data - CLEARED
const initialPastReceipts: MaterialReceivedBill[] = [];

export default function ReceiptsPage() {
  const { toast } = useToast();
  const { issuedMaterials, requests } = useMaterialContext();
  const [pastReceipts, setPastReceipts] = React.useState<MaterialReceivedBill[]>(initialPastReceipts);
  const [activeBillDetails, setActiveBillDetails] = React.useState<FullBillDetails | null>(null);
  const billContentRef = React.useRef<HTMLDivElement>(null);

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(materialReceiptSchema),
    defaultValues: {
      issuedId: '',
      receiverName: '',
      receivedQuantity: 0,
      isDamaged: false,
      damageDescription: '',
      remarks: '',
      receivedDate: new Date(),
    },
  });

  const handleIssuedIdChange = (issuedId: string) => {
    form.setValue('issuedId', issuedId);
    const issuedItem = issuedMaterials.find(item => item.issuedId === issuedId);
    
    if (issuedItem) {
        form.setValue('requestId', issuedItem.requestId);
        form.setValue('materialName', issuedItem.materialName);
        form.setValue('issuedQuantity', issuedItem.issuedQuantity);
        form.setValue('issuingSite', issuedItem.issuingSite);
        form.setValue('receivingSite', issuedItem.receivingSite);
        form.setValue('receivedQuantity', issuedItem.issuedQuantity); // Pre-fill received with issued
        toast({
            title: 'Auto-filled!',
            description: 'Material details have been auto-filled from the Issued ID.',
        });
    } else {
        // Optionally clear fields if no match is found
        form.setValue('requestId', '');
        form.setValue('materialName', '');
        form.setValue('issuedQuantity', 0);
        form.setValue('issuingSite', '');
        form.setValue('receivingSite', '');
    }
  };

  function onSubmit(values: ReceiptFormValues) {
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


    let toastDescription = `Receipt for ${values.receivedQuantity} units of ${values.materialName} logged.`;
    if (status === 'Mismatch') {
      toastDescription += ' Quantity mismatch detected.';
    }
    toast({
      title: 'Material Receipt Logged!',
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

  const handleStatusChange = (receiptId: string, newStatus: ReceiptStatus) => {
    setPastReceipts(receipts => receipts.map(r => r.receivedBillId === receiptId ? { ...r, status: newStatus } : r));
    
    if (activeBillDetails?.receipt?.receivedBillId === receiptId) {
        setActiveBillDetails(prev => prev ? { ...prev, receipt: prev.receipt ? { ...prev.receipt, status: newStatus } : null } : null);
    }

    toast({
      title: 'Status Updated',
      description: `Receipt ${receiptId} has been marked as ${newStatus}.`,
    });
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

  const isDamaged = form.watch('isDamaged');

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
            <Card>
            <CardHeader>
                <CardTitle>Log Material Receipt</CardTitle>
                <CardDescription>Select a Material Issue ID to auto-fill details and log the received quantity.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="issuedId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Issued ID</FormLabel>
                                 <Select onValueChange={(value) => handleIssuedIdChange(value)} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select an Issued ID" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {issuedMaterials.map(item => (
                                        <SelectItem key={item.issuedId} value={item.issuedId}>
                                          {item.issuedId} ({item.materialName})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="requestId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Original Request ID</FormLabel>
                                <FormControl>
                                    <Input {...field} readOnly />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                         <FormField
                            control={form.control}
                            name="materialName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Material Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Cement" {...field} readOnly />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="issuedQuantity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Issued Quantity</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 50" {...field} readOnly />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="issuingSite"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Issuing Site</FormLabel>
                                 <FormControl>
                                     <Input placeholder="e.g., MAPI Store" {...field} readOnly />
                                 </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="receivingSite"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Receiving Site</FormLabel>
                                  <FormControl>
                                      <Input placeholder="e.g., North Site" {...field} readOnly />
                                  </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </div>
                     <FormField
                        control={form.control}
                        name="receiverName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Receiver Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Jane Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                    <div className="rounded-md border p-4 bg-secondary/20 space-y-4">
                        <FormField
                            control={form.control}
                            name="receivedQuantity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-base">Enter Received Quantity</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 50" {...field} className="bg-background text-lg"/>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="isDamaged"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Select
                                        onValueChange={(value) => field.onChange(value === 'true')}
                                        defaultValue={String(field.value)}
                                    >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Damage Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="false">No Damage</SelectItem>
                                        <SelectItem value="true">Damage Reported</SelectItem>
                                    </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormLabel className="font-normal flex items-center gap-1">
                                    Was the material damaged?
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Select 'Damage Reported' if any items were damaged in transit.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </FormLabel>
                                </FormItem>
                            )}
                            />

                        {isDamaged && (
                            <FormField
                            control={form.control}
                            name="damageDescription"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Damage Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="Describe the damage, e.g., '2 bags torn, cement spilled'"
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        )}
                    </div>

                    <FormField
                        control={form.control}
                        name="remarks"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Remarks (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Add any additional remarks about the receipt..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    
                    <FormField
                        control={form.control}
                        name="receivedDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Received Date</FormLabel>
                             <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={'outline'}
                                        className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                        >
                                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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


                    <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                    <PackageCheck className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? 'Logging...' : 'Log Receipt & Generate Final Bill'}
                    </Button>
                </form>
                </Form>
            </CardContent>
            </Card>
        </div>
        {activeBillDetails && (
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileDiff /> Bill Checking Process
                        </CardTitle>
                        <CardDescription>
                            Comparing Request, Issued, and Received bills.
                        </CardDescription>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => handleDownload(activeBillDetails.receipt?.receivedBillId ?? 'bill')}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </CardHeader>
                    <CardContent ref={billContentRef} className="space-y-6 text-sm">
                        
                        {/* Status Summary */}
                        <div className="rounded-lg border p-4 space-y-2">
                            <h3 className="font-semibold text-base">Verification Status</h3>
                            {activeBillDetails.receipt?.status === 'Mismatch' ? (
                                <div className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-5 w-5" />
                                    <p className="font-semibold">Query: Mismatch in quantities.</p>
                                </div>
                            ) : activeBillDetails.receipt?.status === 'Completed' ? (
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <p className="font-semibold">Process Completed: All bills match.</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-blue-600">
                                    <HelpCircle className="h-5 w-5" />
                                    <p className="font-semibold">Process Pending: Verification required.</p>
                                </div>
                            )}
                        </div>

                        {/* Request Bill */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-base text-muted-foreground">1. Material Request Bill</h3>
                            <div className="rounded-lg border p-4 space-y-2">
                                <p><strong>Request ID:</strong> {activeBillDetails.request?.id}</p>
                                <p><strong>Requesting Site:</strong> {activeBillDetails.request?.site}</p>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span>{activeBillDetails.request?.material}</span>
                                    <span className="font-bold text-lg">{activeBillDetails.request?.quantity} units</span>
                                </div>
                            </div>
                        </div>

                        {/* Issued Bill */}
                        <div className="space-y-2">
                             <h3 className="font-semibold text-base text-muted-foreground">2. Material Issued Bill</h3>
                            <div className="rounded-lg border p-4 space-y-2">
                                <p><strong>Issued ID:</strong> {activeBillDetails.issue?.issuedId}</p>
                                <p><strong>Issuing Site:</strong> {activeBillDetails.issue?.issuingSite}</p>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span>{activeBillDetails.issue?.materialName}</span>
                                    <span className="font-bold text-lg">{activeBillDetails.issue?.issuedQuantity} units</span>
                                </div>
                            </div>
                        </div>

                        {/* Received Bill */}
                         <div className="space-y-2">
                             <h3 className="font-semibold text-base text-muted-foreground">3. Final Material Received Bill</h3>
                            <div className="rounded-lg border p-4 space-y-2 bg-secondary/30">
                                <p><strong>Receipt ID:</strong> {activeBillDetails.receipt?.receivedBillId}</p>
                                <p><strong>Receiver:</strong> {activeBillDetails.receipt?.receiver?.name}</p>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span>{activeBillDetails.receipt?.materialName}</span>
                                    <span className={cn("font-bold text-xl", activeBillDetails.receipt?.status === 'Mismatch' && 'text-destructive')}>{activeBillDetails.receipt?.receivedQuantity} units</span>
                                </div>
                                 {activeBillDetails.receipt?.remarks && <p className="text-xs text-muted-foreground pt-2"><strong>Remarks:</strong> {activeBillDetails.receipt.remarks}</p>}
                            </div>
                        </div>
                        
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Past Material Receipts</CardTitle>
            <CardDescription>A log of recently verified material receipts.</CardDescription>
        </CardHeader>
        <CardContent>
            {pastReceipts.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Receipt ID</TableHead>
                            <TableHead>Request ID</TableHead>
                            <TableHead>Material</TableHead>
                            <TableHead>Issued</TableHead>
                            <TableHead>Received</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pastReceipts.map(rec => (
                            <TableRow key={rec.receivedBillId}>
                                <TableCell className="font-medium">{rec.receivedBillId}</TableCell>
                                <TableCell>{rec.requestId}</TableCell>
                                <TableCell>{rec.materialName}</TableCell>
                                <TableCell>{rec.issuedQuantity}</TableCell>
                                <TableCell>{rec.receivedQuantity}</TableCell>
                                <TableCell>{format(rec.receivedDate, 'yyyy-MM-dd')}</TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={rec.status === 'Accepted' ? 'default' : rec.status === 'Completed' ? 'outline' : 'destructive'}
                                        className={cn(
                                            rec.status === 'Accepted' && 'bg-green-600/80',
                                            rec.status === 'Completed' && 'border-green-600 text-green-600'
                                            )}
                                    >
                                        {rec.status === 'Accepted' ? <CheckCircle className="mr-1 h-3 w-3" /> : rec.status === 'Mismatch' ? <AlertTriangle className="mr-1 h-3 w-3" /> : null}
                                        {rec.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleViewBill(rec.receivedBillId)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Check Bill
                                    </Button>
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                        Update Status <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleStatusChange(rec.receivedBillId, 'Accepted')}>Accepted</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(rec.receivedBillId, 'Mismatch')}>Mismatch</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(rec.receivedBillId, 'Completed')}>Mark as Completed</DropdownMenuItem>
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="flex items-center justify-center p-8">
                    <p className="text-center text-muted-foreground">No receipts logged yet.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
