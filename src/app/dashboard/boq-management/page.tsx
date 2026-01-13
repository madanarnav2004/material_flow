

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileUp, Upload, Download, FileClock, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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

const reportSchema = z.object({
  reportSiteName: z.string().min(1, 'Please select a site.'),
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function BoqManagementPage() {
  const { toast } = useToast();

  const uploadForm = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      siteName: '',
    },
  });

  const reportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
  });

  const selectedSiteForUpload = uploadForm.watch('siteName');
  const selectedSiteForReport = reportForm.watch('reportSiteName');
  
  function onUploadSubmit(values: UploadFormValues) {
    console.log('Uploaded files for site:', values.siteName, values);
    toast({
      title: 'BOQ Configuration Submitted!',
      description: `Your BOQ files for ${values.siteName} have been uploaded for processing.`,
    });
    // Reset file inputs if needed, but keep site selection
    uploadForm.reset({
      siteName: values.siteName,
      overallBoqFile: undefined,
      descriptionFile: undefined,
      itemFile: undefined,
      materialFile: undefined,
      equipmentFile: undefined,
      workforceFile: undefined,
    });
  }
  
  function onReportSubmit(values: ReportFormValues) {
    console.log('Generating report with values:', values);
    const reportDetails = `Report from ${format(values.startDate, 'PPP')} to ${format(values.endDate, 'PPP')}`;

    toast({
      title: 'Report Generation Started!',
      description: `Generating ${reportDetails} for ${values.reportSiteName}.`,
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
          control={uploadForm.control}
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
        <FileUp /> BOQ Management
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileClock /> Download Work Done Report
          </CardTitle>
          <CardDescription>
            Generate and download a detailed work done report for a specific site and date range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit(onReportSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <FormField
                  control={reportForm.control}
                  name="reportSiteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Site</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a site" />
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
                  control={reportForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
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
                <FormField
                  control={reportForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
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

              <div className="flex gap-4">
                <Button type="submit" disabled={!selectedSiteForReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report (PDF)
                </Button>
                 <Button type="submit" disabled={!selectedSiteForReport} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report (Excel)
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Form {...uploadForm}>
          <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-8">
          <Card>
               <CardHeader>
                  <CardTitle>BOQ Configuration &amp; Upload</CardTitle>
                  <CardDescription>
                  Select a site to upload or update its BOQ. Each site's BOQ is managed separately.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <FormField
                  control={uploadForm.control}
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

            {selectedSiteForUpload && (
              <Card>
                  <CardHeader>
                      <CardTitle>BOQ Excel Uploads for <span className="text-primary">{selectedSiteForUpload}</span></CardTitle>
                      <CardDescription>Upload the master Excel files for each BOQ component. This will configure all dropdowns and rates for this site.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      {renderUploadCard('overallBoqFile', 'Overall BOQ Document', 'Upload the complete BOQ including quantity and rate for the site.')}
                      
                      <Separator />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderUploadCard('descriptionFile', 'Description &amp; Category', 'Excel for Description of Work and Category Number.')}
                        {renderUploadCard('itemFile', 'Item &amp; Sub-Item of Work', 'Excel for Item of Work, Item Number, and Sub-Item.')}
                        {renderUploadCard('materialFile', 'Material Types, Units &amp; Rates', 'Excel for Material Type, Unit, and Rate.')}
                        {renderUploadCard('equipmentFile', 'Equipment, Source, Units &amp; Rates', 'Excel for Source, Equipment Name, Unit, and Rate.')}
                        {renderUploadCard('workforceFile', 'Workforce, Skills &amp; Rates', 'Excel for Skill Type, Designation, and Labour Rate.')}
                      </div>
                      
                      <Separator />

                      <Button type="submit" size="lg" disabled={uploadForm.formState.isSubmitting}>
                          <Upload className="mr-2 h-4 w-4" />
                          {uploadForm.formState.isSubmitting ? 'Uploading Files...' : 'Upload and Process BOQ Files'}
                      </Button>
                  </CardContent>
              </Card>
            )}
          </form>
      </Form>
    </div>
  );
}
