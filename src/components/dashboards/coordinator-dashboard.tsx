'use client';

import { BarChart, Users, Building, FileText, Eye, ChevronDown, Download } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { materialReturnReminders as initialRequests, pendingRequests as initialPendingRequests } from '@/lib/mock-data';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

const boqUsage = [
  { item: 'Concrete Works', consumed: '120 m³', budget: '150 m³', status: 'On Track' },
  { item: 'Reinforcement', consumed: '25 tons', budget: '22 tons', status: 'Over Budget' },
  { item: 'Brickwork', consumed: '8000 pcs', budget: '10000 pcs', status: 'On Track' },
];

const engineerUsage = [
    { name: 'R. Sharma', materials: 'Cement, Steel', site: 'North Site' },
    { name: 'S. Gupta', materials: 'Bricks, Sand', site: 'West Site' },
    { name: 'P. Verma', materials: 'Gravel, Paint', site: 'South Site' },
];


type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Issued' | 'Completed' | 'Mismatch' | 'Extended';
type RequestFormValues = {
  requesterName: string;
  requestingSite: string;
  issuingSite: string;
  materials: { materialName: string; quantity: number; rate: number; }[];
  requiredPeriod: { from: Date; to: Date; };
  remarks?: string;
};
type MaterialRequestBill = RequestFormValues & {
  requestId: string;
  requestDate: Date;
  issuedId: string;
  shiftingDate: Date;
  requester: { name: string; } | null;
  totalValue: number;
}


export default function CoordinatorDashboard() {
  const { toast } = useToast();
  const [requests, setRequests] = React.useState(initialRequests);
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialRequestBill | null>(null);
  const [pendingRequests, setPendingRequests] = React.useState(initialPendingRequests);


  const handleStatusChange = (reqId: string, newStatus: RequestStatus) => {
    setRequests(requests.map(req => req.id === reqId ? { ...req, status: newStatus } : req));
    toast({
      title: `Request ${newStatus}`,
      description: `Request ID ${reqId} has been marked as ${newStatus}.`,
    });
  };

  const handleViewBill = (reqId: string) => {
    const request = requests.find(r => r.id === reqId);
    if (request) {
      const returnDate = new Date(request.returnDate);
      const fromDate = new Date(returnDate.getTime() - 10 * 24 * 60 * 60 * 1000);
      const requestDate = new Date(returnDate.getTime() - 11 * 24 * 60 * 60 * 1000);
      const datePart = format(requestDate, 'yyyyMMdd');
      const countPart = request.id.slice(-3);

      const bill: MaterialRequestBill = {
        requestId: `REQ-${datePart}-${countPart}`,
        requestDate: requestDate,
        requesterName: 'Sample Requester',
        requestingSite: request.site,
        issuingSite: 'MAPI Store', // Mock issuing site
        materials: [{ materialName: request.material, quantity: request.quantity, rate: 10 }], // Mock rate
        requiredPeriod: { from: fromDate, to: returnDate },
        remarks: `This is a sample bill for request ${request.id}`,
        issuedId: `ISS-${datePart}-${countPart}`,
        shiftingDate: new Date(returnDate.getTime() - 9 * 24 * 60 * 60 * 1000),
        requester: { name: 'Sample Requester' },
        totalValue: request.quantity * 10, // Mock total value
      };
      setLastGeneratedBill(bill);
    }
  };

  const handleDownloadExcel = () => {
    toast({
      title: "Download Started",
      description: "Your Excel file is being generated and will download shortly.",
    });
  };


  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Coordinator Dashboard</h1>
      <Dialog>
        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <DialogTrigger asChild>
                <StatCard
                    title="Total Usage (BOQ)"
                    value="85%"
                    icon={BarChart}
                    description="Across 5 active projects"
                    onClick={() => {}}
                />
            </DialogTrigger>
            <StatCard
              title="Engineers Monitored"
              value="12"
              icon={Users}
              description="Active on 3 sites"
            />
            <StatCard
              title="Sites Overview"
              value="3 Sites"
              icon={Building}
              description="North, South, West"
            />
            <StatCard
              title="Pending Requests"
              value={pendingRequests.length.toString()}
              icon={FileText}
              description="Awaiting action"
            />
          </div>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>BOQ Item-Wise Material Usage</DialogTitle>
                <DialogDescription>Comparison of actual vs. budgeted material consumption.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>BOQ Item</TableHead>
                            <TableHead>Consumed</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {boqUsage.map(item => (
                            <TableRow key={item.item}>
                                <TableCell className="font-medium">{item.item}</TableCell>
                                <TableCell>{item.consumed}</TableCell>
                                <TableCell>{item.budget}</TableCell>
                                <TableCell className={item.status === 'Over Budget' ? 'text-destructive' : ''}>{item.status}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-end gap-4 mt-4">
                <Button onClick={handleDownloadExcel}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel
                </Button>
            </div>
          </DialogContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="lg:col-span-1 space-y-6">
                  <Card className="h-fit">
                      <CardHeader>
                          <CardTitle>BOQ Item-Wise Material Usage</CardTitle>
                          <CardDescription>Comparison of actual vs. budgeted material consumption.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>BOQ Item</TableHead>
                                      <TableHead>Consumed</TableHead>
                                      <TableHead>Budget</TableHead>
                                      <TableHead>Status</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {boqUsage.map(item => (
                                      <TableRow key={item.item}>
                                          <TableCell className="font-medium">{item.item}</TableCell>
                                          <TableCell>{item.consumed}</TableCell>
                                          <TableCell>{item.budget}</TableCell>
                                          <TableCell className={item.status === 'Over Budget' ? 'text-destructive' : ''}>{item.status}</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                        </Table>
                      </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Requests</CardTitle>
                      <CardDescription>Material requests awaiting action across all sites.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Material</TableHead>
                                  <TableHead>Qty</TableHead>
                                  <TableHead>Site</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {pendingRequests.map((item) => (
                                  <TableRow key={item.id} className="text-sm">
                                      <TableCell className="font-medium">{item.material}</TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>{item.site}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
              </div>
              {lastGeneratedBill && (
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText /> Material Request Bill
                        </CardTitle>
                        <CardDescription>
                          This is the generated bill for the selected request.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 rounded-lg border p-4">
                        <h3 className="font-semibold">Request Information</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><strong>Request ID:</strong> {lastGeneratedBill.requestId}</p>
                          <p><strong>Request Date:</strong> {format(lastGeneratedBill.requestDate, 'PPP')}</p>
                          <p><strong>Requesting Site:</strong> {lastGeneratedBill.requestingSite}</p>
                          <p><strong>Requester:</strong> {lastGeneratedBill.requester?.name}</p>
                        </div>
                      </div>
                      <div className="space-y-2 rounded-lg border p-4">
                        <h3 className="font-semibold">Issue Information</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><strong>Issuing Site:</strong> {lastGeneratedBill.issuingSite}</p>
                          <p><strong>Issued ID:</strong> {lastGeneratedBill.issuedId}</p>
                          <p><strong>Shifting Date:</strong> {format(lastGeneratedBill.shiftingDate, 'PPP')}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Material Details</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lastGeneratedBill.materials.map((m, i) => (
                              <TableRow key={i}>
                                <TableCell>{m.materialName}</TableCell>
                                <TableCell>{m.quantity}</TableCell>
                                <TableCell>${m.rate.toFixed(2)}</TableCell>
                                <TableCell className="text-right">${(m.quantity * m.rate).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Separator />
                        <div className="flex justify-end font-bold text-lg">
                            Total Value: ${lastGeneratedBill.totalValue.toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
          </div>
          <Card>
            <CardHeader>
                <CardTitle>Material Return Reminders</CardTitle>
                <CardDescription>All materials due for return or with extended dates.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Site</TableHead>
                            <TableHead>Return Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.material}</TableCell>
                                <TableCell>{req.quantity}</TableCell>
                                <TableCell>{req.site}</TableCell>
                                <TableCell>{req.returnDate}</TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={
                                            req.status === 'Pending' ? 'secondary' : 
                                            req.status === 'Approved' ? 'default' :
                                            req.status === 'Issued' ? 'default' :
                                            req.status === 'Completed' ? 'outline' :
                                            'destructive'
                                        }
                                        className={cn(
                                            req.status === 'Approved' && 'bg-blue-500/80 text-white',
                                            req.status === 'Issued' && 'bg-green-600/80 text-white',
                                            req.status === 'Extended' && 'border-amber-500/50 text-amber-500',
                                            req.status === 'Mismatch' && 'bg-orange-500/80 text-white'
                                        )}
                                    >
                                        {req.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button variant="outline" size="sm" onClick={() => handleViewBill(req.id)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Bill
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        Update Status <ChevronDown className="ml-2 h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Approved')}>Approved</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Rejected')}>Rejected</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Issued')}>Issued</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Completed')}>Completed</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Mismatch')}>Mismatch</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                              </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>Engineer-Wise Material Usage</CardTitle>
                  <CardDescription>Material consumption handled by each engineer.</CardDescription>
              </CardHeader>
              <CardContent>
              <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Engineer Name</TableHead>
                              <TableHead>Materials</TableHead>
                              <TableHead>Site</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {engineerUsage.map(eng => (
                              <TableRow key={eng.name}>
                                  <TableCell className="font-medium">{eng.name}</TableCell>
                                  <TableCell>{eng.materials}</TableCell>
                                  <TableCell>{eng.site}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
        </div>
      </Dialog>
    </>
  );
}
