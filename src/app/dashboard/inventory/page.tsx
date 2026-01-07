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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allMaterials } from '@/lib/mock-data';

// Schemas
const materialItemSchema = z.object({
  materialName: z.string().min(1, 'Material name is required.'),
  unit: z.string().optional(),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  rate: z.coerce.number().min(0.01, 'Rate must be > 0.'),
  remark: z.string().optional(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
  vendorName: z.string().min(1, 'Vendor name is required.'),
  receivedDate: z.date({ required_error: 'The date the material was received is required.' }),
  materials: z.array(materialItemSchema).min(1, 'Please add at least one material.'),
});

const newMaterialSchema = z.object({
  name: z.string().min(2, 'Material name must be at least 2 characters.'),
  unit: z.string().min(1, 'Unit is required (e.g., kg, m, pcs).'),
  description: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

// Mock data for uploaded invoices
const initialInvoices = [
    {
        invoiceNumber: 'INV-2024-001',
        vendorName: 'Acme Suppliers',
        receivedDate: new Date('2024-07-20'),
        totalAmount: 1000,
    },
    {
        invoiceNumber: 'INV-2024-002',
        vendorName: 'Reliable Builders Inc.',
        receivedDate: new Date('2024-07-22'),
        totalAmount: 2500,
    }
];

export default function InventoryPage() {
  const { toast } = useToast();
  const [materials, setMaterials] = React.useState(allMaterials.map(m => ({...m, quantity: Math.floor(Math.random() * 200) + 50, rate: Math.floor(Math.random() * 100) + 10})));
  const [uploadedInvoices, setUploadedInvoices] = React.useState(initialInvoices);

  // Invoice Form
  const invoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      vendorName: '',
      materials: [{ materialName: '', unit: '', quantity: 0, rate: 0, remark: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: invoiceForm.control,
    name: 'materials',
  });

  function onInvoiceSubmit(values: InvoiceFormValues) {
    console.log(values);
    const totalAmount = values.materials.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    setUploadedInvoices(prev => [...prev, { ...values, receivedDate: values.receivedDate || new Date(), totalAmount }]);
    toast({
      title: 'Invoice Submitted!',
      description: `Invoice ${values.invoiceNumber} has been successfully uploaded.`,
    });
    invoiceForm.reset();
  }
  
  const handleMaterialChange = (materialName: string, index: number) => {
    const material = materials.find(m => m.name === materialName);
    if (material) {
      invoiceForm.setValue(`materials.${index}.unit`, material.unit);
    }
  };

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Inventory Management</h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                    <CardTitle>Upload Invoice</CardTitle>
                    <CardDescription>Fill in the details below to upload a new material invoice.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Form {...invoiceForm}>
                        <form onSubmit={invoiceForm.handleSubmit(onInvoiceSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <FormField
                            control={invoiceForm.control}
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
                            control={invoiceForm.control}
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
                            control={invoiceForm.control}
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
                                    <TableHead className="w-2/6">Material Name</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead className="w-1/6">Remark</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {fields.map((field, index) => (
                                    <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField
                                        control={invoiceForm.control}
                                        name={`materials.${index}.materialName`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={(value) => { field.onChange(value); handleMaterialChange(value, index); }} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a material" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {materials.map(material => (
                                                            <SelectItem key={material.id} value={material.name}>
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
                                        control={invoiceForm.control}
                                        name={`materials.${index}.unit`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormControl>
                                                <Input {...field} readOnly placeholder="Unit" />
                                            </FormControl>
                                            </FormItem>
                                        )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                        control={invoiceForm.control}
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
                                        control={invoiceForm.control}
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
                                        <FormField
                                        control={invoiceForm.control}
                                        name={`materials.${index}.remark`}
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
                                onClick={() => append({ materialName: '', unit: '', quantity: 0, rate: 0, remark: '' })}
                                className="mt-2"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Material
                            </Button>
                            <FormMessage>{invoiceForm.formState.errors.materials?.message}</FormMessage>
                        </div>

                        <Button type="submit" size="lg" disabled={invoiceForm.formState.isSubmitting}>
                            <Upload className="mr-2 h-4 w-4" />
                            {invoiceForm.formState.isSubmitting ? 'Uploading...' : 'Upload Invoice'}
                        </Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Uploaded Invoices</CardTitle>
                        <CardDescription>A list of previously uploaded invoices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uploadedInvoices.map((invoice) => (
                                <TableRow key={invoice.invoiceNumber}>
                                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                    <TableCell>{invoice.vendorName}</TableCell>
                                    <TableCell>{format(invoice.receivedDate, 'PPP')}</TableCell>
                                    <TableCell className="text-right">${invoice.totalAmount.toFixed(2)}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
      <Card>
          <CardHeader>
            <CardTitle>Materials List</CardTitle>
            <CardDescription>Available materials across all sites and MAPI store.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>{material.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
