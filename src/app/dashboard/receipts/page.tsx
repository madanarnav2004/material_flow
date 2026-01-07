'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PackageCheck, FileText, Download, Eye, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
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
import { useUser } from '@/hooks/use-user';
import { issuedMaterialsForReceipt } from '@/lib/mock-data';

const materialReceiptSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required.'),
  issuedId: z.string().min(1, 'Issued ID is required.'),
  issuingSite: z.string().min(1, 'Issuing site is required.'),
  receivingSite: z.string().min(1, 'Receiving site is required.'),
  materialName: z.string().min(1, 'Material name is required.'),
  issuedQuantity: z.coerce.number().min(0.1, 'Issued quantity must be > 0.'),
  receivedQuantity: z.coerce.number().min(0.1, 'Received quantity must be > 0.'),
  isDamaged: z.boolean().default(false),
  damageDescription: z.string().optional(),
  remarks: z.string().optional(),
  receivedDate: z.date({ required_error: 'Received date is required.' }),
});

type ReceiptFormValues = z.infer<typeof materialReceiptSchema>;

type MaterialReceivedBill = ReceiptFormValues & {
  receivedBillId: string;
  receiver: { name: string; email: string; } | null;
};


// Mock data
const pastReceipts: (MaterialReceivedBill & {status: string})[] = [
    { 
        receivedBillId: 'REC-20240804-001', 
        requestId: 'REQ-002', 
        issuedId: 'ISS-002',
        materialName: 'Bricks', 
        issuedQuantity: 2000, 
        receivedQuantity: 2000, 
        status: 'Accepted', 
        receivedDate: new Date('2024-08-04'),
        issuingSite: 'MAPI Store',
        receivingSite: 'West Site',
        receiver: { name: 'Leo Gomez', email: 'l.gomez@materialflow.com' },
        isDamaged: false,
    },
    { 
        receivedBillId: 'REC-20240802-001', 
        requestId: 'REQ-001',
        issuedId: 'ISS-001',
        materialName: 'Cement', 
        issuedQuantity: 50, 
        receivedQuantity: 48, 
        status: 'Mismatch', 
        receivedDate: new Date('2024-08-02'), 
        remarks: '2 bags damaged in transit.',
        issuingSite: 'MAPI Store',
        receivingSite: 'North Site',
        receiver: { name: 'Marcus Kane', email: 'm.kane@materialflow.com' },
        isDamaged: true,
        damageDescription: '2 bags were torn and cement spilled during transit.',
    },
    { 
        receivedBillId: 'REC-20240811-001', 
        requestId: 'REQ-004',
        issuedId: 'ISS-004',
        materialName: 'Steel Rebar', 
        issuedQuantity: 10, 
        receivedQuantity: 10, 
        status: 'Accepted', 
        receivedDate: new Date('2024-08-11'),
        issuingSite: 'South Site',
        receivingSite: 'North Site',
        receiver: { name: 'Marcus Kane', email: 'm.kane@materialflow.com' },
        isDamaged: false,
    },
];


const sites = ['North Site', 'South Site', 'West Site', 'MAPI Store'];

export default function ReceiptsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialReceivedBill | null>(null);

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(materialReceiptSchema),
    defaultValues: {
      requestId: '',
      issuedId: '',
      issuingSite: '',
      receivingSite: '',
      materialName: '',
      issuedQuantity: 0,
      receivedQuantity: 0,
      isDamaged: false,
      damageDescription: '',
      remarks: '',
    },
  });

  const handleRequestIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reqId = e.target.value;
    form.setValue('requestId', reqId);
    const issuedItem = issuedMaterialsForReceipt.find(item => item.requestId === reqId);
    
    if (issuedItem) {
        form.setValue('issuedId', issuedItem.issuedId);
        form.setValue('materialName', issuedItem.materialName);
        form.setValue('issuedQuantity', issuedItem.issuedQuantity);
        form.setValue('issuingSite', issuedItem.issuingSite);
        form.setValue('receivingSite', issuedItem.receivingSite);
        toast({
            title: 'Auto-filled!',
            description: 'Material details have been auto-filled from the Request ID.',
        });
    } else {
        // Optionally clear fields if no match is found
        form.setValue('issuedId', '');
        form.setValue('materialName', '');
        form.setValue('issuedQuantity', 0);
        form.setValue('issuingSite', '');
        form.setValue('receivingSite', '');
    }
  };

  function onSubmit(values: ReceiptFormValues) {
    console.log(values);
    
    const today = new Date();
    const datePart = format(today, 'yyyyMMdd');
    const countPart = Date.now().toString().slice(-3); // Mock count for demo
    const newBillId = `REC-${datePart}-${countPart}`;

    const bill: MaterialReceivedBill = {
      ...values,
      receivedBillId: newBillId,
      receiver: user,
    };
    setLastGeneratedBill(bill);

    let toastDescription = `Receipt for ${values.receivedQuantity} units of ${values.materialName} logged.`;
    if (values.issuedQuantity !== values.receivedQuantity) {
      toastDescription += ' Quantity mismatch detected.';
    }
    toast({
      title: 'Material Receipt Logged!',
      description: toastDescription,
    });
  }

  const handleViewBill = (receiptId: string) => {
    const bill = pastReceipts.find(r => r.receivedBillId === receiptId);
    if (bill) {
      setLastGeneratedBill(bill);
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
                <CardDescription>Accept material deliveries and verify quantities. Enter a Request ID to autofill details.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="requestId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Request ID</FormLabel>
                                <FormControl>
                                    <Input 
                                      placeholder="e.g., REQ-20240810-004" 
                                      {...field}
                                      onChange={handleRequestIdChange} 
                                      value={field.value}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="issuedId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Issued ID</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., ISS-20240810-004" {...field} readOnly />
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
                                 <Select onValueChange={field.onChange} value={field.value} disabled>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select issuing site" />
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
                        <FormField
                            control={form.control}
                            name="receivingSite"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Receiving Site</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value} disabled>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select receiving site" />
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
                    </div>

                    <div className="rounded-md border p-4 bg-secondary/20">
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
                             <FormControl>
                                    <Input type="date" {...field} value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} onChange={e => field.onChange(new Date(e.target.value))} />
                                </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />


                    <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                    <PackageCheck className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? 'Logging...' : 'Log Receipt & Generate Bill'}
                    </Button>
                </form>
                </Form>
            </CardContent>
            </Card>
        </div>
        {lastGeneratedBill && (
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText /> Material Received Bill
                        </CardTitle>
                        <CardDescription>
                            This is the generated bill for the received material.
                        </CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="space-y-2 rounded-lg border p-4">
                            <h3 className="font-semibold">Basic Details</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <p><strong>Receipt ID:</strong> {lastGeneratedBill.receivedBillId}</p>
                                <p><strong>Received Date:</strong> {lastGeneratedBill.receivedDate ? format(lastGeneratedBill.receivedDate, 'PPP') : 'N/A'}</p>
                                <p><strong>Receiving Site:</strong> {lastGeneratedBill.receivingSite}</p>
                                <p><strong>Receiver:</strong> {lastGeneratedBill.receiver?.name}</p>
                            </div>
                        </div>
                         <div className="space-y-2 rounded-lg border p-4">
                            <h3 className="font-semibold">Reference Details</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <p><strong>Linked Request ID:</strong> {lastGeneratedBill.requestId}</p>
                                <p><strong>Linked Issued ID:</strong> {lastGeneratedBill.issuedId}</p>
                            </div>
                        </div>
                        <div className="space-y-2 rounded-lg border p-4">
                            <h3 className="font-semibold">Material Verification</h3>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Material</TableHead>
                                        <TableHead>Issued</TableHead>
                                        <TableHead>Received</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>{lastGeneratedBill.materialName}</TableCell>
                                        <TableCell>{lastGeneratedBill.issuedQuantity}</TableCell>
                                        <TableCell>{lastGeneratedBill.receivedQuantity}</TableCell>
                                        <TableCell>
                                            <Badge variant={lastGeneratedBill.issuedQuantity === lastGeneratedBill.receivedQuantity ? 'default' : 'destructive'} className={lastGeneratedBill.issuedQuantity === lastGeneratedBill.receivedQuantity ? 'bg-green-600/80' : ''}>
                                                {lastGeneratedBill.issuedQuantity === lastGeneratedBill.receivedQuantity ? 'Accepted' : 'Mismatch'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                        
                        {lastGeneratedBill.isDamaged && (
                             <div className="space-y-2 rounded-lg border border-destructive/50 p-4">
                                <h3 className="font-semibold text-destructive">Damage Report</h3>
                                <p>{lastGeneratedBill.damageDescription}</p>
                             </div>
                        )}

                        {lastGeneratedBill.remarks && (
                            <div className="space-y-2">
                                <h3 className="font-semibold">Remarks</h3>
                                <p className="text-muted-foreground">{lastGeneratedBill.remarks}</p>
                            </div>
                        )}
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
                        <TableHead>Action</TableHead>
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
                                    variant={rec.status === 'Accepted' ? 'default' : 'destructive'}
                                    className={rec.status === 'Accepted' ? 'bg-green-600/80' : ''}
                                >
                                    {rec.status === 'Accepted' ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertTriangle className="mr-1 h-3 w-3" />}
                                    {rec.status}
                                </Badge>
                            </TableCell>
                             <TableCell>
                                <Button variant="outline" size="sm" onClick={() => handleViewBill(rec.receivedBillId)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Bill
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
