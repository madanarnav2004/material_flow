
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Upload } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const fileSchema = (typeof window !== 'undefined' ? z.instanceof(File) : z.any()).optional();

const rateUploadSchema = z.object({
  materialFile: fileSchema,
  equipmentFile: fileSchema,
  skilledWorkforceFile: fileSchema,
  unskilledWorkforceFile: fileSchema,
});

type RateUploadFormValues = z.infer<typeof rateUploadSchema>;

export default function RateFixingPage() {
  const { toast } = useToast();

  const form = useForm<RateUploadFormValues>({
    resolver: zodResolver(rateUploadSchema),
  });

  function onSubmit(values: RateUploadFormValues) {
    console.log('Uploading rate files:', values);
    let uploadedFiles = 0;
    if (values.materialFile) uploadedFiles++;
    if (values.equipmentFile) uploadedFiles++;
    if (values.skilledWorkforceFile) uploadedFiles++;
    if (values.unskilledWorkforceFile) uploadedFiles++;

    if (uploadedFiles > 0) {
      toast({
        title: 'Rate Files Uploaded!',
        description: `Your rate configurations have been submitted for processing.`,
      });
      form.reset({
        materialFile: undefined,
        equipmentFile: undefined,
        skilledWorkforceFile: undefined,
        unskilledWorkforceFile: undefined,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'No Files Selected',
        description: 'Please select at least one file to upload.',
      });
    }
  }

  const renderUploadCard = (name: keyof RateUploadFormValues, title: string, description: string) => (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name={name}
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) =>
                    onChange(e.target.files ? e.target.files[0] : null)
                  }
                />
              </FormControl>
              {value && <p className="text-sm text-muted-foreground mt-2">Selected: {value.name}</p>}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <DollarSign /> Rate Fixing Module
      </h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Upload Rate Configuration Files</CardTitle>
              <CardDescription>
                Upload the master Excel files for material, equipment, and workforce rates. These rates will be used across the system for cost analysis and BOQ calculations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderUploadCard('materialFile', 'Material Rates', 'Upload Excel for material types, units, and rates.')}
                {renderUploadCard('equipmentFile', 'Equipment Rates', 'Upload Excel for equipment names, units, and rates.')}
                {renderUploadCard('skilledWorkforceFile', 'Skilled Worker Rates', 'Upload Excel for skilled worker designations, rates, and OT hours.')}
                {renderUploadCard('unskilledWorkforceFile', 'Unskilled Worker Rates', 'Upload Excel for unskilled worker designations, rates, and OT hours.')}
              </div>
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                <Upload className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Uploading...' : 'Upload and Process Rate Files'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
