'use client';

import { BarChart, Users, Building, FileText, Eye, ChevronDown, Download, Layers } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useMaterialContext, type IndentStatus } from '@/context/material-context';
import { boqUsage, engineerUsage, boqVsActual } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


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


export default function CoordinatorDashboard() {
  const { toast } = useToast();
  const { requests, setRequests, pendingRequests } = useMaterialContext();
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialIndentBill | null>(null);
  const [comparisonSite, setComparisonSite] = React.useState<string>('North Site');

  const filteredComparisonData = React.useMemo(() => {
    return boqVsActual.filter(d => d.site === comparisonSite);
  }, [comparisonSite]);


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

  const handleDownloadExcel = (reportName: string) => {
    toast({
      title: "Download Started",
      description: `Your ${reportName} Excel file is being generated.`,
    });
  };


  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Coordinator Dashboard</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard
                        title="Total Usage (BOQ)"
                        value={`${boqUsage.filter(b => b.status === 'Over Budget').length} Over Budget`}
                        icon={BarChart}
                        description="Across active projects"
                        className="text-destructive border-destructive/50"
                    />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                  <DialogTitle>BOQ Item-Wise Material Usage</DialogTitle>
                  <DialogDescription>Comparison of actual vs. budgeted material consumption.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                  {boqUsage.length > 0 ? (
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
                  ) : (
                    <p className="text-center text-muted-foreground">No BOQ usage data available.</p>
                  )}
              </div>
              <div className="flex justify-end gap-4 mt-4">
                  <Button onClick={() => handleDownloadExcel('BOQ Usage Report')}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Excel
                  </Button>
              </div>
            </DialogContent>
          </Dialog>
           <Dialog>
             <DialogTrigger asChild>
                 <div className="cursor-pointer">
                     <StatCard
                         title="BOQ vs Actual"
                         value="View Comparison"
                         icon={Layers}
                         description="Compare planned vs actual"
                         className="border-primary/50"
                     />
                 </div>
             </DialogTrigger>
             <DialogContent className="max-w-6xl">
                 <DialogHeader>
                     <DialogTitle>BOQ vs. Actual Comparison</DialogTitle>
                     <DialogDescription>
                         Compare planned BOQ quantities and rates with actuals from daily progress reports.
                     </DialogDescription>
                 </DialogHeader>
                 <div className="my-4">
                      <Select value={comparisonSite} onValueChange={setComparisonSite}>
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Select a site to compare" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...new Set(boqVsActual.map(d => d.site))].map(site => (
                             <SelectItem key={site} value={site}>{site}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                 </div>
                 <div className="max-h-[60vh] overflow-y-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>BOQ Item</TableHead>
                                  <TableHead className="text-right">BOQ Qty</TableHead>
                                  <TableHead className="text-right">Actual Qty</TableHead>
                                  <TableHead className="text-right">Qty Variance</TableHead>
                                  <TableHead className="text-right">BOQ Rate</TableHead>
                                  <TableHead className="text-right">Actual Rate</TableHead>
                                  <TableHead className="text-right">Rate Variance</TableHead>
                                  <TableHead className="text-right">Cost Variance</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {filteredComparisonData.map(item => {
                                const qtyVariance = item.actualQty - item.boqQty;
                                const rateVariance = item.actualRate - item.boqRate;
                                const costVariance = (item.actualQty * item.actualRate) - (item.boqQty * item.boqRate);

                                return (
                                  <TableRow key={item.item}>
                                      <TableCell className="font-medium">{item.item}</TableCell>
                                      <TableCell className="text-right">{item.boqQty}</TableCell>
                                      <TableCell className="text-right">{item.actualQty}</TableCell>
                                      <TableCell className={cn("text-right", qtyVariance > 0 ? "text-destructive" : "text-green-600")}>
                                          {qtyVariance > 0 ? `+${qtyVariance}` : qtyVariance}
                                      </TableCell>
                                      <TableCell className="text-right">${item.boqRate.toFixed(2)}</TableCell>
                                      <TableCell className="text-right">${item.actualRate.toFixed(2)}</TableCell>
                                      <TableCell className={cn("text-right", rateVariance > 0 ? "text-destructive" : "text-green-600")}>
                                          ${rateVariance.toFixed(2)}
                                      </TableCell>
                                      <TableCell className={cn("text-right font-semibold", costVariance > 0 ? "text-destructive" : "text-green-600")}>
                                          ${costVariance.toFixed(2)}
                                      </TableCell>
                                  </TableRow>
                                )
                              })}
                          </TableBody>
                      </Table>
                 </div>
             </DialogContent>
          </Dialog>
          <StatCard
            title="Sites Overview"
            value={`${new Set(requests.map(r => r.site)).size} Sites`}
            icon={Building}
            description="Total active project sites"
          />

          <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard
                        title="Pending Indents"
                        value={pendingRequests.length.toString()}
                        icon={FileText}
                        description="Awaiting action"
                    />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                  <DialogTitle>Pending Indents</DialogTitle>
                  <DialogDescription>Material indents awaiting action across all sites.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                {pendingRequests.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Site</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingRequests.map((item) => (
                                <TableRow key={item.id} className="text-sm">
                                    <TableCell className="font-medium">{item.material}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.site}</TableCell>
                                    <TableCell>
                                    <Badge 
                                        variant={item.status === 'Partially Issued' ? 'destructive' : 'secondary'}
                                        className={cn(item.status === 'Partially Issued' && 'bg-orange-500/80 text-white')}
                                    >
                                        {item.status}
                                    </Badge>
                                    </TableCell>
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
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>BOQ Item-Wise Material Usage</CardTitle>
                        <CardDescription>Comparison of actual vs. budgeted material consumption.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {boqUsage.length > 0 ? (
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
                                  {boqUsage.slice(0, 4).map(item => (
                                      <TableRow key={item.item}>
                                          <TableCell className="font-medium">{item.item}</TableCell>
                                          <TableCell>{item.consumed}</TableCell>
                                          <TableCell>{item.budget}</TableCell>
                                          <TableCell className={item.status === 'Over Budget' ? 'text-destructive' : ''}>{item.status}</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground">No BOQ usage data available.</p>
                      )}
                    </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Indents</CardTitle>
                    <CardDescription>Material indents awaiting action across all sites.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingRequests.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Material</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Site</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.map((item) => (
                                    <TableRow key={item.id} className="text-sm">
                                        <TableCell className="font-medium">{item.material}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.site}</TableCell>
                                        <TableCell>
                                        <Badge 
                                            variant={item.status === 'Partially Issued' ? 'destructive' : 'secondary'}
                                            className={cn(item.status === 'Partially Issued' && 'bg-orange-500/80 text-white')}
                                        >
                                            {item.status}
                                        </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground">No pending indents.</p>
                    )}
                  </CardContent>
                </Card>
            </div>
            {lastGeneratedBill && (
              <div className="lg:col-span-1">
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
                            <TableHead>Issuing Site</TableHead>
                            <TableHead>Requesting Site</TableHead>
                            <TableHead>Return Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.material}</TableCell>
                                <TableCell>{req.issuingSite || 'Pending'}</TableCell>
                                <TableCell>{req.site}</TableCell>
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
                <p className="text-center text-muted-foreground">No return reminders.</p>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => handleDownloadExcel('Return Reminders Report')}>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle>Engineer-Wise Material Usage</CardTitle>
                    <CardDescription>Material consumption handled by each engineer.</CardDescription>
                </CardHeader>
                <CardContent>
                {engineerUsage.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Engineer Name</TableHead>
                                <TableHead>Materials</TableHead>
                                <TableHead>Site</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {engineerUsage.slice(0, 4).map(eng => (
                                <TableRow key={eng.name}>
                                    <TableCell className="font-medium">{eng.name}</TableCell>
                                    <TableCell>{eng.materials}</TableCell>
                                    <TableCell>{eng.site}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground">No engineer usage data available.</p>
                )}
                </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Engineer-Wise Material Usage</DialogTitle>
              <DialogDescription>Material consumption handled by each engineer.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {engineerUsage.length > 0 ? (
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
              ) : (
                <p className="text-center text-muted-foreground">No engineer usage data available.</p>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => handleDownloadExcel('Engineer Usage Report')}>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
