"use client"

import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/dashboard/stat-card";
import { DollarSign, Package, AlertTriangle, PackageSearch, Eye, ChevronDown, FileText, Download } from "lucide-react";
import { monthlyConsumption, materialStock, recentActivities, lowStockMaterials, pendingRequests, materialReturnReminders as initialRequests } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import * as React from 'react';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const chartConfig: ChartConfig = {
  consumption: {
    label: "Consumption",
    color: "hsl(var(--primary))",
  },
};

const pieChartConfig = {
    Cement: { label: 'Cement', color: 'hsl(var(--chart-1))' },
    Steel: { label: 'Steel', color: 'hsl(var(--chart-2))' },
    Sand: { label: 'Sand', color: 'hsl(var(--chart-3))' },
    Bricks: { label: 'Bricks', color: 'hsl(var(--chart-4))' },
    Gravel: { label: 'Gravel', color: 'hsl(var(--chart-5))' },
    Paint: { label: 'Paint', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig

const COLORS = Object.values(pieChartConfig).map(c => c.color);

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

export default function DirectorDashboard() {
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
    <h1 className="text-3xl font-bold font-headline">Director Dashboard</h1>
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Material Value" value="$1.2M" icon={DollarSign} description="+20.1% from last month" />
        <StatCard title="Total Materials" value="5,842 units" icon={PackageSearch} description="Across 12 sites" />
        <StatCard title="Pending Requests" value="3" icon={Package} description="From 3 sites" />
        <StatCard title="Low Stock Alerts" value="3 materials" icon={AlertTriangle} description="At 2 sites" className="text-destructive border-destructive/50" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Consumption</CardTitle>
                <CardDescription>Total material consumption over the last 6 months.</CardDescription>
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
                        {lowStockMaterials.map((item) => (
                            <TableRow key={item.id} className="text-sm text-destructive">
                                <TableCell className="font-medium">{item.material}</TableCell>
                                <TableCell>{item.site}</TableCell>
                                <TableCell className="font-bold">{item.quantity}</TableCell>
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
      </div>

      <Card>
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
                      <Badge variant={activity.status === 'Completed' || activity.status === 'Approved' || activity.status === 'Uploaded' ? 'default' : activity.status === 'In Transit' || activity.status === 'Delayed' ? 'destructive' : 'secondary'} className={activity.status === 'Pending' ? 'bg-accent text-accent-foreground hover:bg-accent/80' : ''}>
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
