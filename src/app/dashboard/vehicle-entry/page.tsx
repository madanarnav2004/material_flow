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
import RateConfiguration from '@/components/vehicle/rate-configuration';
import { useUser } from '@/hooks/use-user';
import BillComparison from '@/components/vehicle/bill-comparison';

const vehicleEntrySchema = z.object({
  billDate: z.date(),
  vehicleNumber: z.string().min(1, 'Vehicle number is required.'),
  vehicleName: z.string().min(1, 'Vehicle name is required.'),
  vehicleType: z.enum(['Owned', 'Rented'], { required_error: 'Vehicle type is required.' }),
  vendorName: z.string().optional(),
  dailyWorkingHours: z.coerce.number().min(0, 'Working hours must be positive.'),
  otHours: z.coerce.number().min(0, 'OT hours must be a positive number.').optional(),
  engineerName: z.string().min(1, "Engineer's name is required."),
  buildingName: z.string().min(1, 'Building name is required.'),
  boqItem: z.string().min(1, 'BOQ item is required.'),
  fuelFilledBy: z.enum(['Owner', 'Site'], { required_error: 'Fuel filler is required.' }),
  fuelType: z.enum(['Petrol', 'Diesel']).optional(),
  initialSpeedometer: z.coerce.number().optional(),
  finalSpeedometer: z.coerce.number().optional(),
  litersFilled: z.coerce.number().optional(),
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
  
  // Billing
  gstPercentage: z.coerce.number().min(0).optional(),

}).refine(data => data.vehicleType !== 'Rented' || (data.vendorName && data.vendorName.length > 0), {
  message: 'Vendor name is required for rented vehicles.',
  path: ['vendorName'],
}).refine(data => data.fuelFilledBy !== 'Site' || (data.initialSpeedometer !== undefined && data.finalSpeedometer !== undefined), {
  message: 'Initial and final speedometer readings are required when fuel is filled by site.',
  path: ['finalSpeedometer'],
}).refine(data => data.fuelFilledBy !== 'Site' || (data.litersFilled && data.litersFilled > 0), {
    message: 'Liters filled is required when fuel is filled by site.',
    path: ['litersFilled'],
});

export type VehicleBillValues = z.infer<typeof vehicleEntrySchema> & {
    billId: string;
    totalWorkingHours: number;
    totalAmount: number;
};

export default function VehicleEntryPage() {
  const { toast } = useToast();
  const { role } = useUser();
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<VehicleBillValues | null>(null);
  const billContentRef = React.useRef<HTMLDivElement>(null);


  const form = useForm<z.infer<typeof vehicleEntrySchema>>({
    resolver: zodResolver(vehicleEntrySchema),
    defaultValues: {
      billDate: new Date(),
      vehicleNumber: '',
      vehicleName: '',
      dailyWorkingHours: 0,
      otHours: 0,
      engineerName: '',
      buildingName: '',
      boqItem: '',
      remarks: '',
      gstPercentage: 18,
    },
  });

  const vehicleType = form.watch('vehicleType');
  const fuelFilledBy = form.watch('fuelFilledBy');

  function onSubmit(values: z.infer<typeof vehicleEntrySchema>) {
    const totalWorkingHours = (values.dailyWorkingHours || 0) + (values.otHours || 0);
    // Dummy rate calculation for now
    const rate = values.vehicleType === 'Rented' ? 60 : 0; 
    const baseAmount = totalWorkingHours * rate;
    const gstAmount = baseAmount * ((values.gstPercentage || 0) / 100);
    const totalAmount = baseAmount + gstAmount;

    const generatedBill: VehicleBillValues = {
        ...values,
        billId: `VEH-BILL-${format(new Date(), 'yyyyMMdd-HHmmss')}`,
        totalWorkingHours,
        totalAmount,
    }

    setLastGeneratedBill(generatedBill);
    console.log(generatedBill);
    toast({
      title: 'Vehicle Bill Generated',
      description: `Bill ${generatedBill.billId} for vehicle ${values.vehicleNumber} has been successfully created.`,
    });
    // form.reset(); // Optionally reset form after submission
  }
  
  const handleDownload = (billId: string) => {
    if (billContentRef.current) {
      const billHtml = billContentRef.current.innerHTML;
      const blob = new Blob([`<html><head><title>${billId}</title><style>body{font-family:sans-serif;padding:20px;}h1,h2,h3{margin:0;}.font-bold{font-weight:700;} .text-lg{font-size:1.125rem;} .grid{display:grid;} .grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr));} .gap-2{gap:0.5rem;} .p-4{padding:1rem;} .border{border:1px solid #e2e8f0;} .rounded-lg{border-radius:0.5rem;} .space-y-2 > :not([hidden]) ~ :not([hidden]){margin-top:0.5rem;margin-bottom:0;} .text-right{text-align:right;} .mt-4{margin-top:1rem;}</style></head><body>${billHtml}</body></html>`], { type: 'text/html' });
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


  const isPrivilegedUser = role === 'director' || role === 'coordinator';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <Car /> Vehicle Entry
      </h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Log Vehicle & Generate Bill</CardTitle>
              <CardDescription>Record vehicle usage to generate a bill. For rentals, upload vendor invoices separately.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Vehicle Details */}
                  <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="text-lg font-medium">Vehicle Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField name="billDate" control={form.control} render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>Bill Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                        )} />
                        <FormField name="vehicleNumber" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Vehicle Number</FormLabel><FormControl><Input placeholder="e.g., MH-12-AB-1234" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField name="vehicleName" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Vehicle Name</FormLabel><FormControl><Input placeholder="e.g., JCB, Dumper" {...field} /></FormControl><FormMessage /></FormItem>
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
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField name="dailyWorkingHours" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Daily Working Hours</FormLabel><FormControl><Input type="number" placeholder="e.g., 8" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="otHours" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>OT Hours</FormLabel><FormControl><Input type="number" placeholder="e.g., 2" {...field} /></FormControl><FormMessage /></FormItem>
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
                                <FormItem><FormLabel>Fuel Type</FormLabel><Select onValuechange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Petrol">Petrol</SelectItem><SelectItem value="Diesel">Diesel</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                            )} />
                        )}
                         {fuelFilledBy === 'Site' && (
                             <FormField name="litersFilled" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Liters Filled</FormLabel><FormControl><Input type="number" placeholder="e.g., 20" {...field} /></FormControl><FormMessage /></FormItem>
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
                  
                  {/* GST */}
                  <div className="space-y-4 rounded-lg border p-4">
                     <h3 className="text-lg font-medium">Billing Details</h3>
                     <FormField name="gstPercentage" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>GST (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 18" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                  </div>


                  {/* Payment and Bill Upload */}
                  {vehicleType === 'Rented' && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-medium">Vendor Invoice Upload (Optional)</h3>
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
                    {form.formState.isSubmitting ? 'Generating...' : 'Generate Bill'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {isPrivilegedUser && <RateConfiguration />}

          {lastGeneratedBill && isPrivilegedUser && lastGeneratedBill.vehicleType === 'Rented' && (
            <BillComparison bill={lastGeneratedBill} />
          )}

          {lastGeneratedBill && !isPrivilegedUser && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                 <div>
                    <CardTitle className="flex items-center gap-2"><FileText /> Generated Vehicle Bill</CardTitle>
                    <CardDescription>Bill ID: {lastGeneratedBill.billId}</CardDescription>
                 </div>
                 <Button variant="outline" size="sm" onClick={() => handleDownload(lastGeneratedBill.billId)}><Download className="mr-2 h-4 w-4" /> Download</Button>
              </CardHeader>
              <CardContent ref={billContentRef} className="space-y-4 text-sm">
                <div className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-semibold">Vehicle: {lastGeneratedBill.vehicleName} ({lastGeneratedBill.vehicleNumber} - {lastGeneratedBill.vehicleType})</h3>
                    {lastGeneratedBill.vehicleType === 'Rented' && <p><strong>Vendor:</strong> {lastGeneratedBill.vendorName}</p>}
                    <p><strong>Bill Date:</strong> {format(lastGeneratedBill.billDate, 'PPP')}</p>
                </div>
                 <div className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-semibold">Usage</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <p><strong>Engineer:</strong> {lastGeneratedBill.engineerName}</p>
                        <p><strong>Building:</strong> {lastGeneratedBill.buildingName}</p>
                        <p><strong>Daily Hours:</strong> {lastGeneratedBill.dailyWorkingHours}</p>
                        <p><strong>OT Hours:</strong> {lastGeneratedBill.otHours}</p>
                        <p><strong>Total Hours:</strong> {lastGeneratedBill.totalWorkingHours}</p>
                        <p><strong>BOQ Item:</strong> {lastGeneratedBill.boqItem}</p>
                    </div>
                </div>
                <div className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-semibold">Billing Summary</h3>
                    <div className="grid grid-cols-2 gap-2">
                         {/* This assumes a dummy rate. In a real app, this would come from the rate config */}
                         <p><strong>Rate:</strong> ${lastGeneratedBill.vehicleType === 'Rented' ? '60.00/hr' : 'N/A'}</p>
                         <p><strong>Base Amount:</strong> ${((lastGeneratedBill.totalAmount) / (1 + (lastGeneratedBill.gstPercentage || 0) / 100)).toFixed(2)}</p>
                         <p><strong>GST:</strong> {lastGeneratedBill.gstPercentage || 0}%</p>
                         <p className="font-bold text-lg">Total Amount:</p>
                         <p className="font-bold text-lg text-right">${lastGeneratedBill.totalAmount.toFixed(2)}</p>
                    </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
