
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileUp, Upload, Sheet, FileCheck2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const uploadSchema = z.object({
  siteName: z.string().min(1, 'Please select a site.'),
  boqFile: z.any().refine(files => files?.length === 1, 'BOQ Excel file is required.'),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

type UploadedBoq = {
  siteName: string;
  fileName: string;
  uploadDate: string;
  version: number;
};

const initialBoqs: UploadedBoq[] = [
  { siteName: 'North Site', fileName: 'North_Site_BOQ_v1.xlsx', uploadDate: '2024-07-20', version: 1 },
  { siteName: 'West Site', fileName: 'West_Site_BOQ_v1.xlsx', uploadDate: '2024-07-18', version: 1 },
];

export default function BoqManagementPage() {
  const { toast } = useToast();
  const [uploadedBoqs, setUploadedBoqs] = React.useState<UploadedBoq[]>(initialBoqs);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      siteName: '',
    },
  });

  function onSubmit(values: UploadFormValues) {
    const { siteName, boqFile } = values;
    const fileName = boqFile[0].name;

    const existingBoqIndex = uploadedBoqs.findIndex(b => b.siteName === siteName);
    if (existingBoqIndex !== -1) {
      // Update existing BOQ
      const newVersion = uploadedBoqs[existingBoqIndex].version + 1;
      setUploadedBoqs(prev => prev.map((boq, index) => 
        index === existingBoqIndex 
          ? { ...boq, fileName: `North_Site_BOQ_v${newVersion}.xlsx`, uploadDate: new Date().toLocaleDateString('en-CA'), version: newVersion }
          : boq
      ));
      toast({
        title: 'BOQ Updated!',
        description: `BOQ for ${siteName} has been updated to version ${newVersion}.`,
      });
    } else {
      // Add new BOQ
      setUploadedBoqs(prev => [
        ...prev,
        { siteName, fileName: `North_Site_BOQ_v1.xlsx`, uploadDate: new Date().toLocaleDateString('en-CA'), version: 1 },
      ]);
      toast({
        title: 'BOQ Uploaded!',
        description: `New BOQ for ${siteName} has been successfully uploaded.`,
      });
    }

    form.reset();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <FileUp /> BOQ Management
      </h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Site BOQ</CardTitle>
            <CardDescription>
              Upload the structured BOQ Excel file for a specific site. This will configure all dropdowns and rates for that site's daily reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="siteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Site</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a site to upload BOQ for" />
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
                  name="boqFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BOQ Excel File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".xlsx, .xls"
                          onChange={(e) => field.onChange(e.target.files)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                  <Upload className="mr-2 h-4 w-4" />
                  {form.formState.isSubmitting ? 'Uploading...' : 'Upload and Process BOQ'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uploaded BOQs</CardTitle>
            <CardDescription>
              List of currently active BOQs for each site. Re-uploading for an existing site will create a new version.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site Name</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedBoqs.map((boq) => (
                  <TableRow key={boq.siteName}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4 text-green-600" />
                        {boq.siteName}
                    </TableCell>
                    <TableCell>
                        <span className="flex items-center gap-2">
                            <Sheet className="h-4 w-4 text-muted-foreground" />
                            {boq.fileName}
                        </span>
                    </TableCell>
                    <TableCell>{boq.uploadDate}</TableCell>
                    <TableCell>v{boq.version}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => alert('Delete functionality not implemented.')}>
                           <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
