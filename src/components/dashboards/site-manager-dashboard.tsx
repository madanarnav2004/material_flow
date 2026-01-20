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
import { 
  recentSiteActivity, 
  pendingSiteRequests,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useMaterialContext } from '@/context/material-context';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';


type RequestFormValues = {
  requesterName: string;
  requestingSite: string;
  materials: { materialName: string; quantity: number; rate: number; }[];
  requiredPeriod: { from: Date; to: Date; };
  remarks?: string;
};
type MaterialIndentBill = RequestFormValues & {
  requestId: string;
  requestDate: Date;
  issuedId: string;
  issuingSite?: string;
  shiftingDate: Date;
  requester: { name: string; } | null;
  totalValue: number;
}


export default function SiteManagerDashboard() {
  const { toast } = useToast();
  const router = useRouter();
  const { requests, inventory } = useMaterialContext();
  const { site } = useUser();
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialIndentBill | null>(null);

  const siteName = site || "Current Site"; 

  const siteRequests = React.useMemo(() => {
    return requests.filter(req => req.site === siteName);
  }, [requests, siteName]);

  const sitePendingRequests = React.useMemo(() => {
    return pendingSiteRequests.filter(req => req.site === siteName);
  }, [pendingSiteRequests, siteName]);

  const siteRecentActivity = React.useMemo(() => {
    return recentSiteActivity.filter(act => act.site === siteName);
  }, [recentSiteActivity, siteName]);

  const lowStockSite = React.useMemo(() => {
    return inventory.filter(item => item.site === siteName && item.quantity <= item.minQty);
  }, [inventory, siteName]);
  const lowStockCount = lowStockSite.length;
  
  const currentSiteStock = React.useMemo(() => {
      return inventory.filter(item => item.site === siteName);
  }, [inventory, siteName]);


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
        issuingSite: request.issuingSite || 'Pending Assignment',
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
      <h1 className="text-3xl font-bold font-headline">{siteName} Dashboard</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
           <Dialog>
            <DialogTrigger asChild>
               <div className="cursor-pointer">
                  <StatCard
                    title="Available Materials"
                    value={`${currentSiteStock.length} items`}
                    icon={PackageSearch}
                    description="Total distinct materials on site"
                  />
               </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Current Stock at {siteName}</DialogTitle>
                <DialogDescription>Live inventory of materials available at your site.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                 {currentSiteStock.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Available Quantity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentSiteStock.map((material) => {
                         const status = material.quantity <= material.minQty ? 'Low Stock' : 'In Stock';
                         return (
                          <TableRow key={material.id}>
                              <TableCell className="font-medium">
                              {material.material}
                              </TableCell>
                              <TableCell>{material.quantity} {material.unit}</TableCell>
                              <TableCell>
                              <Badge
                                  variant={status === 'In Stock' ? 'default' : 'destructive'}
                                  className={status === 'Low Stock' ? '' : 'bg-green-600/80'}
                              >
                                  {status}
                              </Badge>
                              </TableCell>
                          </TableRow>
                         )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground p-8">No stock data available for this site.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>

           <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <StatCard
                  title="Pending Indents"
                  value={sitePendingRequests.length.toString()}
                  icon={Package}
                  description="Awaiting approval or issue"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                  <DialogTitle>Pending Indents for {siteName}</DialogTitle>
                  <DialogDescription>Material indents awaiting action for this site.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                  {sitePendingRequests.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Requested From</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sitePendingRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.material}</TableCell>
                                    <TableCell>{req.quantity}</TableCell>
                                    <TableCell>{req.requestedFrom}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  ): (
                    <p className="text-center text-muted-foreground p-8">No pending indents for this site.</p>
                  )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <StatCard
                  title="Pending GRNs"
                  value="1"
                  icon={PackageCheck}
                  description="Materials in transit to your site"
                />
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pending Goods Received Notes (GRNs)</DialogTitle>
                <DialogDescription>These materials are currently in transit to your site.</DialogDescription>
              </DialogHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>From</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>500 Bags of Cement</TableCell>
                    <TableCell>MAPI Godown</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <StatCard
                  title="Low Stock"
                  value={`${lowStockCount} material(s)`}
                  icon={AlertTriangle}
                  className="text-destructive border-destructive/50"
                  description="Needs immediate re-ordering"
                />
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Low Stock on Site</DialogTitle>
                <DialogDescription>These materials have fallen below the minimum threshold at {siteName}.</DialogDescription>
              </DialogHeader>
               {lowStockSite.length > 0 ? (
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
                                  <TableCell className="font-medium">{item.material}</TableCell>
                                  <TableCell className="font-bold">{`${item.quantity} ${item.unit}`}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                </Table>
              ) : (
                  <p className="text-center text-muted-foreground p-8">No low stock materials on this site.</p>
              )}
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Indents for {siteName}</CardTitle>
                        <CardDescription>Material indents from your site awaiting action.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {sitePendingRequests.length > 0 ? (
                        <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Material</TableHead>
                                      <TableHead>Quantity</TableHead>
                                      <TableHead>From</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {sitePendingRequests.map(req => (
                                      <TableRow key={req.id}>
                                          <TableCell className="font-medium">{req.material}</TableCell>
                                          <TableCell>{req.quantity}</TableCell>
                                          <TableCell>{req.requestedFrom}</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground p-8">No pending indents from this site.</p>
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
                     <div className="space-y-2 rounded-lg border p-4">
                      <h3 className="font-semibold">Issue Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>Issuing Site:</strong> {lastGeneratedBill.issuingSite}</p>
                        <p><strong>Issued ID:</strong> {lastGeneratedBill.issuedId}</p>
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
                  <CardDescription>Materials due for return or with extended dates for this site.</CardDescription>
              </CardHeader>
              <CardContent>
                  {siteRequests.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Return Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {siteRequests.slice(0, 3).map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.material}</TableCell>
                                    <TableCell>{req.quantity}</TableCell>
                                    <TableCell>{req.returnDate}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={
                                                req.status === 'Director Rejected' || req.status === 'Purchase Rejected' ? 'destructive' :
                                                req.status === 'Completed' ? 'outline' :
                                                'default'
                                            }
                                            className={cn(
                                                'text-white',
                                                req.status === 'Pending Director Approval' && 'bg-yellow-500/80',
                                                req.status === 'Director Approved' && 'bg-blue-500/80',
                                                req.status === 'Issued' && 'bg-green-600/80',
                                                req.status === 'PO Generated' && 'bg-purple-500/80',
                                                req.status === 'Partially Issued' && 'bg-orange-500/80',
                                                (req.status === 'Director Rejected' || req.status === 'Purchase Rejected') && 'bg-destructive'
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
                    <p className="text-center text-muted-foreground p-8">No return reminders for this site.</p>
                  )}
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>All Material Indent Return Reminders for {siteName}</DialogTitle>
              <DialogDescription>Materials due for return or with extended dates for this site.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {siteRequests.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Issuing Site</TableHead>
                            <TableHead>Return Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {siteRequests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.material}</TableCell>
                                <TableCell>{req.issuingSite || 'Pending'}</TableCell>
                                <TableCell>{req.returnDate}</TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={
                                            req.status === 'Director Rejected' || req.status === 'Purchase Rejected' ? 'destructive' :
                                            req.status === 'Completed' ? 'outline' :
                                            'default'
                                        }
                                        className={cn(
                                            'text-white',
                                            req.status === 'Pending Director Approval' && 'bg-yellow-500/80',
                                            req.status === 'Director Approved' && 'bg-blue-500/80',
                                            req.status === 'Issued' && 'bg-green-600/80',
                                            req.status === 'PO Generated' && 'bg-purple-500/80',
                                            req.status === 'Partially Issued' && 'bg-orange-500/80',
                                            (req.status === 'Director Rejected' || req.status === 'Purchase Rejected') && 'bg-destructive'
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
                              </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground p-8">No return reminders for this site.</p>
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
            <CardTitle className="flex items-center gap-2"><History /> Recent Site Activity</CardTitle>
            <CardDescription>A log of recent material movements involving your site.</CardDescription>
          </CardHeader>
          <CardContent>
            {siteRecentActivity.length > 0 ? (
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
                    {siteRecentActivity.map(activity => (
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
            ) : (
                <p className="text-center text-muted-foreground p-8">No recent activity on this site.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
