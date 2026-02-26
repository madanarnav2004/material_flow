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
import { useMaterialContext, type IndentStatus, MaterialIndent, MaterialIndentBill } from '@/context/material-context';
import { useUser } from '@/hooks/use-user';
import { mockBoqData } from '@/lib/mock-data';

const materialItemSchema = z.object({
  materialName: z.string().min(1, 'Material name is required.'),
  unit: z.string().min(1, 'Unit is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  remarks: z.string().optional(),
  rate: z.coerce.number().optional(),
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
  const canViewCost = role === 'director' || role === 'coordinator' || role === 'purchase-department';

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requestId: '',
      requesterName: user?.name || '',
      requestingSite: isSiteManager && site ? site : '',
      materials: [{ materialName: '', unit: '', quantity: 1, remarks: '', rate: 0 }],
      remarks: '',
    },
  });
  
  const materials = form.watch('materials');

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'materials',
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

  function onSubmit(values: RequestFormValues) {
    const totalValue = values.materials.reduce((acc, m) => acc + (m.quantity * (m.rate || 0)), 0);
    const idParts = values.requestId.split('-');
    const datePart = idParts.length > 2 ? idParts[2] : format(new Date(), 'yyyyMMdd');
    const countPart = idParts.length > 3 ? idParts[3] : (requests.length + 1).toString().padStart(3, '0');

    const newIssuedId = `ISS-${idParts[1]}-${datePart}-${countPart}`;

    const newIndent: MaterialIndent = {
        ...values,
        id: values.requestId,
        status: 'Pending Director Approval',
        requestDate: new Date().toISOString(),
        requiredPeriod: {
            from: values.requiredPeriod.from.toISOString(),
            to: values.requiredPeriod.to.toISOString(),
        }
    };

    setRequests(prev => [newIndent, ...prev]);

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

    toast({
      title: 'Indent Submitted Successfully!',
      description: `Indent ${values.requestId} is now awaiting Director approval.`,
    });
    
    form.reset({
      requestId: '',
      requesterName: user?.name || '',
      requestingSite: isSiteManager && site ? site : '',
      materials: [{ materialName: '', unit: '', quantity: 1, remarks: '', rate: 0 }],
      remarks: '',
    });
  }

  const handleViewBill = (reqId: string) => {
    const request = requests.find(r => r.id === reqId);
    if (request) {
      const bill: MaterialIndentBill = {
        ...request,
        requestId: request.id,
        requestDate: new Date(request.requestDate),
        requiredPeriod: {
            from: new Date(request.requiredPeriod.from),
            to: new Date(request.requiredPeriod.to),
        },
        issuedId: request.issuedId || `ISS-${request.id.substring(4)}`,
        shiftingDate: new Date(),
        requester: { name: request.requesterName },
        totalValue: request.materials.reduce((acc, m) => acc + m.quantity * (m.rate || 0), 0),
      };
      setLastGeneratedBill(bill);
    }
  };
  
  const handleDownload = (billId: string) => {
    if (billContentRef.current) {
      const billHtml = billContentRef.current.innerHTML;
      const blob = new Blob([`<html><head><title>${billId}</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}.font-semibold{font-weight:600}</style></head><body>${billHtml}</body></html>`], { type: 'text/html' });
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
        description: `Material Indent Bill ${billId} generated.`,
      });
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Submit Material Indent</CardTitle>
              <CardDescription>Fill in required materials. Requires Director approval before site assignment.</CardDescription>
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
                          <FormLabel>Source Site</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSiteManager}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select site" />
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
                          <FormLabel>Auto-Generated ID</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly disabled className="bg-muted font-mono" />
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
                          <FormLabel>Requester Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter name" {...field} readOnly={!!user?.name}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                  <div>
                    <Label className="text-primary font-bold">Materials List</Label>
                    <div className="mt-2 rounded-md border">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-2/5">Material</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Qty</TableHead>
                            {canViewCost && <TableHead>Rate</TableHead>}
                            {canViewCost && <TableHead>Amount</TableHead>}
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField control={form.control} name={`materials.${index}.materialName`} render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="Material" {...field} /></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                              </TableCell>
                               <TableCell>
                                <FormField control={form.control} name={`materials.${index}.unit`} render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="bag" {...field} /></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField control={form.control} name={`materials.${index}.quantity`} render={({ field }) => (
                                    <FormItem><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                              </TableCell>
                              {canViewCost && (
                                <TableCell>
                                    <FormField control={form.control} name={`materials.${index}.rate`} render={({ field }) => (
                                      <FormItem><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </TableCell>
                              )}
                              {canViewCost && (
                                <TableCell>
                                  <p className="font-bold text-primary">${(materials?.[index]?.quantity * (materials?.[index]?.rate || 0)).toFixed(2)}</p>
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
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ materialName: '', unit: '', quantity: 1, remarks: '', rate: 0 })} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Material Item
                      </Button>
                    <FormMessage className="mt-2">{form.formState.errors.materials?.message}</FormMessage>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="requiredPeriod.from"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Required From</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                    {field.value ? format(field.value, 'PPP') : <span>Pick start date</span>}
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
                                    <Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                    {field.value ? format(field.value, 'PPP') : <span>Pick end date</span>}
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
                          <FormLabel>Indent Justification / Remarks</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Explain why these materials are needed..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                    <Send className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? 'Processing Indent...' : 'Submit Official Indent'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
            {lastGeneratedBill ? (
                <Card className="border-primary/20 shadow-lg">
                <CardHeader className="flex flex-row items-start justify-between bg-primary/5 rounded-t-lg">
                    <div>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="text-primary" /> Material Indent Bill
                    </CardTitle>
                    <CardDescription>
                        Consolidated request for site materials.
                    </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(lastGeneratedBill.requestId)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                    </Button>
                </CardHeader>
                <CardContent ref={billContentRef} className="space-y-4 py-6">
                    <div className="space-y-2 rounded-lg border p-4 bg-secondary/10">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Request Headers</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>Indent ID:</strong> {lastGeneratedBill.requestId}</p>
                        <p><strong>Indent Date:</strong> {format(lastGeneratedBill.requestDate, 'PPP')}</p>
                        <p><strong>Source Site:</strong> {lastGeneratedBill.requestingSite}</p>
                        <p><strong>Requester:</strong> {lastGeneratedBill.requester?.name}</p>
                    </div>
                    </div>
                    <div className="space-y-2 rounded-lg border p-4 bg-secondary/10">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Logistics Planning</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>Issuing Site:</strong> {lastGeneratedBill.issuingSite}</p>
                        <p><strong>Issued ID:</strong> {lastGeneratedBill.issuedId}</p>
                        <p><strong>Planned Shift:</strong> {format(lastGeneratedBill.shiftingDate, 'PPP')}</p>
                    </div>
                    </div>
                    <div className="space-y-2">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Material Line Items</h3>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="text-[10px]">Material</TableHead>
                            <TableHead className="text-[10px]">Qty</TableHead>
                            {canViewCost && <TableHead className="text-[10px]">Rate</TableHead>}
                            {canViewCost && <TableHead className="text-right text-[10px]">Amount</TableHead>}
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {lastGeneratedBill.materials.map((m, i) => (
                            <TableRow key={i}>
                            <TableCell className="text-xs">{m.materialName} ({m.unit})</TableCell>
                            <TableCell className="text-xs font-bold">{m.quantity}</TableCell>
                            {canViewCost && <TableCell className="text-xs">${(m.rate || 0).toFixed(2)}</TableCell>}
                            {canViewCost && <TableCell className="text-right text-xs font-bold">${(m.quantity * (m.rate || 0)).toFixed(2)}</TableCell>}
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    {canViewCost && (
                        <>
                        <Separator className="my-2"/>
                        <div className="text-right">
                            <p className="text-[10px] uppercase text-muted-foreground">Total Taxable Value</p>
                            <p className="text-2xl font-black text-primary">${lastGeneratedBill.totalValue.toFixed(2)}</p>
                        </div>
                        </>
                    )}
                    </div>
                    {lastGeneratedBill.remarks && (
                        <div className="space-y-1 mt-4 p-3 border rounded bg-muted/20">
                            <h3 className="font-bold text-[10px] uppercase text-muted-foreground">Justification</h3>
                            <p className="text-xs italic text-muted-foreground">"{lastGeneratedBill.remarks}"</p>
                        </div>
                    )}
                </CardContent>
                </Card>
            ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/30 p-12 text-center">
                    <div className="space-y-2">
                        <FileText className="h-12 w-12 mx-auto opacity-20" />
                        <p className="text-muted-foreground text-sm">Select an indent from the list below or create a new one to view the official bill document.</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Material Indent Ledger</CardTitle>
            <CardDescription>Track all submitted requests and their real-time verification status.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Indent ID</TableHead>
                        <TableHead>Material Details</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Audit Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map(req => (
                        <TableRow key={req.id}>
                            <TableCell className="font-bold text-xs">{req.id}</TableCell>
                            <TableCell className="text-xs">{req.materials.map(m => m.materialName).join(', ')}</TableCell>
                            <TableCell className="text-xs">{req.materials.reduce((acc, m) => acc + m.quantity, 0)}</TableCell>
                            <TableCell className="text-xs">{req.requestingSite}</TableCell>
                            <TableCell className="text-xs">{format(new Date(req.requiredPeriod.to), 'dd MMM yyyy')}</TableCell>
                            <TableCell>
                                <Badge 
                                    variant={
                                        req.status === 'Director Rejected' || req.status === 'Purchase Rejected' ? 'destructive' :
                                        req.status === 'Completed' ? 'outline' :
                                        'default'
                                    }
                                    className={cn(
                                        "text-[10px] uppercase font-bold",
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
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" className="h-8" onClick={() => handleViewBill(req.id)}>
                                    <Eye className="mr-2 h-3 w-3" />
                                    View Bill
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            ) : (
                <div className="flex items-center justify-center p-12 bg-muted/20 rounded-lg border-2 border-dashed">
                    <p className="text-center text-muted-foreground text-sm">The indent ledger is empty. Start by submitting a material request.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}