"use client"

import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/dashboard/stat-card";
import { DollarSign, Package, Truck, Warehouse } from "lucide-react";
import { monthlyConsumption, materialStock, recentActivities } from "@/lib/mock-data";

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
        <StatCard title="Total Sites" value="12" icon={Warehouse} description="2 active projects" />
        <StatCard title="Pending Requests" value="5" icon={Package} description="+3 from yesterday" />
        <StatCard title="Materials in Transit" value="8" icon={Truck} description="3 shipments delayed" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
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
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>An overview of recent material movements and requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Site/Store</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivities.map(activity => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.id}</TableCell>
                  <TableCell>{activity.type}</TableCell>
                  <TableCell>{activity.site}</TableCell>
                  <TableCell>
                    <Badge variant={activity.status === 'Completed' || activity.status === 'Approved' || activity.status === 'Uploaded' ? 'default' : activity.status === 'In Transit' ? 'destructive' : 'secondary'} className={activity.status === 'Pending' ? 'bg-accent text-accent-foreground hover:bg-accent/80' : ''}>
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
