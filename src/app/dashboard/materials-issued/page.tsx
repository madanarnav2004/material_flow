'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, PlusCircle, Trash, FileText, Download } from 'lucide-react';
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
import { useMaterialContext } from '@/context/material-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Schemas
const materialIssueItemSchema = z.object({
  boqItem: z.string().min(1, 'BOQ Item is required.'),
  materialName: z.string().min(1, 'Material name is required.'),
  materialUnit: z.string().min(1, 'Unit is required.'),
  issuedQuantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  engineerName: z.string().min(1, 'Engineer name is required.'),
  buildingName: z.string().min(1, 'Building name is required.'),
  remarks: z.string().optional(),
});

const issueBillSchema = z.object({
  requestId: z.string().min(1, 'A Material Request must be selected.'),
  issuedDate: z.date({ required_error: 'Issued date is required.' }),
  materials: z.array(materialIssueItemSchema).min(1, 'Please add at least one material.'),
});

type IssueBillFormValues = z.infer<typeof issueBillSchema>;

type GeneratedBill = IssueBillFormValues & {
  issueBillId: string;
};

export default function MaterialsIssuedPage() {
  const { toast } = useToast();
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<GeneratedBill | null>(null);
  const billContentRef = React.useRef<HTMLDivElement>(null);
  const { requests, setIssuedMaterials } = useMaterialContext();

  // Form
  const form = useForm<IssueBillFormValues>({
    resolver: zodResolver(issueBillSchema),
    defaultValues: {
      requestId: '',
      issuedDate: new Date(),
      materials: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  const handleRequestChange = (requestId: string) => {
    const selectedRequest = requests.find(r => r.id === requestId);
    if (selectedRequest) {
        form.setValue('requestId', requestId);
        // Clear previous materials and add the new one
        form.setValue('materials', []);
        append({
            materialName: selectedRequest.material,
            issuedQuantity: selectedRequest.quantity,
            materialUnit: 'unit', // Mock unit, replace with actual if available
            boqItem: 'Default BOQ', // Mock data
            engineerName: 'Site Engineer', // Mock data
            buildingName: 'Main Building', // Mock data
            remarks: '',
        });
        toast({
            title: "Request selected",
            description: "Material details have been auto-filled."
        });
    }
  };


  function onSubmit(values: IssueBillFormValues) {
    const selectedRequest = requests.find(r => r.id === values.requestId);
    if (!selectedRequest) {
        toast({variant: 'destructive', title: 'Error', description: 'Selected request not found.'});
        return;
    }

    const today = new Date();
    const datePart = format(today, 'yyyyMMdd');
    const countPart = (Date.now() % 1000).toString().padStart(3, '0');
    const newBillId = `ISS-BILL-${datePart}-${countPart}`;

    const bill: GeneratedBill = {
      ...values,
      issueBillId: newBillId,
    };
    
    setLastGeneratedBill(bill);

    // Add to shared context for the receipt page
    values.materials.forEach(material => {
        const issuedMaterial = {
            requestId: values.requestId,
            issuedId: newBillId,
            materialName: material.materialName,
            issuedQuantity: material.issuedQuantity,
            issuingSite: 'MAPI Store', // Assuming store issues it
            receivingSite: selectedRequest.site,
        };
        setIssuedMaterials(prev => [...prev, issuedMaterial]);
    });

    toast({
      title: 'Material Issue Bill Generated!',
      description: `Bill ${newBillId} has been successfully created. Stock has been updated.`,
    });
    // In a real app, you'd trigger a stock update here.
    form.reset();
  }
  
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
      <h1 className="text-3xl font-bold font-headline">Materials Issued - Site</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Generate Material Issue Bill</CardTitle>
              <CardDescription>Select a Material Request to auto-fill details and generate an issue bill.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="requestId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material Request Bill Number</FormLabel>
                          <Select onValueChange={handleRequestChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a request to issue" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {requests.filter(r => r.status === 'Approved').map(req => (
                                <SelectItem key={req.id} value={req.id}>
                                  {req.id} - {req.material}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="issuedDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Issued Date</FormLabel>
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
                    <Label>Issued Materials</Label>
                    <div className="mt-2 rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Engineer</TableHead>
                            <TableHead>Building</TableHead>
                            <TableHead>BOQ Item</TableHead>
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
                                    <FormItem><FormControl><Input placeholder="e.g., Cement" {...field} readOnly /></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`materials.${index}.materialUnit`}
                                  render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="e.g., bag" {...field} /></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`materials.${index}.issuedQuantity`}
                                  render={({ field }) => (
                                    <FormItem><FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`materials.${index}.engineerName`}
                                  render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="Engineer" {...field} readOnly/></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`materials.${index}.buildingName`}
                                  render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="Building" {...field} readOnly/></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`materials.${index}.boqItem`}
                                  render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="BOQ Item" {...field} readOnly/></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`materials.${index}.remarks`}
                                  render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="Remarks" {...field} /></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length < 1}>
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                     <FormMessage>{form.formState.errors.materials?.message || form.formState.errors.materials?.root?.message}</FormMessage>
                  </div>

                  <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Generating...' : 'Generate Issue Bill'}
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
                    <FileText /> Material Issue Bill
                  </CardTitle>
                  <CardDescription>
                    This is the generated bill for the issued materials.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload(lastGeneratedBill.issueBillId)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardHeader>
              <CardContent ref={billContentRef} className="space-y-4 text-sm">
                <div className="space-y-2 rounded-lg border p-4">
                  <h3 className="font-semibold">Bill Details</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <p><strong>Issue Bill ID:</strong> {lastGeneratedBill.issueBillId}</p>
                    <p><strong>Issued Date:</strong> {format(lastGeneratedBill.issuedDate, 'PPP')}</p>
                    <p><strong>Request Bill #:</strong> {lastGeneratedBill.requestId}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Issued Materials</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Engineer</TableHead>
                        <TableHead>Building</TableHead>
                        <TableHead>BOQ Item</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lastGeneratedBill.materials.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.materialName} ({item.materialUnit})</TableCell>
                          <TableCell>{item.issuedQuantity}</TableCell>
                          <TableCell>{item.engineerName}</TableCell>
                          <TableCell>{item.buildingName}</TableCell>
                          <TableCell>{item.boqItem}</TableCell>
                          <TableCell>{item.remarks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
