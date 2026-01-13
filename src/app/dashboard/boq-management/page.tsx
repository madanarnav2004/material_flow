
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileUp, Upload, Download, FileClock, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

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
  reportType: z.enum(['daily', 'range', 'monthly', 'yearly']),
  singleDate: z.date().optional(),
  dateRange: z
    .object({
      from: z.date(),
      to: z.date().optional(),
    })
    .optional(),
  month: z.string().optional(),
  year: z.string().optional(),
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
    defaultValues: {
      reportSiteName: '',
      reportType: 'daily',
    },
  });

  const selectedSiteForUpload = uploadForm.watch('siteName');
  const reportType = reportForm.watch('reportType');
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
    let reportDetails = '';
    switch (values.reportType) {
      case 'daily':
        reportDetails = `Daily report for ${format(values.singleDate!, 'PPP')}`;
        break;
      case 'range':
        reportDetails = `Report from ${format(values.dateRange!.from, 'PPP')} to ${format(values.dateRange!.to!, 'PPP')}`;
        break;

      case 'monthly':
        reportDetails = `Monthly report for ${values.month}`;
        break;
      case 'yearly':
        reportDetails = `Yearly report for ${values.year}`;
        break;
    }

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
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <FileUp /> BOQ Management
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileClock /> BOQ and Work Done Report Downloader
          </CardTitle>
          <CardDescription>
            Generate and download daily, date-range, monthly, or yearly work done reports for a specific site. This report includes cost details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit(onReportSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  name="reportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Period</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Single Day</SelectItem>
                          <SelectItem value="range">Date Range</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedSiteForReport && (
                <div className="p-4 border rounded-lg bg-secondary/30">
                  {reportType === 'daily' && (
                    <FormField
                      control={reportForm.control}
                      name="singleDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Select Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn('w-[240px] pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
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
                  )}

                  {reportType === 'range' && (
                    <FormField
                      control={reportForm.control}
                      name="dateRange"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Select Date Range</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  id="date"
                                  variant="outline"
                                  className={cn('w-[300px] justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value?.from ? (
                                    field.value.to ? (
                                      <>
                                        {format(field.value.from, 'LLL dd, y')} - {format(field.value.to, 'LLL dd, y')}
                                      </>
                                    ) : (
                                      format(field.value.from, 'LLL dd, y')
                                    )
                                  ) : (
                                    <span>Pick a date range</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={field.value?.from}
                                selected={field.value as DateRange}
                                onSelect={field.onChange}
                                numberOfMonths={2}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {reportType === 'monthly' && (
                    <div className="grid grid-cols-2 gap-4">
                       <FormField
                        control={reportForm.control}
                        name="month"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Month</FormLabel>
                            <Select onValueChange={field.onChange}>
                               <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a month" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={reportForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Year</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={currentYear.toString()}>
                               <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a year" />
                                </Trigger>
                              </FormControl>
                              <SelectContent>
                                 {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                   {reportType === 'yearly' && (
                    <FormField
                      control={reportForm.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Year</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={currentYear.toString()}>
                             <FormControl>
                              <SelectTrigger className="w-[240px]">
                                <SelectValue placeholder="Select a year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
              <div className="flex gap-4">
                <Button type="submit" disabled={!selectedSiteForReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                 <Button type="submit" disabled={!selectedSiteForReport} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel
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
                  <CardTitle>BOQ Configuration & Upload</CardTitle>
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
                        {renderUploadCard('descriptionFile', 'Description & Category', 'Excel for Description of Work and Category Number.')}
                        {renderUploadCard('itemFile', 'Item & Sub-Item of Work', 'Excel for Item of Work, Item Number, and Sub-Item.')}
                        {renderUploadCard('materialFile', 'Material Types, Units & Rates', 'Excel for Material Type, Unit, and Rate.')}
                        {renderUploadCard('equipmentFile', 'Equipment, Source, Units & Rates', 'Excel for Source, Equipment Name, Unit, and Rate.')}
                        {renderUploadCard('workforceFile', 'Workforce, Skills & Rates', 'Excel for Skill Type, Designation, and Labour Rate.')}
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

    