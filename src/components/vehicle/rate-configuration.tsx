'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, PlusCircle, Save, Trash } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '../ui/label';

const rateSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required.'),
  vehicleName: z.string().min(1, 'Vehicle name is required.'),
  generalRate: z.coerce.number().min(0, 'Rate must be positive.'),
  otRate: z.coerce.number().min(0, 'OT rate must be positive.'),
});

const formSchema = z.object({
  rates: z.array(rateSchema),
});

type RateFormValues = z.infer<typeof formSchema>;

// Mock existing rates
const initialRates = [
  { vendorName: 'Reliable Rentals Co.', vehicleName: 'JCB', generalRate: 50, otRate: 75 },
  { vendorName: 'Heavy Movers Inc.', vehicleName: 'Dumper', generalRate: 55, otRate: 80 },
];

export default function RateConfiguration() {
  const { toast } = useToast();
  
  const form = useForm<RateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rates: initialRates,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rates',
  });

  function onSubmit(values: RateFormValues) {
    console.log(values);
    toast({
      title: 'Rates Saved',
      description: 'Vendor rates have been successfully updated.',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign /> Rate Configuration
        </CardTitle>
        <CardDescription>Manage vendor-based hourly rates for rented vehicles.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label>Vendor Rates</Label>
              <div className="mt-2 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Vehicle Name</TableHead>
                      <TableHead>General Rate/hr</TableHead>
                      <TableHead>OT Rate/hr</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`rates.${index}.vendorName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Vendor Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`rates.${index}.vehicleName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Vehicle Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`rates.${index}.generalRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" placeholder="$" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`rates.${index}.otRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" placeholder="$" {...field} />
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
                onClick={() => append({ vendorName: '', vehicleName: '', generalRate: 0, otRate: 0 })}
                className="mt-4"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Vendor Rate
              </Button>
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? 'Saving...' : 'Save Rates'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
