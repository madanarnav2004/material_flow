
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
  FileText,
  Download
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
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useMaterialContext, type IndentStatus } from '@/context/material-context';
import { storeInventory, recentStoreActivity } from '@/lib/mock-data';


type RequestFormValues = {
  requesterName: string;
  requestingSite: string;
  issuingSite: string;
  materials: { materialName: string; quantity: number; rate: number; }[];
  requiredPeriod: { from: Date; to: Date; };
  remarks?: string;
};
type MaterialIndentBill = RequestFormValues & {
  requestId: string;
  requestDate: Date;
  issuedId: string;
  shiftingDate: Date;
  requester: { name: string; } | null;
  totalValue: number;
}

export default function StoreManagerDashboard() {
  const { toast } = useToast();
  const { requests, setRequests, pendingRequests, lowStockMaterials } = useMaterialContext();
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialIndentBill | null>(null);

  const materialsIssuedCount = recentStoreActivity.filter(a => a.type === 'Issue' && a.date === format(new Date(), 'yyyy-MM-dd')).length;

  const handleStatusChange = (reqId: string, newStatus: IndentStatus) => {
    setRequests(requests.map(req => req.id === reqId ? { ...req, status: newStatus } : req));
    toast({
      title: `Indent ${newStatus}`,
      description: `Indent ID ${reqId} has been marked as ${newStatus}.`,
    });
  };

  const handleViewBill = (reqId: string) => {
    const request = requests.find(r => r.id === reqId);
    if (request) {
      const returnDate = new Date(request.returnDate);
      const fromDate = new Date(returnDate.getTime() - 10 * 24 * 60 * 60 * 1000);
      const requestDate = new Date(returnDate.getTime() - 11 * 24 * 60 * 60 * 1000);
      const idParts = request.id.split('-');
      const datePart = idParts.length > 2 ? idParts[2] : format(requestDate, 'yyyyMMdd');
      const countPart = idParts.length > 3 ? idParts[3] : request.id.slice(-3);
      const siteCode = idParts.length > 1 ? idParts[1] : 'SITE';

      const bill: MaterialIndentBill = {
        requestId: `REQ-${siteCode}-${datePart}-${countPart}`,
        requestDate: requestDate,
        requesterName: 'Sample Requester',
        requestingSite: request.site,
        issuingSite: 'MAPI Store', // Mock issuing site
        materials: [{ materialName: request.material, quantity: request.quantity, rate: 10 }], // Mock rate
        requiredPeriod: { from: fromDate, to: returnDate },
        remarks: `This is a sample bill for request ${request.id}`,
        issuedId: `ISS-${siteCode}-${datePart}-${countPart}`,
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
      <h1 className="text-3xl font-bold font-headline">MAPI Store Dashboard</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Dialog>
              <DialogTrigger asChild>
                  <StatCard
                      title="Total Inventory"
                      value={`${storeInventory.length}+ items`}
                      icon={PackageSearch}
                      description="Total distinct material types"
                      onClick={() => {}}
                  />
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Overall Store Inventory</DialogTitle>
                    <DialogDescription>Live summary of materials available at the central MAPI store.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    {storeInventory.length > 0 ? (
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
                    ) : (
                        <p className="text-center text-muted-foreground">No inventory data available.</p>
                    )}
                </div>
                <div className="flex justify-end gap-4 mt-4">
                    <Button onClick={handleDownloadExcel}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Excel
                    </Button>
                </div>
              </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <StatCard
                title="Pending Indents"
                value={pendingRequests.length.toString()}
                icon={Package}
                description={`From ${new Set(pendingRequests.map(p => p.site)).size} different sites`}
                onClick={() => {}}
              />
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                  <DialogTitle>Pending Indents</DialogTitle>
                  <DialogDescription>Material indents from various sites awaiting action.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                  {pendingRequests.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Indent ID</TableHead>
                                <TableHead>Material</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Site</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {pendingRequests.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.id}</TableCell>
                                <TableCell>{item.material}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.site}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground">No pending indents.</p>
                  )}
              </div>
            </DialogContent>
          </Dialog>
          <StatCard
            title="Materials Issued"
            value={`${materialsIssuedCount} items`}
            icon={Truck}
            description="In the last 24 hours"
          />
          <Dialog>
            <DialogTrigger asChild>
              <StatCard
                title="Low Stock Alerts"
                value={`${lowStockMaterials.length} materials`}
                icon={AlertTriangle}
                className="text-destructive border-destructive/50"
                description="Across store & sites"
                onClick={() => {}}
              />
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Low Stock Material Alerts</DialogTitle>
                <DialogDescription>
                  Materials that have fallen below the minimum required quantity in the store or across sites.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                {lowStockMaterials.length > 0 ? (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Current Qty</TableHead>
                        <TableHead className="text-right">Min. Threshold</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lowStockMaterials.map((item) => (
                        <TableRow key={item.id} className="text-destructive">
                            <TableCell className="font-medium">{item.material}</TableCell>
                            <TableCell>{item.site}</TableCell>
                            <TableCell className="text-right font-bold">{`${item.quantity} ${item.unit}`}</TableCell>
                            <TableCell className="text-right">{`${item.threshold} ${item.unit}`}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground">No low stock alerts.</p>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleDownloadExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Alert List
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Indents</CardTitle>
                        <CardDescription>Material indents awaiting issue from the store.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {pendingRequests.length > 0 ? (
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
                    ) : (
                        <p className="text-center text-muted-foreground">No pending indents.</p>
                    )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Low Stock Materials</CardTitle>
                        <CardDescription>Materials running low in the store or across sites.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {lowStockMaterials.length > 0 ? (
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
                                          <TableCell className="font-bold">{`${item.quantity} ${item.unit}`}</TableCell>
                                          <TableCell>{item.site}</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground">No low stock materials.</p>
                      )}
                    </CardContent>
                </Card>
            </div>

            {lastGeneratedBill && (
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText /> Material Indent Bill
                      </CardTitle>
                      <CardDescription>
                        This is the generated bill for the selected indent.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 rounded-lg border p-4">
                      <h3 className="font-semibold">Indent Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>Indent ID:</strong> {lastGeneratedBill.requestId}</p>
                        <p><strong>Indent Date:</strong> {format(lastGeneratedBill.requestDate, 'PPP')}</p>
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
        
        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                  <CardTitle>Material Indent Return Reminders</CardTitle>
                  <CardDescription>All materials due for return or with extended dates.</CardDescription>
              </CardHeader>
              <CardContent>
                  {requests.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Site</TableHead>
                                <TableHead>Return Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.slice(0, 3).map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.material}</TableCell>
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground">No return reminders.</p>
                  )}
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>All Material Indent Return Reminders</DialogTitle>
              <DialogDescription>All materials due for return or with extended dates.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {requests.length > 0 ? (
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
              ) : (
                <p className="text-center text-muted-foreground">No return reminders.</p>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleDownloadExcel}>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
            {storeInventory.length > 0 ? (
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
            ) : (
                <p className="text-center text-muted-foreground">No inventory data available.</p>
            )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History /> Recent Store Activity</CardTitle>
                <CardDescription>An overview of recent material movements and indents from the store.</CardDescription>
            </CardHeader>
            <CardContent>
                {recentStoreActivity.length > 0 ? (
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
                ) : (
                    <p className="text-center text-muted-foreground">No recent store activity.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </>
  );
}
