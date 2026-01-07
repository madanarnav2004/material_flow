'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Trash, PackageCheck, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const materialReceiptSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required.'),
  issuingSite: z.string().min(1, 'Issuing site is required.'),
  materialName: z.string().min(1, 'Material name is required.'),
  issuedQuantity: z.coerce.number().min(0.1, 'Issued quantity must be > 0.'),
  receivedQuantity: z.coerce.number().min(0.1, 'Received quantity must be > 0.'),
  isDamaged: z.boolean().default(false),
  damageDescription: z.string().optional(),
  remarks: z.string().optional(),
});

type ReceiptFormValues = z.infer<typeof materialReceiptSchema>;

// Mock data
const pastReceipts = [
    { id: 'REC-001', requestId: 'REQ-002', material: 'Bricks', issued: 2000, received: 2000, status: 'Accepted', date: '2024-08-04' },
    { id: 'REC-002', requestId: 'REQ-001', material: 'Cement', issued: 50, received: 48, status: 'Mismatch', date: '2024-08-02', remarks: '2 bags damaged in transit.' },
    { id: 'REC-003', requestId: 'REQ-004', material: 'Steel Rebar', issued: 10, received: 10, status: 'Accepted', date: '2024-08-11' },
];

const sites = ['North Site', 'South Site', 'West Site', 'MAPI Store'];

export default function ReceiptsPage() {
  const { toast } = useToast();
  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(materialReceiptSchema),
    defaultValues: {
      requestId: 'REQ-005',
      issuingSite: 'North Site',
      materialName: 'Cement',
      issuedQuantity: 50,
      receivedQuantity: 50,
      isDamaged: false,
      damageDescription: '',
      remarks: '',
    },
  });

  function onSubmit(values: ReceiptFormValues) {
    console.log(values);
    let toastDescription = `Receipt for ${values.receivedQuantity} units of ${values.materialName} logged.`;
    if (values.issuedQuantity !== values.receivedQuantity) {
      toastDescription += ' Quantity mismatch detected.';
    }
    toast({
      title: 'Material Receipt Logged!',
      description: toastDescription,
    });
    form.reset();
  }

  const isDamaged = form.watch('isDamaged');

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Log Material Receipt</CardTitle>
          <CardDescription>Accept material deliveries and verify quantities against the issue ID.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="requestId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., REQ-005" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="issuingSite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issuing Site</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the issuing site" />
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
                  name="materialName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Cement" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                 <FormField
                    control={form.control}
                    name="issuedQuantity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Issued Quantity</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 50" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="receivedQuantity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Received Quantity</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 50" {...field} />
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

              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                <PackageCheck className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Logging...' : 'Log Receipt'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
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
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pastReceipts.map(rec => (
                        <TableRow key={rec.id}>
                            <TableCell className="font-medium">{rec.id}</TableCell>
                            <TableCell>{rec.requestId}</TableCell>
                            <TableCell>{rec.material}</TableCell>
                            <TableCell>{rec.issued}</TableCell>
                            <TableCell>{rec.received}</TableCell>
                            <TableCell>{rec.date}</TableCell>
                            <TableCell>
                                <Badge 
                                    variant={rec.status === 'Accepted' ? 'default' : 'destructive'}
                                    className={rec.status === 'Accepted' ? 'bg-green-600/80' : ''}
                                >
                                    {rec.status === 'Accepted' ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertTriangle className="mr-1 h-3 w-3" />}
                                    {rec.status}
                                </Badge>
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
