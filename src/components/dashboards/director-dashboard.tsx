'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { useRouter } from 'next/navigation';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/dashboard/stat-card';
import {
  Package,
  AlertTriangle,
  PackageSearch,
  Eye,
  ChevronDown,
  FileText,
  Download,
  BarChart as BarChartIcon,
  FileSpreadsheet,
} from 'lucide-react';
import {
  monthlyConsumption,
  recentTransfers,
  detailedMonthlyConsumption,
  detailedStock,
  stockUpdates,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useMaterialContext, type IndentStatus, type InventoryItem } from '@/context/material-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


const chartConfig: ChartConfig = {
  consumption: {
    label: 'Consumption',
    color: 'hsl(var(--primary))',
  },
};

type RequestFormValues = {
  requesterName: string;
  requestingSite: string;
  materials: { materialName: string; quantity: number; rate: number }[];
  requiredPeriod: { from: Date; to: Date };
  remarks?: string;
};
type MaterialIndentBill = RequestFormValues & {
  requestId: string;
  requestDate: Date;
  issuedId: string;
  issuingSite?: string;
  shiftingDate: Date;
  requester: { name: string } | null;
  totalValue: number;
};

export default function DirectorDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { requests, setRequests, inventory } = useMaterialContext();
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialIndentBill | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null);
  const [isConsumptionDialogOpen, setIsConsumptionDialogOpen] = React.useState(false);
  const [consumptionSite, setConsumptionSite] = React.useState('All');
  const [stockSite, setStockSite] = React.useState('Overall');
  const [lowStockSite, setLowStockSite] = React.useState('All');

  const indentsForApproval = requests.filter(r => r.status === 'Pending Director Approval');
  
  const lowStockMaterials = React.useMemo(() => {
    return inventory.filter(item => item.quantity <= item.minQty);
  }, [inventory]);

  const filteredLowStockMaterials = React.useMemo(() => {
    if (lowStockSite === 'All') return lowStockMaterials;
    return lowStockMaterials.filter(item => item.site === lowStockSite);
  }, [lowStockMaterials, lowStockSite]);

  const sites = ['All', ...new Set(inventory.map(item => item.site))];

  const lowStockCount = lowStockMaterials.length;

  const stockLocations = ['Overall', 'MAPI Godown', ...new Set(inventory.map(s => s.site).filter(s => s !== 'MAPI Godown'))];
  const consumptionSites = ['All', ...new Set(detailedMonthlyConsumption.Jun.siteWise.map((s:any) => s.site))];

  const totalMaterials = React.useMemo(() => {
    return inventory.reduce((acc, item) => acc + item.quantity, 0);
  }, [inventory]);

  const stockTableData = React.useMemo(() => {
    if (stockSite === 'Overall') {
      return inventory;
    }
    return inventory.filter((item) => item.site === stockSite);
  }, [inventory, stockSite]);

  const handleStatusChange = (reqId: string, newStatus: IndentStatus) => {
    setRequests(requests.map(req => (req.id === reqId ? { ...req, status: newStatus } : req)));
    toast({
      title: `Indent ${newStatus}`,
      description: `Indent ID ${reqId} has been updated. A notification has been sent.`,
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

  const handleDownloadExcel = (reportName: string, site: string) => {
    toast({
      title: 'Download Started',
      description: `Your ${reportName} for ${site} is being generated.`,
    });
  };
  
  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const month = data.activePayload[0].payload.month;
      setSelectedMonth(month);
      setConsumptionSite('All'); // Reset site filter on new month selection
      setIsConsumptionDialogOpen(true);
    }
  };
  
  const selectedMonthData = selectedMonth ? detailedMonthlyConsumption[selectedMonth as keyof typeof detailedMonthlyConsumption] : null;


  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Director Dashboard</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="BOQ Analysis"
            value="Open Analyzer"
            icon={FileSpreadsheet}
            description="Compare planned vs actuals"
            className="border-primary/50"
            onClick={() => router.push('/dashboard/boq-analysis')}
          />

          <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Total Materials" value={`${totalMaterials.toLocaleString()} units`} icon={PackageSearch} description={`Across ${new Set(inventory.map(i => i.site)).size} sites`} />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                  <DialogTitle>Material Stock Distribution</DialogTitle>
                  <DialogDescription>Detailed view of material stock, including transfers and mismatches.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                  <div>
                      <h3 className="text-lg font-semibold mb-2">Stock Mismatches</h3>
                      <Table>
                          <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Site</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Actual Qty</TableHead><TableHead className="text-right">Expected Qty</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {detailedStock.filter(s => s.mismatch).map(item => (
                                  <TableRow key={item.id} className="text-destructive">
                                      <TableCell className="font-medium">{item.material}</TableCell>
                                      <TableCell>{item.site}</TableCell>
                                      <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                                      <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                                      <TableCell className="text-right">{item.expected}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
                  <div>
                      <h3 className="text-lg font-semibold mb-2">Full Stock Ledger</h3>
                      <Table>
                          <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Site</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Quantity</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {detailedStock.map(item => (
                                  <TableRow key={item.id}>
                                      <TableCell className="font-medium">{item.material}</TableCell>
                                      <TableCell>{item.site}</TableCell>
                                      <TableCell><Badge variant="secondary">{item.type}</Badge></TableCell>
                                      <TableCell className="text-right">{item.quantity}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
                   <div>
                      <h3 className="text-lg font-semibold mb-2">Last 5 Stock Updates</h3>
                      <Table>
                          <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Site</TableHead><TableHead>Change</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {stockUpdates.map(item => (
                                  <TableRow key={item.id}>
                                      <TableCell>{item.material}</TableCell>
                                      <TableCell>{item.site}</TableCell>
                                      <TableCell className={cn(item.change.startsWith('+') ? 'text-green-600' : 'text-red-600')}>{item.change}</TableCell>
                                      <TableCell>{item.date}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
              </div>
              <DialogFooter>
                  <Button onClick={() => handleDownloadExcel('Full Ledger', 'All Sites')}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Full Ledger
                  </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <StatCard
                  title="Pending Your Approval"
                  value={indentsForApproval.length.toString()}
                  icon={Package}
                  description={`From ${new Set(indentsForApproval.map(p => p.site)).size} sites`}
                  className="border-yellow-500/50"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Indents Awaiting Your Approval</DialogTitle>
                <DialogDescription>Review and approve or reject material indents from sites.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                {indentsForApproval.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Indent ID</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indentsForApproval.map(req => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.id}</TableCell>
                        <TableCell>{req.material}</TableCell>
                        <TableCell>{req.quantity}</TableCell>
                        <TableCell>{req.site}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Actions <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewBill(req.id)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Director Approved')}>
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Director Rejected')} className="text-destructive">
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground p-4">No indents are currently awaiting your approval.</p>
              )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <StatCard
                  title="Low Stock Alerts"
                  value={`${lowStockCount} materials`}
                  icon={AlertTriangle}
                  description="Across all sites"
                  className="text-destructive border-destructive/50"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Low Stock Material Alerts</DialogTitle>
                <div className="flex justify-between items-center pt-2">
                  <DialogDescription>Materials that have fallen below their minimum required quantity.</DialogDescription>
                   <Select value={lowStockSite} onValueChange={setLowStockSite}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by site..." />
                      </SelectTrigger>
                      <SelectContent>
                          {sites.map(site => <SelectItem key={site} value={site}>{site}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
              </DialogHeader>
               <div className="max-h-[60vh] overflow-y-auto">
                {filteredLowStockMaterials.length > 0 ? (
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
                          {filteredLowStockMaterials.map((item: InventoryItem) => (
                          <TableRow key={item.id} className="text-destructive">
                              <TableCell className="font-medium">{item.material}</TableCell>
                              <TableCell>{item.site}</TableCell>
                              <TableCell className="text-right font-bold">{`${item.quantity} ${item.unit}`}</TableCell>
                              <TableCell className="text-right">{`${item.minQty} ${item.unit}`}</TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground p-8">No low stock alerts.</p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => handleDownloadExcel('Low Stock Report', lowStockSite)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <Dialog open={isConsumptionDialogOpen} onOpenChange={setIsConsumptionDialogOpen}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Monthly Consumption</CardTitle>
                      <CardDescription>Total material consumption over the last 6 months.</CardDescription>
                    </div>
                    <BarChartIcon className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                      <BarChart data={monthlyConsumption} accessibilityLayer onClick={handleBarClick}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="consumption" fill="var(--color-consumption)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Monthly Consumption Details: {selectedMonth}</DialogTitle>
                  <div className="flex justify-between items-center pt-2">
                    <DialogDescription>
                      Detailed material consumption for {selectedMonth}.
                    </DialogDescription>
                    <Select value={consumptionSite} onValueChange={setConsumptionSite}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a Site" />
                        </SelectTrigger>
                        <SelectContent>
                            {consumptionSites.map(site => <SelectItem key={site} value={site}>{site}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                </DialogHeader>
                {selectedMonthData ? (
                  <div className="max-h-[60vh] overflow-y-auto space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Organization-wise Consumption</h3>
                       <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead className="text-right">Total Quantity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedMonthData.organizationWise.map((item:any) => (
                              <TableRow key={item.name}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Site-wise Consumption</h3>
                       {(selectedMonthData.siteWise.filter((s:any) => consumptionSite === 'All' || s.site === consumptionSite)).map((siteData:any) => (
                         <div key={siteData.site} className="mb-4">
                           <h4 className="font-medium text-md mb-1">{siteData.site}</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Material</TableHead>
                                  <TableHead className="text-right">Quantity</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {siteData.materials.map((material:any) => (
                                  <TableRow key={material.name}>
                                    <TableCell>{material.name}</TableCell>
                                    <TableCell className="text-right">{material.quantity} {material.unit}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                         </div>
                       ))}
                    </div>
                  </div>
                ) : (
                  <p>Select a month from the chart to see details.</p>
                )}
                <DialogFooter>
                  <Button onClick={() => handleDownloadExcel(`Consumption for ${selectedMonth}`, consumptionSite)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Material Stock Distribution</CardTitle>
                        <CardDescription>Stock levels by material and site.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={stockSite} onValueChange={setStockSite}>
                          <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select Location" />
                          </SelectTrigger>
                          <SelectContent>
                              {stockLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" onClick={() => handleDownloadExcel('Stock Distribution', stockSite)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[250px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Site</TableHead>
                                <TableHead>Material Name</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stockTableData.length > 0 ? (
                                stockTableData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.site}</TableCell>
                                        <TableCell>{item.material}</TableCell>
                                        <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">No stock data available for this selection.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            {lastGeneratedBill && (
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText /> Material Indent Bill
                    </CardTitle>
                    <CardDescription>This is the generated bill for the selected indent.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 rounded-lg border p-4">
                      <h3 className="font-semibold">Indent Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>
                          <strong>Indent ID:</strong> {lastGeneratedBill.requestId}
                        </p>
                        <p>
                          <strong>Indent Date:</strong> {format(lastGeneratedBill.requestDate, 'PPP')}
                        </p>
                        <p>
                          <strong>Requesting Site:</strong> {lastGeneratedBill.requestingSite}
                        </p>
                        <p>
                          <strong>Requester:</strong> {lastGeneratedBill.requester?.name}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 rounded-lg border p-4">
                      <h3 className="font-semibold">Issue Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>
                          <strong>Issuing Site:</strong> {lastGeneratedBill.issuingSite}
                        </p>
                        <p>
                          <strong>Issued ID:</strong> {lastGeneratedBill.issuedId}
                        </p>
                        <p>
                          <strong>Shifting Date:</strong> {format(lastGeneratedBill.shiftingDate, 'PPP')}
                        </p>
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
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Material Indent Return Reminders</CardTitle>
                <CardDescription>Materials due for return or with extended dates.</CardDescription>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.slice(0, 3).map(req => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.material}</TableCell>
                        <TableCell>{req.quantity}</TableCell>
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
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>All Material Indent Return Reminders</DialogTitle>
              <DialogDescription>Materials due for return or with extended dates.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indent ID</TableHead>
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
                      <TableCell className="font-medium">{req.id}</TableCell>
                      <TableCell>{req.material}</TableCell>
                      <TableCell>{req.issuingSite || 'Pending Assignment'}</TableCell>
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
                        {req.status === 'Pending Director Approval' && (
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Update Status <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Director Approved')}>
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Director Rejected')} className="text-destructive">
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button onClick={() => handleDownloadExcel('Return Reminders', 'All Sites')}>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Card>
          <CardHeader>
            <CardTitle>Recent Material Transfers</CardTitle>
            <CardDescription>An overview of recent material movements between sites and vendors.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Issuing Site</TableHead>
                  <TableHead>Receiving Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransfers.map(transfer => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">{transfer.material}</TableCell>
                    <TableCell>{transfer.issuingSite}</TableCell>
                    <TableCell>{transfer.receivingSite}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transfer.status === 'Completed'
                            ? 'default'
                            : transfer.status === 'In Transit'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className={cn(
                           transfer.status === 'Completed' && 'bg-green-600/80',
                           transfer.status === 'PO Generated' && 'bg-purple-500/80'
                        )}
                      >
                        {transfer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{transfer.date}</TableCell>
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
