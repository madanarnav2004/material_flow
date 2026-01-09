'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Car, Fuel, HardHat, Building, Wrench, Upload, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const vehicleEntrySchema = z.object({
  vehicleNumber: z.string().min(1, 'Vehicle number is required.'),
  vehicleType: z.enum(['Owned', 'Rented'], { required_error: 'Vehicle type is required.' }),
  vendorName: z.string().optional(),
  dailyWorkingHours: z.coerce.number().min(0, 'Working hours must be positive.'),
  engineerName: z.string().min(1, "Engineer's name is required."),
  buildingName: z.string().min(1, 'Building name is required.'),
  boqItem: z.string().min(1, 'BOQ item is required.'),
  fuelFilledBy: z.enum(['Owner', 'Site'], { required_error: 'Fuel filler is required.' }),
  fuelType: z.enum(['Petrol', 'Diesel']).optional(),
  initialSpeedometer: z.coerce.number().optional(),
  finalSpeedometer: z.coerce.number().optional(),
  remarks: z.string().min(1, 'Remarks are mandatory for fuel entries.'),
  
  // Rented vehicle payment details
  invoiceNumber: z.string().optional(),
  invoiceDate: z.date().optional(),
  invoiceReceivedDate: z.date().optional(),
  totalInvoiceAmount: z.coerce.number().optional(),
  rentPeriodFrom: z.date().optional(),
  rentPeriodTo: z.date().optional(),
  totalWorkingHoursRent: z.coerce.number().optional(),
  billFile: z.any().optional(),
}).refine(data => data.vehicleType !== 'Rented' || (data.vendorName && data.vendorName.length > 0), {
  message: 'Vendor name is required for rented vehicles.',
  path: ['vendorName'],
}).refine(data => data.fuelFilledBy !== 'Site' || (data.initialSpeedometer !== undefined && data.finalSpeedometer !== undefined), {
  message: 'Initial and final speedometer readings are required when fuel is filled by site.',
  path: ['finalSpeedometer'],
});

type VehicleEntryFormValues = z.infer<typeof vehicleEntrySchema>;

export default function VehicleEntryPage() {
  const { toast } = useToast();
  const [lastEntry, setLastEntry] = React.useState<VehicleEntryFormValues | null>(null);

  const form = useForm<VehicleEntryFormValues>({
    resolver: zodResolver(vehicleEntrySchema),
    defaultValues: {
      vehicleNumber: '',
      dailyWorkingHours: 0,
      engineerName: '',
      buildingName: '',
      boqItem: '',
      remarks: '',
    },
  });

  const vehicleType = form.watch('vehicleType');
  const fuelFilledBy = form.watch('fuelFilledBy');

  function onSubmit(values: VehicleEntryFormValues) {
    setLastEntry(values);
    console.log(values);
    toast({
      title: 'Vehicle Entry Logged',
      description: `Entry for vehicle ${values.vehicleNumber} has been successfully saved.`,
    });
    // form.reset(); // Optionally reset form after submission
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <Car /> Vehicle Entry
      </h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Log Vehicle Details</CardTitle>
              <CardDescription>Record all vehicle-related usage, fuel, and payment details for your site.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Vehicle Details */}
                  <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="text-lg font-medium">Vehicle Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField name="vehicleNumber" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Vehicle Number</FormLabel><FormControl><Input placeholder="e.g., MH-12-AB-1234" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField name="vehicleType" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Vehicle Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select vehicle type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Owned">Owned</SelectItem><SelectItem value="Rented">Rented</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                      )} />
                    </div>
                    {vehicleType === 'Rented' && (
                      <FormField name="vendorName" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Vendor Name</FormLabel><FormControl><Input placeholder="e.g., Reliable Rentals Co." {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    )}
                  </div>

                  {/* Usage Details */}
                  <div className="space-y-4 rounded-lg border p-4">
                     <h3 className="text-lg font-medium">Usage Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField name="dailyWorkingHours" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Daily Working Hours</FormLabel><FormControl><Input type="number" placeholder="e.g., 8" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="engineerName" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center gap-1"><HardHat className="h-4 w-4" />Engineer's Name</FormLabel><FormControl><Input placeholder="e.g., John Smith" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="buildingName" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center gap-1"><Building className="h-4 w-4" />Building Name</FormLabel><FormControl><Input placeholder="e.g., Tower A" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="boqItem" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center gap-1"><Wrench className="h-4 w-4" />BOQ Item</FormLabel><FormControl><Input placeholder="e.g., Earthwork Excavation" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                     </div>
                  </div>

                  {/* Fuel Details */}
                  <div className="space-y-4 rounded-lg border p-4">
                     <h3 className="text-lg font-medium flex items-center gap-2"><Fuel />Fuel Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField name="fuelFilledBy" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Fuel Filled By</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select who filled the fuel" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Owner">Owner</SelectItem><SelectItem value="Site">Site</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        {fuelFilledBy === 'Owner' && (
                            <FormField name="fuelType" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Fuel Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Petrol">Petrol</SelectItem><SelectItem value="Diesel">Diesel</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                            )} />
                        )}
                     </div>
                     {fuelFilledBy === 'Site' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField name="initialSpeedometer" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Initial Speedometer (km)</FormLabel><FormControl><Input type="number" placeholder="e.g., 50123" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="finalSpeedometer" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Final Speedometer (km)</FormLabel><FormControl><Input type="number" placeholder="e.g., 50223" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                     )}
                     <FormField name="remarks" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Remarks (Mandatory)</FormLabel><FormControl><Textarea placeholder="e.g., Fuel filled at local station, 20 liters of diesel." {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                  </div>

                  {/* Payment and Bill Upload */}
                  {vehicleType === 'Rented' && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-medium">Payment & Bill Upload</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField name="invoiceNumber" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Invoice Number</FormLabel><FormControl><Input placeholder="e.g., RENT-2024-55" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField name="totalInvoiceAmount" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Total Invoice Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 15000" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField name="invoiceDate" control={form.control} render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Invoice Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                            )} />
                            <FormField name="invoiceReceivedDate" control={form.control} render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Invoice Received Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField name="rentPeriodFrom" control={form.control} render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Rent Period (From)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Start date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                            )} />
                             <FormField name="rentPeriodTo" control={form.control} render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Rent Period (To)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>End date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField name="totalWorkingHoursRent" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Total Working Hours (for rent period)</FormLabel><FormControl><Input type="number" placeholder="e.g., 120" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="billFile" control={form.control} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Upload Invoice Document</FormLabel>
                            <FormControl>
                              <Input type="file" {...form.register('billFile')} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                    </div>
                  )}

                  <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Vehicle Entry'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {lastEntry && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                 <div>
                    <CardTitle className="flex items-center gap-2"><FileText /> Last Entry Details</CardTitle>
                    <CardDescription>A summary of the last vehicle entry you logged.</CardDescription>
                 </div>
                 <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Download</Button>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-semibold">Vehicle: {lastEntry.vehicleNumber} ({lastEntry.vehicleType})</h3>
                    {lastEntry.vehicleType === 'Rented' && <p><strong>Vendor:</strong> {lastEntry.vendorName}</p>}
                </div>
                 <div className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-semibold">Usage</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <p><strong>Engineer:</strong> {lastEntry.engineerName}</p>
                        <p><strong>Building:</strong> {lastEntry.buildingName}</p>
                        <p><strong>Daily Hours:</strong> {lastEntry.dailyWorkingHours}</p>
                        <p><strong>BOQ Item:</strong> {lastEntry.boqItem}</p>
                    </div>
                </div>
                 <div className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-semibold">Fuel</h3>
                    <p><strong>Filled By:</strong> {lastEntry.fuelFilledBy}</p>
                    {lastEntry.fuelFilledBy === 'Owner' && <p><strong>Fuel Type:</strong> {lastEntry.fuelType}</p>}
                    {lastEntry.fuelFilledBy === 'Site' && (
                        <div className="grid grid-cols-2 gap-2">
                             <p><strong>Initial km:</strong> {lastEntry.initialSpeedometer}</p>
                             <p><strong>Final km:</strong> {lastEntry.finalSpeedometer}</p>
                             <p><strong>Usage:</strong> {lastEntry.finalSpeedometer! - lastEntry.initialSpeedometer!} km</p>
                        </div>
                    )}
                    <p><strong>Remarks:</strong> {lastEntry.remarks}</p>
                </div>
                {lastEntry.vehicleType === 'Rented' && (
                    <div className="space-y-2 rounded-lg border p-4">
                        <h3 className="font-semibold">Payment Details</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <p><strong>Invoice #:</strong> {lastEntry.invoiceNumber}</p>
                            <p><strong>Amount:</strong> ${lastEntry.totalInvoiceAmount?.toFixed(2)}</p>
                            <p><strong>Invoice Date:</strong> {lastEntry.invoiceDate ? format(lastEntry.invoiceDate, 'PPP') : 'N/A'}</p>
                            <p><strong>Received Date:</strong> {lastEntry.invoiceReceivedDate ? format(lastEntry.invoiceReceivedDate, 'PPP') : 'N/A'}</p>
                            <p><strong>Rent Period:</strong> {lastEntry.rentPeriodFrom ? format(lastEntry.rentPeriodFrom, 'PPP') : 'N/A'} - {lastEntry.rentPeriodTo ? format(lastEntry.rentPeriodTo, 'PPP') : 'N/A'}</p>
                            <p><strong>Total Hours:</strong> {lastEntry.totalWorkingHoursRent}</p>
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
