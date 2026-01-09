'use client';

import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/dashboard/stat-card';
import {
  DollarSign,
  Package,
  AlertTriangle,
  PackageSearch,
  Eye,
  ChevronDown,
  FileText,
  Download,
  BarChart as BarChartIcon,
  Building,
} from 'lucide-react';
import {
  monthlyConsumption,
  materialStock,
  recentActivities,
  lowStockMaterials as initialLowStockMaterials,
  pendingRequests as initialPendingRequests,
  materialReturnReminders as initialRequests,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { allMaterials } from '@/lib/mock-data';

const chartConfig: ChartConfig = {
  consumption: {
    label: 'Consumption',
    color: 'hsl(var(--primary))',
  },
};

const pieChartConfig = {
  Cement: { label: 'Cement', color: 'hsl(var(--chart-1))' },
  Steel: { label: 'Steel', color: 'hsl(var(--chart-2))' },
  Sand: { label: 'Sand', color: 'hsl(var(--chart-3))' },
  Bricks: { label: 'Bricks', color: 'hsl(var(--chart-4))' },
  Gravel: { label: 'Gravel', color: 'hsl(var(--chart-5))' },
  Paint: { label: 'Paint', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const COLORS = Object.values(pieChartConfig).map(c => c.color);

type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Issued' | 'Completed' | 'Mismatch' | 'Extended';
type RequestFormValues = {
  requesterName: string;
  requestingSite: string;
  issuingSite: string;
  materials: { materialName: string; quantity: number; rate: number }[];
  requiredPeriod: { from: Date; to: Date };
  remarks?: string;
};
type MaterialRequestBill = RequestFormValues & {
  requestId: string;
  requestDate: Date;
  issuedId: string;
  shiftingDate: Date;
  requester: { name: string } | null;
  totalValue: number;
};

const sites = ['North Site', 'South Site', 'West Site', 'East Site', 'MAPI Store'];
const detailedMaterialValue = allMaterials.flatMap(m =>
  sites.map(site => ({
    ...m,
    id: `${m.id}-${site}`,
    site,
    quantity: Math.floor(Math.random() * 200) + 20,
    rate: Math.floor(Math.random() * 50) + 10,
  }))
);

const totalValue = detailedMaterialValue.reduce((acc, item) => acc + item.quantity * item.rate, 0);

const siteWiseTotal = detailedMaterialValue.reduce((acc, item) => {
    if (!acc[item.site]) {
        acc[item.site] = 0;
    }
    acc[item.site] += item.quantity * item.rate;
    return acc;
}, {} as Record<string, number>);


export default function DirectorDashboard() {
  const { toast } = useToast();
  const [requests, setRequests] = React.useState(initialRequests);
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialRequestBill | null>(null);
  const [pendingRequests, setPendingRequests] = React.useState(initialPendingRequests);
  const [lowStockMaterials, setLowStockMaterials] = React.useState(initialLowStockMaterials);

  const handleStatusChange = (reqId: string, newStatus: RequestStatus) => {
    setRequests(requests.map(req => (req.id === reqId ? { ...req, status: newStatus } : req)));
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
      const idParts = request.id.split('-');
      const datePart = idParts.length > 2 ? idParts[2] : format(requestDate, 'yyyyMMdd');
      const countPart = idParts.length > 3 ? idParts[3] : request.id.slice(-3);
      const siteCode = idParts.length > 1 ? idParts[1] : 'SITE';

      const bill: MaterialRequestBill = {
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
      title: 'Download Started',
      description: 'Your Excel file is being generated and will download shortly.',
    });
  };

  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Director Dashboard</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Dialog>
            <DialogTrigger asChild>
              <StatCard
                title="Total Material Value"
                value={`$${(totalValue / 1000000).toFixed(1)}M`}
                icon={DollarSign}
                description="+20.1% from last month"
                onClick={() => {}}
              />
            </DialogTrigger>
            <DialogContent className="max-w-6xl">
              <DialogHeader>
                <DialogTitle>Total Material Value Breakdown</DialogTitle>
                <DialogDescription>
                  A detailed breakdown of all materials, their quantities, rates, and total values across the organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                  <div className="md:col-span-1 space-y-4">
                      <Card>
                          <CardHeader>
                              <CardTitle>Site-wise Value</CardTitle>
                          </CardHeader>
                          <CardContent>
                              <div className="space-y-2">
                                  {Object.entries(siteWiseTotal).map(([site, value]) => (
                                      <div key={site} className="flex justify-between items-center text-sm">
                                          <div className="flex items-center gap-2">
                                              <Building className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">{site}</span>
                                          </div>
                                          <span className="font-mono">${value.toLocaleString()}</span>
                                      </div>
                                  ))}
                              </div>
                              <Separator className="my-4" />
                              <div className="flex justify-between font-bold">
                                  <span>Grand Total</span>
                                  <span>${totalValue.toLocaleString()}</span>
                              </div>
                          </CardContent>
                      </Card>
                  </div>
                  <div className="md:col-span-3">
                      <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
                          <Table>
                          <TableHeader className="sticky top-0 bg-background">
                              <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead>Site</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Avg. Rate</TableHead>
                              <TableHead className="text-right">Total Value</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {detailedMaterialValue.map(item => (
                              <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.name}</TableCell>
                                  <TableCell>{item.site}</TableCell>
                                  <TableCell className="text-right">
                                  {item.quantity} {item.unit}
                                  </TableCell>
                                  <TableCell className="text-right">${item.rate.toFixed(2)}</TableCell>
                                  <TableCell className="text-right font-medium">${(item.quantity * item.rate).toLocaleString()}</TableCell>
                              </TableRow>
                              ))}
                          </TableBody>
                          </Table>
                      </div>
                  </div>
              </div>
              <div className="flex justify-end gap-4 mt-4">
                  <Button onClick={handleDownloadExcel}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Excel
                  </Button>
              </div>
            </DialogContent>
          </Dialog>

          <StatCard title="Total Materials" value="5,842 units" icon={PackageSearch} description="Across 12 sites" />

          <Dialog>
            <DialogTrigger asChild>
              <StatCard
                title="Pending Requests"
                value={pendingRequests.length.toString()}
                icon={Package}
                description={`From ${new Set(pendingRequests.map(p => p.site)).size} sites`}
                onClick={() => {}}
              />
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Pending Requests</DialogTitle>
                <DialogDescription>Material requests from various sites awaiting action.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
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
              </div>
               <div className="flex justify-end mt-4">
                  <Button onClick={handleDownloadExcel}>
                      <Download className="mr-2 h-4 w-4" />
                      Export List
                  </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <StatCard
                title="Low Stock Alerts"
                value={`${lowStockMaterials.length} materials`}
                icon={AlertTriangle}
                description={`At ${new Set(lowStockMaterials.map(m => m.site)).size} sites`}
                className="text-destructive border-destructive/50"
                onClick={() => {}}
              />
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Low Stock Material Alerts</DialogTitle>
                <DialogDescription>Materials that have fallen below the minimum required quantity.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead className="text-right">Current Qty</TableHead>
                      <TableHead className="text-right">Min. Threshold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockMaterials.map(item => (
                      <TableRow key={item.id} className="text-destructive">
                        <TableCell className="font-medium">{item.material}</TableCell>
                        <TableCell>{item.site}</TableCell>
                        <TableCell className="text-right font-bold">{`${item.quantity} ${item.unit}`}</TableCell>
                        <TableCell className="text-right">{`${item.threshold} ${item.unit}`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
        
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <Dialog>
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
                      <BarChart data={monthlyConsumption} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="consumption" fill="var(--color-consumption)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Monthly Consumption Details</DialogTitle>
                  <DialogDescription>Detailed material consumption data for the last 6 months.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Consumption (units)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyConsumption.map(item => (
                        <TableRow key={item.month}>
                          <TableCell className="font-medium">{item.month}</TableCell>
                          <TableCell className="text-right">{item.consumption.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                <CardTitle>Material Stock Distribution</CardTitle>
                <CardDescription>Overall stock distribution by material type.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ChartContainer config={pieChartConfig} className="h-[250px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie data={materialStock} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {materialStock.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
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
                      <TableHead>Qty</TableHead>
                      <TableHead>Site</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map(item => (
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
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Materials</CardTitle>
                <CardDescription>Materials running below the minimum threshold.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockMaterials.map(item => (
                      <TableRow key={item.id} className="text-sm text-destructive">
                        <TableCell className="font-medium">{item.material}</TableCell>
                        <TableCell>{item.site}</TableCell>
                        <TableCell className="font-bold">{`${item.quantity} ${item.unit}`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            {lastGeneratedBill && (
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText /> Material Request Bill
                    </CardTitle>
                    <CardDescription>This is the generated bill for the selected request.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 rounded-lg border p-4">
                      <h3 className="font-semibold">Request Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>
                          <strong>Request ID:</strong> {lastGeneratedBill.requestId}
                        </p>
                        <p>
                          <strong>Request Date:</strong> {format(lastGeneratedBill.requestDate, 'PPP')}
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
                <CardTitle>Material Return Reminders</CardTitle>
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
                              req.status === 'Pending'
                                ? 'secondary'
                                : req.status === 'Approved'
                                ? 'default'
                                : req.status === 'Issued'
                                ? 'default'
                                : req.status === 'Completed'
                                ? 'outline'
                                : 'destructive'
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
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>All Material Return Reminders</DialogTitle>
              <DialogDescription>Materials due for return or with extended dates.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
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
                            req.status === 'Pending'
                              ? 'secondary'
                              : req.status === 'Approved'
                              ? 'default'
                              : req.status === 'Issued'
                              ? 'default'
                              : req.status === 'Completed'
                              ? 'outline'
                              : 'destructive'
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
                            <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Approved')}>
                              Approved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Rejected')}>
                              Rejected
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Issued')}>Issued</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Completed')}>
                              Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'Mismatch')}>
                              Mismatch
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>An overview of recent material movements and requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Site/Store</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map(activity => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.type}</TableCell>
                    <TableCell>{activity.details}</TableCell>
                    <TableCell>{activity.site}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          activity.status === 'Completed' || activity.status === 'Approved' || activity.status === 'Uploaded'
                            ? 'default'
                            : activity.status === 'In Transit' || activity.status === 'Delayed'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className={
                          activity.status === 'Pending' ? 'bg-accent text-accent-foreground hover:bg-accent/80' : ''
                        }
                      >
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
