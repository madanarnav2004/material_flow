'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const uploadSchema = z.object({
  siteName: z.string().min(1, 'Please select a site.'),
  quantitiesFile: z.any().refine(files => files?.length > 0, 'File is required.'),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function GodownActionsPage() {
  const { toast } = useToast();

  const uploadForm = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      siteName: '',
    },
  });
  
  function onUploadSubmit(values: UploadFormValues) {
    console.log('Uploaded quantities file for site:', values.siteName, values.quantitiesFile);
    toast({
      title: 'Quantities File Submitted!',
      description: `Your material quantities file for ${values.siteName} has been uploaded for processing.`,
    });
    uploadForm.reset();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <Upload /> Godown Actions
      </h1>
      
      <Form {...uploadForm}>
          <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-8">
          <Card>
               <CardHeader>
                  <CardTitle>Upload Site-wise Material Quantities</CardTitle>
                  <CardDescription>
                  Select a site and upload an Excel file with material quantities. The system will automatically update the inventory for that site.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <FormField
                  control={uploadForm.control}
                  name="siteName"
                  render={({ field }) => (
                      <FormItem className="max-w-md">
                      <FormLabel>Select Site</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a site to update" />
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
                <FormField
                    control={uploadForm.control}
                    name="quantitiesFile"
                    render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                            <FormLabel>Material Quantities File</FormLabel>
                            <FormControl>
                                <Input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={(e) => onChange(e.target.files)}
                                {...rest}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <Button type="submit" size="lg" disabled={uploadForm.formState.isSubmitting}>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadForm.formState.isSubmitting ? 'Uploading...' : 'Upload and Process File'}
                </Button>
              </CardContent>
          </Card>
          </form>
      </Form>
    </div>
  );
}
