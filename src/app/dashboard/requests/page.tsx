'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, PlusCircle, Trash, Send, FileText, Eye, Download, Check, X, ChevronDown } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { materialReturnReminders as initialRequests } from '@/lib/mock-data';
import { useUser } from '@/hooks/use-user';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const materialItemSchema = z.object({
  materialName: z.string().min(1, 'Material name is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  rate: z.coerce.number().min(0.01, 'Rate is required.'),
});

const requestSchema = z.object({
  requestingSite: z.string().min(1, 'Requesting site is required.'),
  issuingSite: z.string().min(1, 'Issuing site is required.'),
  materials: z.array(materialItemSchema).min(1, 'Please add at least one material.'),
  requiredPeriod: z.object({
    from: z.date({ required_error: 'Start date is required.' }),
    to: z.date({ required_error: 'Return date is required.' }),
  }),
  remarks: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;
type MaterialRequestBill = RequestFormValues & {
  requestId: string;
  requestDate: Date;
  issuedId: string;
  shiftingDate: Date;
  requester: { name: string; email: string; } | null;
  totalValue: number;
}
type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Issued' | 'Completed' | 'Mismatch' | 'Extended';


// Mock data for sites
const sites = ['North Site', 'South Site', 'West Site', 'MAPI Store'];

export default function RequestsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialRequestBill | null>(null);
  const [requests, setRequests] = React.useState(initialRequests);


  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requestingSite: '',
      issuingSite: '',
      materials: [{ materialName: '', quantity: 1, rate: 10 }],
      remarks: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  function onSubmit(values: RequestFormValues) {
    console.log(values);
    
    const totalValue = values.materials.reduce((acc, item) => acc + item.quantity * item.rate, 0);
    const today = new Date();
    const datePart = format(today, 'yyyyMMdd');
    const countPart = (requests.length + 1).toString().padStart(3, '0');

    const newRequestId = `REQ-${datePart}-${countPart}`;
    const newIssuedId = `ISS-${datePart}-${countPart}`;

    const bill: MaterialRequestBill = {
      ...values,
      requestId: newRequestId,
      requestDate: new Date(),
      issuedId: newIssuedId,
      shiftingDate: new Date(), // Assuming shifting happens immediately on approval
      requester: user,
      totalValue,
    };
    
    setLastGeneratedBill(bill);

    // Add to mock requests list
    const newRequestEntry = {
      id: newRequestId,
      material: values.materials.map(m => m.materialName).join(', '),
      quantity: values.materials.reduce((acc, m) => acc + m.quantity, 0),
      site: values.requestingSite,
      status: 'Pending',
      returnDate: format(values.requiredPeriod.to, 'yyyy-MM-dd'),
    };
    setRequests(prev => [newRequestEntry, ...prev]);

    toast({
      title: 'Request Submitted!',
      description: `Your material request has been sent to ${values.issuingSite}. A Material Request Bill will be generated upon approval.`,
    });
  }

  const handleViewBill = (reqId: string) => {
    const request = requests.find(r => r.id === reqId);
    if (request) {
      const returnDate = new Date(request.returnDate);
      const fromDate = new Date(returnDate.getTime() - 10 * 24 * 60 * 60 * 1000);
      const requestDate = new Date(returnDate.getTime() - 11 * 24 * 60 * 60 * 1000);
      const datePart = format(requestDate, 'yyyyMMdd');
      const countPart = request.id.slice(-3);

      const bill: MaterialRequestBill = {
        requestId: `REQ-${datePart}-${countPart}`,
        requestDate: requestDate,
        requestingSite: request.site,
        issuingSite: 'MAPI Store', // Mock issuing site
        materials: [{ materialName: request.material, quantity: request.quantity, rate: 10 }], // Mock rate
        requiredPeriod: { from: fromDate, to: returnDate },
        remarks: `This is a sample bill for request ${request.id}`,
        issuedId: `ISS-${datePart}-${countPart}`,
        shiftingDate: new Date(returnDate.getTime() - 9 * 24 * 60 * 60 * 1000),
        requester: user,
        totalValue: request.quantity * 10, // Mock total value
      };
      setLastGeneratedBill(bill);
    }
  };
  
  const handleStatusChange = (reqId: string, newStatus: RequestStatus) => {
    setRequests(requests.map(req => req.id === reqId ? { ...req, status: newStatus } : req));
    toast({
      title: `Request ${newStatus}`,
      description: `Request ID ${reqId} has been marked as ${newStatus}.`,
    });
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Create Material Request</CardTitle>
              <CardDescription>Fill in the details to request materials. A Material Request Bill will be generated automatically upon approval and issue.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="requestingSite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Site (Requesting From)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your site" />
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
                      name="issuingSite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Request To (Issuing Site)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select issuing site/store" />
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
                  
                  <div>
                    <Label>Materials</Label>
                    <div className="mt-2 rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-2/5">Material Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Rate</TableHead>
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
                                      <FormControl>
                                        <Input placeholder="e.g., Cement" {...field} />
                                      </FormControl>
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
                                    <FormItem>
                                      <FormControl>
                                        <Input type="number" placeholder="e.g., 100" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`materials.${index}.rate`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input type="number" placeholder="e.g., 10" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
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
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ materialName: '', quantity: 1, rate: 10 })}
                        className="mt-2"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Another Material
                      </Button>
                    <FormMessage>{form.formState.errors.materials?.message}</FormMessage>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="requiredPeriod.from"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Required From (Start Date)</FormLabel>
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
                    <FormField
                        control={form.control}
                        name="requiredPeriod.to"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Required Until (Return Date)</FormLabel>
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
                  </div>

                  <FormField
                      control={form.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remarks (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Add any additional instructions or justifications..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                    <Send className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? 'Submitting...' : 'Submit Request & Generate Bill'}
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
                    <FileText /> Material Request Bill
                  </CardTitle>
                  <CardDescription>
                    This is the generated bill for your request. It's created automatically upon approval and issue.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 rounded-lg border p-4">
                  <h3 className="font-semibold">Request Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Request ID:</strong> {lastGeneratedBill.requestId}</p>
                    <p><strong>Request Date:</strong> {format(lastGeneratedBill.requestDate, 'PPP')}</p>
                    <p><strong>Requesting Site:</strong> {lastGeneratedBill.requestingSite}</p>
                    <p><strong>Requester:</strong> {lastGeneratedBill.requester?.name}</p>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border p-4">
                  <h3 className="font-semibold">Issue Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Issuing Site:</strong> {lastGeneratedBill.issuingSite}</p>
                    <p><strong>Issued ID:</strong> {lastGeneratedBill.issuedId}</p>
                    <p><strong>Shifting Date:</strong> {format(lastGeneratedBill.shiftingDate, 'PPP')}</p>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border p-4">
                  <h3 className="font-semibold">Usage Period</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Start Date:</strong> {format(lastGeneratedBill.requiredPeriod.from, 'PPP')}</p>
                    <p><strong>End Date:</strong> {format(lastGeneratedBill.requiredPeriod.to, 'PPP')}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Material Details</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lastGeneratedBill.materials.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell>{m.materialName}</TableCell>
                          <TableCell>{m.quantity}</TableCell>
                          <TableCell>${m.rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${(m.quantity * m.rate).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Separator />
                  <div className="flex justify-end font-bold text-lg">
                      Total Value: ${lastGeneratedBill.totalValue.toFixed(2)}
                  </div>
                </div>
                 {lastGeneratedBill.remarks && (
                    <div className="space-y-2">
                        <h3 className="font-semibold">Remarks</h3>
                        <p className="text-sm text-muted-foreground">{lastGeneratedBill.remarks}</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Recent Material Requests</CardTitle>
            <CardDescription>A log of the most recent requests and their statuses, which become Material Request Bills upon approval.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Return Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map(req => (
                        <TableRow key={req.id}>
                            <TableCell className="font-medium">{req.id}</TableCell>
                            <TableCell>{req.material}</TableCell>
                            <TableCell>{req.quantity}</TableCell>
                            <TableCell>{req.site}</TableCell>
                            <TableCell>{req.returnDate}</TableCell>
                            <TableCell>
                                <Badge 
                                    variant={
                                        req.status === 'Pending' ? 'secondary' : 
                                        req.status === 'Approved' ? 'default' :
                                        req.status === 'Issued' ? 'default' :
                                        req.status === 'Completed' ? 'outline' :
                                        'destructive'
                                    }
                                    className={cn(
                                        req.status === 'Approved' && 'bg-blue-500/80 text-white',
                                        req.status === 'Issued' && 'bg-green-600/80 text-white',
                                        req.status === 'Extended' && 'border-amber-500/50 text-amber-500',
                                        req.status === 'Mismatch' && 'bg-orange-500/80 text-white'
                                    )}
                                >
                                    {req.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewBill(req.id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Bill
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      Update Status <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Approved')}>Approved</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Rejected')}>Rejected</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Issued')}>Issued</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Completed')}>Completed</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Mismatch')}>Mismatch</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
