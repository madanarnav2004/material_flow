'use client';

import {
  Package,
  PackageSearch,
  AlertTriangle,
  Truck,
  History,
  Building,
  Eye,
  ChevronDown,
  FileText
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { pendingRequests, lowStockMaterials, materialReturnReminders as initialRequests } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

const storeInventory = [
  { id: 'mat-1', name: 'Cement', quantity: '5000 bags', siteDistribution: 5 },
  { id: 'mat-2', name: 'Steel Rebar', quantity: '150 tons', siteDistribution: 8 },
  { id: 'mat-3', name: 'Sand', quantity: '800 m³', siteDistribution: 4 },
  { id: 'mat-4', name: 'Bricks', quantity: '500,000 pcs', siteDistribution: 10 },
  { id: 'mat-5', name: 'Paint', quantity: '1200 liters', siteDistribution: 3 },
];

const recentStoreActivity = [
    { id: 'ISS-012', type: 'Issue', details: '100 bags of Cement', site: 'North Site', status: 'Completed', date: '1 day ago' },
    { id: 'REC-008', type: 'Receipt', details: '10 bags of cement', site: 'West Site (Return)', status: 'Accepted', date: '2 days ago' },
    { id: 'REQ-025', type: 'Request', details: '5 tons Steel', site: 'South Site', status: 'Pending', date: '2 days ago' },
    { id: 'INV-015', type: 'Invoice', details: 'Uploaded for 10000 bricks', site: 'N/A', status: 'Processed', date: '3 days ago' },
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

export default function StoreManagerDashboard() {
  const { toast } = useToast();
  const [requests, setRequests] = React.useState(initialRequests);
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialRequestBill | null>(null);

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

  return (
    <>
      <h1 className="text-3xl font-bold font-headline">MAPI Store Dashboard</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Inventory"
            value="350+ items"
            icon={PackageSearch}
            description="Total distinct material types"
          />
          <StatCard
            title="Pending Requests"
            value="3"
            icon={Package}
            description="From 3 different sites"
          />
           <StatCard
            title="Materials Issued"
            value="42 items"
            icon={Truck}
            description="In the last 24 hours"
          />
          <StatCard
            title="Low Stock Alerts"
            value="3 materials"
            icon={AlertTriangle}
            className="text-destructive border-destructive/50"
            description="Across store & sites"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Requests</CardTitle>
                        <CardDescription>Material requests awaiting issue from the store.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Requesting Site</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {pendingRequests.map((req) => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.material}</TableCell>
                                <TableCell>{req.quantity}</TableCell>
                                <TableCell>{req.site}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Low Stock Materials</CardTitle>
                        <CardDescription>Materials running low in the store or across sites.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Material</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Location</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lowStockMaterials.map(item => (
                                    <TableRow key={item.id} className="text-destructive">
                                        <TableCell className="font-medium">{item.material}</TableCell>
                                        <TableCell className="font-bold">{item.quantity}</TableCell>
                                        <TableCell>{item.site}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                       </Table>
                    </CardContent>
                </Card>
            </div>

            {lastGeneratedBill && (
              <div className="lg:col-span-2">
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
                <div className="flex items-center gap-2">
                    <Building className="h-6 w-6" />
                    <CardTitle>Overall Store Inventory</CardTitle>
                </div>
                <CardDescription>
                    Live summary of materials available at the central MAPI store.
                </CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Available Quantity</TableHead>
                        <TableHead>Sites Supplied</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {storeInventory.map((material) => (
                    <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell>{material.quantity}</TableCell>
                        <TableCell>{material.siteDistribution}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History /> Recent Store Activity</CardTitle>
                <CardDescription>An overview of recent material movements and requests from the store.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Site</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentStoreActivity.map(activity => (
                            <TableRow key={activity.id}>
                                <TableCell className="font-medium">{activity.type}</TableCell>
                                <TableCell>{activity.details}</TableCell>
                                <TableCell>{activity.site}</TableCell>
                                <TableCell>
                                    <Badge variant={activity.status === 'Completed' || activity.status === 'Accepted' || activity.status === 'Processed' ? 'default' : 'secondary'} className={cn((activity.status === 'Completed' || activity.status === 'Accepted') && 'bg-green-600/80')}>
                                        {activity.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{activity.date}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
