'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, PlusCircle, Trash, Upload } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { allMaterials } from '@/lib/mock-data';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';

const materialItemSchema = z.object({
  materialId: z.string().min(1, 'Please select a material.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  rate: z.coerce.number().min(0.01, 'Rate must be > 0.'),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
  vendorName: z.string().min(1, 'Vendor name is required.'),
  receivedDate: z.date({ required_error: 'The date the material was received is required.' }),
  materials: z.array(materialItemSchema).min(1, 'Please add at least one material.'),
  remarks: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function InvoicesPage() {
  const { toast } = useToast();
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      vendorName: '',
      materials: [{ materialId: '', quantity: 0, rate: 0 }],
      remarks: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  function onSubmit(values: InvoiceFormValues) {
    console.log(values);
    toast({
      title: 'Invoice Submitted!',
      description: `Invoice ${values.invoiceNumber} has been successfully uploaded.`,
    });
    form.reset();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Invoice</CardTitle>
          <CardDescription>Fill in the details below to upload a new material invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., INV-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Acme Suppliers" {...field} />
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
                      <FormLabel>Date Material Received</FormLabel>
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

              <div>
                <Label>Materials</Label>
                <div className="mt-2 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2">Material Name</TableHead>
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
                              name={`materials.${index}.materialId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a material" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {allMaterials.map(material => (
                                        <SelectItem key={material.id} value={material.id}>
                                          {material.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
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
                                    <Input type="number" placeholder="e.g., 12.50" {...field} />
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
                <div className="mt-2 flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ materialId: '', quantity: 0, rate: 0 })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Material
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/dashboard/materials">
                      Add New Material Type
                    </Link>
                  </Button>
                </div>
                <FormMessage>{form.formState.errors.materials?.message}</FormMessage>
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional comments..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                <Upload className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Uploading...' : 'Upload Invoice'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      {/* A list of previously uploaded invoices will be displayed here. */}
    </div>
  );
}
