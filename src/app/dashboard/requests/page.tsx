'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, PlusCircle, Trash, Send } from 'lucide-react';
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
import { materialReturnReminders } from '@/lib/mock-data';

const materialItemSchema = z.object({
  materialName: z.string().min(1, 'Material name is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
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

// Mock data for sites
const sites = ['North Site', 'South Site', 'West Site', 'MAPI Store'];

export default function RequestsPage() {
  const { toast } = useToast();
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requestingSite: '',
      issuingSite: '',
      materials: [{ materialName: '', quantity: 1 }],
      remarks: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  function onSubmit(values: RequestFormValues) {
    console.log(values);
    toast({
      title: 'Request Submitted!',
      description: `Your material request has been sent to ${values.issuingSite}.`,
    });
    form.reset();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Material Request</CardTitle>
          <CardDescription>Fill in the details to request materials from another site or the MAPI store.</CardDescription>
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
                        <TableHead className="w-4/6">Material Name</TableHead>
                        <TableHead>Quantity</TableHead>
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
                                    <Input placeholder="e.g., Cement, Steel Rebar" {...field} />
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
                    onClick={() => append({ materialName: '', quantity: 1 })}
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
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Recent Material Requests</CardTitle>
            <CardDescription>A log of the most recent requests across all sites.</CardDescription>
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
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {materialReturnReminders.map(req => (
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
                                        req.status === 'Extended' && 'border-amber-500/50 text-amber-500'
                                    )}
                                >
                                    {req.status}
                                </Badge>
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
