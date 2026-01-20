'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, PlusCircle, Trash, Send, FileText, Eye, Download } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMaterialContext, type IndentStatus } from '@/context/material-context';
import { useUser } from '@/hooks/use-user';

const materialItemSchema = z.object({
  materialName: z.string().min(1, 'Material name is required.'),
  unit: z.string().min(1, 'Unit is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  remarks: z.string().optional(),
});

const requestSchema = z.object({
  requestId: z.string(),
  requesterName: z.string().min(2, 'Requester name is required.'),
  requestingSite: z.string().min(1, 'Requesting site is required.'),
  materials: z.array(materialItemSchema).min(1, 'Please add at least one material.'),
  requiredPeriod: z.object({
    from: z.date({ required_error: 'Start date is required.' }),
    to: z.date({ required_error: 'Return date is required.' }),
  }),
  remarks: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;
type MaterialIndentBill = RequestFormValues & {
  requestDate: Date;
  issuedId: string;
  shiftingDate: Date;
  requester: { name: string; } | null;
  totalValue: number;
  issuingSite?: string;
}

const generateRequestId = (siteName: string, count: number) => {
    const today = new Date();
    const datePart = format(today, 'yyyyMMdd');
    const countPart = (count + 1).toString().padStart(3, '0');
    const siteCode = siteName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    return `REQ-${siteCode}-${datePart}-${countPart}`;
}

export default function RequestsPage() {
  const { toast } = useToast();
  const { user, site, role } = useUser();
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialIndentBill | null>(null);
  const { requests, setRequests } = useMaterialContext();
  const billContentRef = React.useRef<HTMLDivElement>(null);

  const isSiteManager = role === 'site-manager';

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requestId: '',
      requesterName: user?.name || '',
      requestingSite: isSiteManager && site ? site : '',
      materials: [{ materialName: '', unit: '', quantity: 1, remarks: '' }],
      remarks: '',
    },
  });

  const requestingSite = form.watch('requestingSite');

  React.useEffect(() => {
    if (requestingSite) {
        form.setValue('requestId', generateRequestId(requestingSite, requests.length));
    } else {
        form.setValue('requestId', '');
    }
  }, [requestingSite, requests.length, form]);

  React.useEffect(() => {
    if (isSiteManager && site) {
      form.setValue('requestingSite', site);
    }
    if (user) {
      form.setValue('requesterName', user.name);
    }
  }, [isSiteManager, site, user, form]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  function onSubmit(values: RequestFormValues) {
    const totalValue = 0; 
    const idParts = values.requestId.split('-');
    const datePart = idParts.length > 2 ? idParts[2] : format(new Date(), 'yyyyMMdd');
    const countPart = idParts.length > 3 ? idParts[3] : (requests.length + 1).toString().padStart(3, '0');

    const newIssuedId = `ISS-${idParts[1]}-${datePart}-${countPart}`;

    const bill: MaterialIndentBill = {
      ...values,
      requestDate: new Date(),
      issuedId: newIssuedId,
      shiftingDate: new Date(),
      requester: { name: values.requesterName },
      totalValue,
      issuingSite: "Pending Assignment",
    };
    
    setLastGeneratedBill(bill);

    const newRequestEntry = {
      id: values.requestId,
      material: values.materials.map(m => m.materialName).join(', '),
      quantity: values.materials.reduce((acc, m) => acc + m.quantity, 0),
      site: values.requestingSite,
      status: 'Pending Director Approval' as IndentStatus,
      returnDate: format(values.requiredPeriod.to, 'yyyy-MM-dd'),
    };
    setRequests(prev => [newRequestEntry, ...prev]);

    toast({
      title: 'Indent Submitted!',
      description: `Your material indent has been sent for processing.`,
    });
    
    form.reset({
      requestId: '',
      requesterName: user?.name || '',
      requestingSite: isSiteManager && site ? site : '',
      materials: [{ materialName: '', unit: '', quantity: 1, remarks: '' }],
      remarks: '',
    });
  }

  const handleViewBill = (reqId: string) => {
    const request = requests.find(r => r.id === reqId);
    if (request) {
      const returnDate = new Date(request.returnDate);
      const fromDate = new Date(returnDate.getTime() - 10 * 24 * 60 * 60 * 1000);
      const requestDate = new Date(returnDate.getTime() - 11 * 24 * 60 * 60 * 1000);
      
      const idParts = request.id.split('-');
      const datePart = idParts.length > 2 ? idParts[2] : format(requestDate, 'yyyyMMdd');
      const countPart = idParts.length > 3 ? idParts[3] : request.id.slice(-3);
      const siteCode = idParts.length > 1 ? idParts[1] : 'SITE';


      const bill: MaterialIndentBill = {
        requestId: `REQ-${siteCode}-${datePart}-${countPart}`,
        requestDate: requestDate,
        requesterName: 'Sample Requester',
        requestingSite: request.site,
        materials: [{ materialName: request.material, unit: 'unit', quantity: request.quantity, remarks: '' }], // Mock unit
        requiredPeriod: { from: fromDate, to: returnDate },
        remarks: `This is a sample bill for request ${request.id}`,
        issuedId: `ISS-${siteCode}-${datePart}-${countPart}`,
        shiftingDate: new Date(returnDate.getTime() - 9 * 24 * 60 * 60 * 1000),
        requester: { name: 'Sample Requester' },
        totalValue: 0, // No rate, so no value
        issuingSite: request.issuingSite || 'Pending Assignment',
      };
      setLastGeneratedBill(bill);
    }
  };
  
  const handleDownload = (billId: string) => {
    if (billContentRef.current) {
      const billHtml = billContentRef.current.innerHTML;
      const blob = new Blob([`<html><head><title>${billId}</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}.grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.font-semibold{font-weight:600}</style></head><body>${billHtml}</body></html>`], { type: 'text/html' });
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


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Create Material Indent</CardTitle>
              <CardDescription>Fill in the details to request materials. The Purchase Department will assign an issuing site.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="requestingSite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requesting Site</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSiteManager}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a site" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="North Site">North Site</SelectItem>
                              <SelectItem value="South Site">South Site</SelectItem>
                              <SelectItem value="West Site">West Site</SelectItem>
                              <SelectItem value="East Site">East Site</SelectItem>
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
                          <FormLabel>Indent ID</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                      control={form.control}
                      name="requesterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requester Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., John Doe" {...field} readOnly={!!user?.name}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                  <div>
                    <Label>Materials</Label>
                    <div className="mt-2 rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-2/5">Material Name</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Remarks</TableHead>
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
                                  name={`materials.${index}.unit`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input placeholder="e.g., bag" {...field} />
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
                                  name={`materials.${index}.remarks`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input placeholder="Optional" {...field} />
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
                        onClick={() => append({ materialName: '', unit: '', quantity: 1, remarks: '' })}
                        className="mt-4"
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
                    {form.formState.isSubmitting ? 'Submitting...' : 'Submit Indent'}
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
                    <FileText /> Material Indent Bill
                  </CardTitle>
                  <CardDescription>
                    This is the generated bill for your indent.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload(lastGeneratedBill.requestId)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardHeader>
              <CardContent ref={billContentRef} className="space-y-4">
                <div className="space-y-2 rounded-lg border p-4">
                  <h3 className="font-semibold">Indent Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Indent ID:</strong> {lastGeneratedBill.requestId}</p>
                    <p><strong>Indent Date:</strong> {format(lastGeneratedBill.requestDate, 'PPP')}</p>
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
                        <TableHead>Unit</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lastGeneratedBill.materials.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell>{m.materialName}</TableCell>
                          <TableCell>{m.unit}</TableCell>
                          <TableCell>{m.quantity}</TableCell>
                          <TableCell>{m.remarks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
            <CardTitle>Recent Material Indents</CardTitle>
            <CardDescription>A log of the most recent indents and their statuses, which become Material Indent Bills upon approval.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Indent ID</TableHead>
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
                                        req.status === 'Director Rejected' || req.status === 'Purchase Rejected' ? 'destructive' :
                                        req.status === 'Completed' ? 'outline' :
                                        'default'
                                    }
                                    className={cn(
                                        req.status === 'Pending Director Approval' && 'bg-yellow-500/80',
                                        req.status === 'Director Approved' && 'bg-blue-500/80',
                                        req.status === 'Issued' && 'bg-green-600/80',
                                        req.status === 'PO Generated' && 'bg-purple-500/80',
                                        req.status === 'Partially Issued' && 'bg-orange-500/80',
                                        (req.status === 'Director Rejected' || req.status === 'Purchase Rejected') && 'bg-destructive'
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
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            ) : (
                <div className="flex items-center justify-center p-8">
                    <p className="text-center text-muted-foreground">No indents submitted yet.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
