'use client';

import * as React from 'react';
import { Download, Upload, CheckCircle, Settings, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMaterialContext, MaterialIndent } from '@/context/material-context';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { detailedStock } from '@/lib/mock-data';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export default function PurchaseDepartmentDashboard() {
  const { toast } = useToast();
  const { requests, setRequests } = useMaterialContext();
  const [selectedIndent, setSelectedIndent] = React.useState<MaterialIndent | null>(null);
  const [issuingSite, setIssuingSite] = React.useState<string>('');

  const pendingIndents = requests.filter(req => req.status === 'Pending' || req.status === 'Rejected');

  const materialAvailability = selectedIndent
    ? detailedStock.filter(s => s.material.toLowerCase() === selectedIndent.material.toLowerCase())
    : [];

  const availableSites = [...new Set(materialAvailability.map(s => s.site))];

  const handleProcessClick = (indent: MaterialIndent) => {
    setSelectedIndent(indent);
    setIssuingSite('');
  };

  const handleConfirmAssignment = () => {
    if (!selectedIndent || !issuingSite) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select an issuing site.' });
        return;
    }

    setRequests(prevRequests =>
        prevRequests.map(req =>
            req.id === selectedIndent.id ? { ...req, status: 'Approved', issuingSite: issuingSite } : req
        )
    );

    toast({
        title: 'Indent Approved',
        description: `Indent ${selectedIndent.id} assigned to ${issuingSite}. Notification sent.`,
    });
    setSelectedIndent(null);
  };
  
  const handleMarkCompleted = (indentId: string) => {
     toast({
      title: 'Process Completed',
      description: `Procurement for indent ${indentId} has been marked as complete.`,
    });
  };

  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Purchase Department Dashboard</h1>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Material Indents</CardTitle>
            <CardDescription>
              Assign an issuing site for pending indents based on material availability.
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
                        <Badge variant={indent.status === 'Pending' ? 'secondary' : 'destructive'}>{indent.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                         <Button size="sm" onClick={() => handleProcessClick(indent)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Process Indent
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center p-8">
                <p className="text-center text-muted-foreground">No pending indents require action.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedIndent} onOpenChange={(isOpen) => !isOpen && setSelectedIndent(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Process Indent: {selectedIndent?.id}</DialogTitle>
            <DialogDescription>
              Assign an issuing site for <span className="font-semibold">{selectedIndent?.quantity} units</span> of <span className="font-semibold">{selectedIndent?.material}</span> for <span className="font-semibold">{selectedIndent?.site}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Material Availability</h3>
                <Card>
                    <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Location</TableHead>
                                <TableHead>Available Quantity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materialAvailability.length > 0 ? materialAvailability.map(stock => (
                                <TableRow key={stock.id}>
                                    <TableCell>{stock.site}</TableCell>
                                    <TableCell>{stock.quantity}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center">No stock found for this material.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Assign Site</h3>
                <div className="p-4 border rounded-lg space-y-4">
                    <Label htmlFor="issuing-site-select">Select Issuing Site</Label>
                    <Select onValueChange={setIssuingSite} value={issuingSite}>
                        <SelectTrigger id="issuing-site-select">
                            <SelectValue placeholder="Choose a site..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableSites.map(site => (
                                <SelectItem key={site} value={site}>{site}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleConfirmAssignment} disabled={!issuingSite} className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        Confirm & Send Notification
                    </Button>
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
