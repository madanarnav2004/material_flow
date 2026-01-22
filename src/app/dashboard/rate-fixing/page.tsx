
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
import { Label } from '@/components/ui/label';
import { mockBoqData } from '@/lib/mock-data';

// Schemas
const materialRateSchema = z.object({
  type: z.string(),
  rate: z.coerce.number().min(0, 'Rate must be positive.'),
  unit: z.string(),
});

const equipmentRateSchema = z.object({
  source: z.string(),
  name: z.string(),
  rate: z.coerce.number().min(0, 'Rate must be positive.'),
  unit: z.string(),
});

const workforceRateSchema = z.object({
  skill: z.string(),
  designation: z.string(),
  rate: z.coerce.number().min(0, 'Rate must be positive.'),
});

// Main component
export default function RateFixingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Rate Fixing Module</h1>
      <MaterialRateForm />
      <EquipmentRateForm />
      <WorkforceRateForm />
    </div>
  );
}

// Sub-components for each rate type
function MaterialRateForm() {
  const { toast } = useToast();
  const form = useForm<{ rates: z.infer<typeof materialRateSchema>[] }>({
    resolver: zodResolver(z.object({ rates: z.array(materialRateSchema) })),
    defaultValues: { rates: mockBoqData.materials },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'rates' });

  function onSubmit(values: { rates: z.infer<typeof materialRateSchema>[] }) {
    console.log('Saving Material Rates:', values);
    toast({ title: 'Material Rates Saved Successfully' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Rate Configuration</CardTitle>
        <CardDescription>Manage per-unit rates for all material types.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Table>
              <TableHeader><TableRow><TableHead>Material Type</TableHead><TableHead>Unit</TableHead><TableHead>Rate</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell><FormField control={form.control} name={`rates.${index}.type`} render={({ field }) => <FormItem><FormControl><Input {...field} readOnly/></FormControl></FormItem>}/></TableCell>
                    <TableCell><FormField control={form.control} name={`rates.${index}.unit`} render={({ field }) => <FormItem><FormControl><Input {...field} readOnly/></FormControl></FormItem>}/></TableCell>
                    <TableCell><FormField control={form.control} name={`rates.${index}.rate`} render={({ field }) => <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage/></FormItem>}/></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ type: '', unit: '', rate: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Material</Button>
            <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save Material Rates</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function EquipmentRateForm() {
  const { toast } = useToast();
  const form = useForm<{ rates: z.infer<typeof equipmentRateSchema>[] }>({
    resolver: zodResolver(z.object({ rates: z.array(equipmentRateSchema) })),
    defaultValues: { rates: mockBoqData.equipment },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'rates' });

  function onSubmit(values: { rates: z.infer<typeof equipmentRateSchema>[] }) {
    console.log('Saving Equipment Rates:', values);
    toast({ title: 'Equipment Rates Saved Successfully' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Rate Configuration</CardTitle>
        <CardDescription>Manage per-hour rates for owned and hired equipment.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Table>
              <TableHeader><TableRow><TableHead>Source</TableHead><TableHead>Equipment Name</TableHead><TableHead>Unit</TableHead><TableHead>Rate</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell><FormField control={form.control} name={`rates.${index}.source`} render={({ field }) => <FormItem><FormControl><Input {...field} readOnly/></FormControl></FormItem>}/></TableCell>
                    <TableCell><FormField control={form.control} name={`rates.${index}.name`} render={({ field }) => <FormItem><FormControl><Input {...field} readOnly/></FormControl></FormItem>}/></TableCell>
                    <TableCell><FormField control={form.control} name={`rates.${index}.unit`} render={({ field }) => <FormItem><FormControl><Input {...field} readOnly/></FormControl></FormItem>}/></TableCell>
                    <TableCell><FormField control={form.control} name={`rates.${index}.rate`} render={({ field }) => <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage/></FormItem>}/></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ source: '', name: '', unit: '', rate: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Equipment</Button>
            <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save Equipment Rates</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function WorkforceRateForm() {
  const { toast } = useToast();
  const form = useForm<{ rates: z.infer<typeof workforceRateSchema>[] }>({
    resolver: zodResolver(z.object({ rates: z.array(workforceRateSchema) })),
    defaultValues: { rates: mockBoqData.workforce },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'rates' });

  function onSubmit(values: { rates: z.infer<typeof workforceRateSchema>[] }) {
    console.log('Saving Workforce Rates:', values);
    toast({ title: 'Workforce Rates Saved Successfully' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workforce Rate Configuration</CardTitle>
        <CardDescription>Manage per-hour rates for different skill types and designations.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Table>
              <TableHeader><TableRow><TableHead>Skill</TableHead><TableHead>Designation</TableHead><TableHead>Rate/hr</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell><FormField control={form.control} name={`rates.${index}.skill`} render={({ field }) => <FormItem><FormControl><Input {...field} readOnly/></FormControl></FormItem>}/></TableCell>
                    <TableCell><FormField control={form.control} name={`rates.${index}.designation`} render={({ field }) => <FormItem><FormControl><Input {...field} readOnly/></FormControl></FormItem>}/></TableCell>
                    <TableCell><FormField control={form.control} name={`rates.${index}.rate`} render={({ field }) => <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage/></FormItem>}/></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ skill: '', designation: '', rate: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Workforce</Button>
            <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save Workforce Rates</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
