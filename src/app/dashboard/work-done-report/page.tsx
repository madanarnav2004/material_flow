'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, PlusCircle, Save, Trash } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { mockBoqData } from '@/lib/mock-data';

const workDoneSchema = z.object({
  siteName: z.string(),
  reportDate: z.date(),
  descriptionOfWork: z.string().min(1, 'Description of work is required.'),
  categoryNumber: z.string(),
  itemOfWork: z.string().min(1, 'Item of work is required.'),
  itemNumber: z.string(),
  subItemOfWork: z.string().optional(),
  quantityOfWork: z.coerce.number().min(0.1, 'Quantity must be greater than 0.'),
});

type WorkDoneFormValues = z.infer<typeof workDoneSchema>;

export default function WorkDoneReportPage() {
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<WorkDoneFormValues>({
    resolver: zodResolver(workDoneSchema),
    defaultValues: {
      siteName: 'North Site', // This would be dynamic based on user
      reportDate: new Date(),
      descriptionOfWork: '',
      categoryNumber: '',
      itemOfWork: '',
      itemNumber: '',
      quantityOfWork: 0,
    },
  });

  const handleDescriptionChange = (value: string) => {
    form.setValue('descriptionOfWork', value);
    const selectedDesc = mockBoqData.descriptions.find(d => d.description === value);
    form.setValue('categoryNumber', selectedDesc?.categoryNumber || '');
    // Reset item of work when description changes
    form.setValue('itemOfWork', '');
    form.setValue('itemNumber', '');
  };
  
  const handleItemChange = (value: string) => {
    form.setValue('itemOfWork', value);
    const selectedItem = mockBoqData.items.find(i => i.item === value);
    form.setValue('itemNumber', selectedItem?.itemNumber || '');
  };

  const selectedDescription = form.watch('descriptionOfWork');
  const availableItems = React.useMemo(() => {
    if (!selectedDescription) return [];
    return mockBoqData.items.filter(i => i.description === selectedDescription);
  }, [selectedDescription]);


  function onSubmit(values: WorkDoneFormValues) {
    console.log(values);
    toast({
      title: 'Report Submitted',
      description: 'Your Daily Work Done Report has been successfully submitted.',
    });
    // In a real app, this would also lock the form for editing.
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Daily Work Done Report</h1>
      <Card>
        <CardHeader>
          <CardTitle>Submit Today's Progress</CardTitle>
          <CardDescription>Fill in the details below to report the work completed today.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="siteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Name</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="reportDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                       <FormControl>
                        <Input value={format(field.value, 'PPP')} readOnly disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-medium">Work Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="descriptionOfWork"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description of Work</FormLabel>
                          <Select onValueChange={handleDescriptionChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select work description" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {mockBoqData.descriptions.map(desc => (
                                <SelectItem key={desc.description} value={desc.description}>{desc.description}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="categoryNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Category Number</FormLabel>
                            <FormControl><Input {...field} readOnly disabled /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="itemOfWork"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item of Work</FormLabel>
                          <Select onValueChange={handleItemChange} value={field.value} disabled={!selectedDescription}>
                             <FormControl><SelectTrigger><SelectValue placeholder="Select work item" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {availableItems.map(item => (
                                <SelectItem key={item.item} value={item.item}>{item.item}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="itemNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Item Number</FormLabel>
                            <FormControl><Input {...field} readOnly disabled /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="subItemOfWork"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Sub Item of Work (Optional)</FormLabel>
                            <FormControl><Input placeholder="e.g., Waterproofing" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="quantityOfWork"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Quantity of Work</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

              {/* Placeholder sections for Material, Equipment, and Workforce */}
              <Card>
                <CardHeader><CardTitle>Material Consumption</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Material details will be added here.</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Equipment Usage</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Equipment details will be added here.</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Workforce Details</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Workforce details will be added here.</p></CardContent>
              </Card>

              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Daily Report'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
