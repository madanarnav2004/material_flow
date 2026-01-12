'use client';

import { FileText, Download, Upload, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMaterialContext } from '@/context/material-context';
import { Badge } from '../ui/badge';

export default function PurchaseDepartmentDashboard() {
  const { toast } = useToast();
  const { requests } = useMaterialContext();

  // For this mock, we assume any 'Pending' request could be a procurement request
  const pendingIndents = requests.filter(req => req.status === 'Pending');

  const handleDownloadIndent = (indentId: string) => {
    toast({
      title: 'Indent Bill Downloaded',
      description: `Indent ${indentId} is ready for vendor enquiry.`,
    });
    // In a real app, this would generate and download a PDF/Excel file.
  };
  
  const handleUploadInvoice = (indentId: string) => {
     toast({
      title: 'Upload Invoice',
      description: `Please select the invoice file for indent ${indentId}.`,
    });
    // In a real app, this would open a file dialog.
  };
  
  const handleMarkCompleted = (indentId: string) => {
     toast({
      title: 'Process Completed',
      description: `Procurement for indent ${indentId} has been marked as complete.`,
    });
     // In a real app, this would update the status after verification.
  };

  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Purchase Department Dashboard</h1>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Material Indents for Procurement</CardTitle>
            <CardDescription>
              These material requests could not be fulfilled from existing stock and require fresh procurement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingIndents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indent Number</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Requesting Site</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingIndents.map(indent => (
                    <TableRow key={indent.id}>
                      <TableCell className="font-medium">{indent.id}</TableCell>
                      <TableCell>{indent.material}</TableCell>
                      <TableCell>{indent.quantity}</TableCell>
                      <TableCell>{indent.site}</TableCell>
                      <TableCell>{indent.returnDate}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{indent.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownloadIndent(indent.id)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download Indent
                        </Button>
                         <Button variant="outline" size="sm" onClick={() => handleUploadInvoice(indent.id)}>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Invoice
                        </Button>
                         <Button size="sm" onClick={() => handleMarkCompleted(indent.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Completed
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center p-8">
                <p className="text-center text-muted-foreground">No pending indents for procurement.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
