'use client';

import {
  Package,
  PackageCheck,
  PackageSearch,
  AlertTriangle,
  History,
  Eye,
  ChevronDown,
  FileText,
  Download,
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
import { allMaterials, materialReturnReminders as initialRequests } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';


const siteStock = [
  { id: 'mat-1', name: 'Cement', quantity: '250 bags', status: 'In Stock' },
  { id: 'mat-2', name: 'Steel Rebar', quantity: '15 tons', status: 'In Stock' },
  { id: 'mat-3', name: 'Sand', quantity: '50 m³', status: 'In Stock' },
  { id: 'mat-4', name: 'Bricks', quantity: '5000 pcs', status: 'Low Stock' },
];

const recentSiteActivity = [
    { id: 'REQ-003', type: 'Request Sent', details: '100 bags of Cement', to: 'MAPI Store', status: 'Pending', date: '1 day ago' },
    { id: 'REC-002', type: 'Receipt', details: '20 tons of Steel', from: 'West Site', status: 'Completed', date: '2 days ago' },
    { id: 'SHIFT-002', type: 'Shift Out', details: '500 bricks', to: 'South Site', status: 'In Transit', date: '3 days ago' },
];

const pendingSiteRequests = [
    { id: 'pr-1', material: 'Cement', quantity: '100 bags', requestedFrom: 'MAPI Store'},
    { id: 'pr-2', material: 'Gravel', quantity: '10 m³', requestedFrom: 'West Site'},
];

const lowStockSite = [
    { id: 'ls-1', name: 'Bricks', quantity: '5000 pcs' }
]

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


export default function SiteManagerDashboard() {
  const { toast } = useToast();
  const [requests, setRequests] = React.useState(initialRequests.slice(0,3));
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

  const handleDownloadExcel = () => {
    toast({
      title: "Download Started",
      description: "Your Excel file is being generated and will download shortly.",
    });
  };


  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Site Manager Dashboard</h1>
      <Dialog>
        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <DialogTrigger asChild>
              <StatCard
                title="Available Materials"
                value="125 items"
                icon={PackageSearch}
                description="Total distinct materials on site"
                onClick={() => {}}
              />
            </DialogTrigger>
            <StatCard
              title="Pending Requests"
              value={pendingSiteRequests.length.toString()}
              icon={Package}
              description="Awaiting approval or issue"
            />
            <StatCard
              title="Pending Receipts"
              value="2"
              icon={PackageCheck}
              description="Materials in transit to your site"
            />
            <StatCard
              title="Low Stock"
              value={`${lowStockSite.length} material`}
              icon={AlertTriangle}
              className="text-destructive border-destructive/50"
              description="Needs immediate re-ordering"
            />
          </div>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Available Materials on Site</DialogTitle>
                <DialogDescription>A detailed breakdown of all materials available on this site.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allMaterials.slice(0,5).map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell className="text-right">{Math.floor(Math.random() * 200)}</TableCell>
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3 space-y-6">
                  <Card>
                      <CardHeader>
                          <CardTitle>Pending Requests</CardTitle>
                          <CardDescription>Material requests awaiting action.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Material</TableHead>
                                      <TableHead>Quantity</TableHead>
                                      <TableHead>From</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {pendingSiteRequests.map(req => (
                                      <TableRow key={req.id}>
                                          <TableCell className="font-medium">{req.material}</TableCell>
                                          <TableCell>{req.quantity}</TableCell>
                                          <TableCell>{req.requestedFrom}</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                        </Table>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader>
                          <CardTitle>Low Stock Materials</CardTitle>
                          <CardDescription>Materials running low on this site.</CardDescription>
                      </CardHeader>
                      <CardContent>
                      <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Material</TableHead>
                                      <TableHead>Available Quantity</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {lowStockSite.map(item => (
                                      <TableRow key={item.id} className="text-destructive">
                                          <TableCell className="font-medium">{item.name}</TableCell>
                                          <TableCell className="font-bold">{item.quantity}</TableCell>
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
                <CardDescription>Materials due for return or with extended dates for this site.</CardDescription>
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
                <CardTitle>Current Site Stock</CardTitle>
                <CardDescription>
                  Live inventory of materials available at your site.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Available Quantity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siteStock.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">
                          {material.name}
                        </TableCell>
                        <TableCell>{material.quantity}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              material.status === 'In Stock'
                                ? 'default'
                                : 'destructive'
                            }
                            className={material.status === 'Low Stock' ? '' : 'bg-green-600/80'}
                          >
                            {material.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History /> Recent Site Activity</CardTitle>
              <CardDescription>A log of recent material movements involving your site.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>From/To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSiteActivity.map(activity => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.type}</TableCell>
                      <TableCell>{activity.details}</TableCell>
                      <TableCell>{activity.to || activity.from}</TableCell>
                      <TableCell>
                        <Badge variant={activity.status === 'Completed' ? 'default' : activity.status === 'In Transit' ? 'destructive' : 'secondary'} className={cn(activity.status === 'Completed' && 'bg-green-600/80')}>
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
      </Dialog>
    </>
  );
}
