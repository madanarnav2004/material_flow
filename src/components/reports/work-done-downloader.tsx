
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, FileClock, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '../ui/input';

const reportSchema = z.object({
  siteName: z.string().min(1, 'Please select a site.'),
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

export default function WorkDoneDownloader() {
  const { toast } = useToast();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      siteName: '',
      reportType: 'daily',
    },
  });

  const reportType = form.watch('reportType');
  const selectedSite = form.watch('siteName');

  function onSubmit(values: ReportFormValues) {
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
      description: `Generating ${reportDetails} for ${values.siteName}.`,
    });
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileClock /> Work Done Report Downloader
        </CardTitle>
        <CardDescription>
          Generate and download daily, date-range, monthly, or yearly work done reports for a specific site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="siteName"
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
                control={form.control}
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

            {selectedSite && (
              <div className="p-4 border rounded-lg bg-secondary/30">
                {reportType === 'daily' && (
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                    control={form.control}
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
              <Button type="submit" disabled={!selectedSite}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
               <Button type="submit" disabled={!selectedSite} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
