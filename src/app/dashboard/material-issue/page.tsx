
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, PlusCircle, Trash, ClipboardList, Download } from 'lucide-react';
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
import { useMaterialContext, type SiteIssueVoucher } from '@/context/material-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/hooks/use-user';
import { Switch } from '@/components/ui/switch';

const materialIssueItemSchema = z.object({
  materialName: z.string().min(1, 'Material is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be > 0.'),
  unit: z.string(),
  returnable: z.boolean().default(false),
  remarks: z.string().optional(),
});

const issueSchema = z.object({
  siteName: z.string(),
  issueDate: z.date({ required_error: 'Issue date is required.' }),
  issuedTo: z.string().min(1, 'Please specify who the material is issued to.'),
  buildingName: z.string().min(1, 'Building name is required.'),
  materials: z.array(materialIssueItemSchema).min(1, 'Please add at least one material.'),
});

type IssueFormValues = z.infer<typeof issueSchema>;

export default function MaterialIssuePage() {
  const { toast } = useToast();
  const { site } = useUser();
  const { inventory, setInventory, setSiteIssues } = useMaterialContext();
  const [lastVoucher, setLastVoucher] = React.useState<SiteIssueVoucher | null>(null);
  const voucherContentRef = React.useRef<HTMLDivElement>(null);
  
  const siteName = site || '';

  const siteStock = React.useMemo(() => {
    return inventory.filter(item => item.site === siteName);
  }, [inventory, siteName]);

  const form = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      siteName: siteName,
      issueDate: new Date(),
      issuedTo: '',
      buildingName: '',
      materials: [{ materialName: '', quantity: 0, unit: '', returnable: false, remarks: '' }],
    },
  });

  React.useEffect(() => {
    if (siteName) {
      form.setValue('siteName', siteName);
    }
  }, [siteName, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  const handleMaterialChange = (materialName: string, index: number) => {
    const selectedStock = siteStock.find(stock => stock.material === materialName);
    form.setValue(`materials.${index}.materialName`, materialName);
    if (selectedStock) {
      form.setValue(`materials.${index}.unit`, selectedStock.unit);
    }
  };

  function onSubmit(values: IssueFormValues) {
    // 1. Check for sufficient stock
    for (const material of values.materials) {
      const stockItem = siteStock.find(s => s.material === material.materialName);
      if (!stockItem || stockItem.quantity < material.quantity) {
        toast({
          variant: 'destructive',
          title: 'Insufficient Stock',
          description: `Not enough ${material.materialName} available at ${values.siteName}. Available: ${stockItem?.quantity || 0}.`,
        });
        return;
      }
    }

    // 2. Generate Voucher
    const voucherId = `ISS-VOUCHER-${format(new Date(), 'yyyyMMdd-HHmmss')}`;
    const newVoucher: SiteIssueVoucher = {
      ...values,
      voucherId,
      issueDate: values.issueDate.toISOString(),
    };
    setLastVoucher(newVoucher);
    setSiteIssues(prev => [newVoucher, ...prev]);

    // 3. Update Inventory
    setInventory(prevInventory => {
      const newInventory = [...prevInventory];
      values.materials.forEach(material => {
        const itemIndex = newInventory.findIndex(i => i.site === values.siteName && i.material === material.materialName);
        if (itemIndex > -1) {
          newInventory[itemIndex].quantity -= material.quantity;
        }
      });
      return newInventory;
    });

    toast({
      title: 'Material Issue Voucher Generated!',
      description: `Stock has been updated for ${values.siteName}.`,
    });
    form.reset();
     form.setValue('siteName', siteName);
  }
  
  const handleDownload = (voucherId: string) => {
    if (voucherContentRef.current) {
      const voucherHtml = voucherContentRef.current.innerHTML;
      const blob = new Blob([`<html><head><title>${voucherId}</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}.grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.font-semibold{font-weight:600}</style></head><body>${voucherHtml}</body></html>`], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${voucherId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Download Started",
        description: `Voucher ${voucherId} is downloading.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <ClipboardList /> Site Material Issue
      </h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Create Material Issue Voucher</CardTitle>
              <CardDescription>Log materials issued for on-site consumption to employees or contractors.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                     <FormField
                      control={form.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issuing Site</FormLabel>
                          <FormControl><Input {...field} readOnly disabled /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Issue Date</FormLabel>
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

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="issuedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issued To (Employee/Contractor)</FormLabel>
                          <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="buildingName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Building / Location</FormLabel>
                          <FormControl><Input placeholder="e.g., Tower A, Basement" {...field} /></FormControl>
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
                            <TableHead className="w-2/5">Material</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Returnable</TableHead>
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
                                      <Select onValueChange={(value) => handleMaterialChange(value, index)} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select from stock" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                          {siteStock.map(stock => (
                                            <SelectItem key={stock.id} value={stock.material}>
                                              {stock.material} ({stock.quantity} {stock.unit} available)
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
                                    <FormItem><FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                              </TableCell>
                               <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`materials.${index}.unit`}
                                  render={({ field }) => (
                                    <FormItem><FormControl><Input readOnly disabled {...field} /></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                              </TableCell>
                               <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`materials.${index}.returnable`}
                                  render={({ field }) => (
                                    <FormItem className="flex items-center justify-center h-full">
                                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
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
                     <Button type="button" variant="outline" size="sm" onClick={() => append({ materialName: '', quantity: 0, unit: '', returnable: false, remarks: '' })} className="mt-4">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Another Material
                    </Button>
                  </div>

                  <Button type="submit" size="lg" disabled={form.formState.isSubmitting || !siteName}>
                    {form.formState.isSubmitting ? 'Issuing...' : 'Generate Issue Voucher'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {lastVoucher && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList /> Material Issue Voucher
                  </CardTitle>
                  <CardDescription>
                    Voucher for materials issued on-site.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload(lastVoucher.voucherId)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardHeader>
              <CardContent ref={voucherContentRef} className="space-y-4 text-sm">
                <div className="space-y-2 rounded-lg border p-4">
                  <h3 className="font-semibold">Voucher Details</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <p><strong>Voucher ID:</strong> {lastVoucher.voucherId}</p>
                    <p><strong>Issue Date:</strong> {format(new Date(lastVoucher.issueDate), 'PPP')}</p>
                    <p><strong>Site:</strong> {lastVoucher.siteName}</p>
                    <p><strong>Issued To:</strong> {lastVoucher.issuedTo}</p>
                    <p><strong>Building:</strong> {lastVoucher.buildingName}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Issued Materials</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Returnable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lastVoucher.materials.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.materialName} ({item.unit})</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.returnable ? 'Yes' : 'No'}</TableCell>
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
