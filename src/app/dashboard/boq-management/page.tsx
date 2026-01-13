
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileUp, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const uploadSchema = z.object({
  siteName: z.string().min(1, 'Please select a site.'),
  overallBoqFile: z.any().optional(),
  descriptionFile: z.any().optional(),
  itemFile: z.any().optional(),
  materialFile: z.any().optional(),
  equipmentFile: z.any().optional(),
  workforceFile: z.any().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function BoqManagementPage() {
  const { toast } = useToast();

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      siteName: '',
    },
  });

  const selectedSite = form.watch('siteName');

  function onSubmit(values: UploadFormValues) {
    console.log('Uploaded files for site:', values.siteName, values);
    toast({
      title: 'BOQ Configuration Submitted!',
      description: `Your BOQ files for ${values.siteName} have been uploaded for processing.`,
    });
    // Reset file inputs if needed, but keep site selection
    form.reset({
      siteName: values.siteName,
      overallBoqFile: undefined,
      descriptionFile: undefined,
      itemFile: undefined,
      materialFile: undefined,
      equipmentFile: undefined,
      workforceFile: undefined,
    });
  }
  
  const renderUploadCard = (name: keyof UploadFormValues, title: string, description: string) => (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => field.onChange(e.target.files)}
                />
              </FormControl>
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
        <FileUp /> BOQ Management and Configuration
      </h1>
      
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                 <CardHeader>
                    <CardTitle>Step 1: Site Selection</CardTitle>
                    <CardDescription>
                    Select the site for which you want to upload or update the BOQ configuration. Each site's BOQ is managed separately.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                        <FormItem className="max-w-md">
                        <FormLabel>Select Site</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a site to configure its BOQ" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="North Site">North Site</SelectItem>
                            <SelectItem value="South Site">South Site</SelectItem>
                            <SelectItem value="West Site">West Site</SelectItem>
                            <SelectItem value="East Site">East Site</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
            </Card>

              {selectedSite && (
                <Card>
                    <CardHeader>
                        <CardTitle>Step 2: BOQ Excel Uploads for <span className="text-primary">{selectedSite}</span></CardTitle>
                        <CardDescription>Upload the master Excel files for each BOQ component. This will configure all dropdowns and rates for this site.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {renderUploadCard('overallBoqFile', 'Overall BOQ Document', 'Upload the complete BOQ including quantity and rate for the site.')}
                        
                        <Separator />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {renderUploadCard('descriptionFile', 'Description & Category', 'Excel for Description of Work and Category Number.')}
                          {renderUploadCard('itemFile', 'Item & Sub-Item of Work', 'Excel for Item of Work, Item Number, and Sub-Item.')}
                          {renderUploadCard('materialFile', 'Material Types, Units & Rates', 'Excel for Material Type, Unit, and Rate.')}
                          {renderUploadCard('equipmentFile', 'Equipment, Source, Units & Rates', 'Excel for Source, Equipment Name, Unit, and Rate.')}
                          {renderUploadCard('workforceFile', 'Workforce, Skills & Rates', 'Excel for Skill Type, Designation, and Labour Rate.')}
                        </div>
                        
                        <Separator />

                        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                            <Upload className="mr-2 h-4 w-4" />
                            {form.formState.isSubmitting ? 'Uploading Files...' : 'Upload and Process BOQ Files'}
                        </Button>
                    </CardContent>
                </Card>
              )}
            </form>
        </Form>
    </div>
  );
}
