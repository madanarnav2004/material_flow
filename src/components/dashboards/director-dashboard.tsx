"use client"

import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/dashboard/stat-card";
import { DollarSign, Package, AlertTriangle, PackageSearch } from "lucide-react";
import { monthlyConsumption, materialStock, recentActivities, lowStockMaterials, pendingRequests, materialReturnReminders } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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

export default function DirectorDashboard() {
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
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
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
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {materialReturnReminders.map(req => (
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
                                        req.status === 'Extended' && 'border-amber-500/50 text-amber-500'
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