'use client';

import { BarChart, Users, Building, FileText, BarChart2 } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { pendingRequests } from '@/lib/mock-data';

const boqUsage = [
  { item: 'Concrete Works', consumed: '120 m³', budget: '150 m³', status: 'On Track' },
  { item: 'Reinforcement', consumed: '25 tons', budget: '22 tons', status: 'Over Budget' },
  { item: 'Brickwork', consumed: '8000 pcs', budget: '10000 pcs', status: 'On Track' },
];

const engineerUsage = [
    { name: 'R. Sharma', materials: 'Cement, Steel', site: 'North Site' },
    { name: 'S. Gupta', materials: 'Bricks, Sand', site: 'West Site' },
    { name: 'P. Verma', materials: 'Gravel, Paint', site: 'South Site' },
];

export default function CoordinatorDashboard() {
  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Coordinator Dashboard</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Usage (BOQ)"
            value="85%"
            icon={BarChart}
            description="Across 5 active projects"
          />
          <StatCard
            title="Engineers Monitored"
            value="12"
            icon={Users}
            description="Active on 3 sites"
          />
          <StatCard
            title="Sites Overview"
            value="3 Sites"
            icon={Building}
            description="North, South, West"
          />
           <StatCard
            title="Pending Requests"
            value="3"
            icon={FileText}
            description="Awaiting action"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>BOQ Item-Wise Material Usage</CardTitle>
                    <CardDescription>Comparison of actual vs. budgeted material consumption.</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>Material requests awaiting action across all sites.</CardDescription>
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
        <Card>
            <CardHeader>
                <CardTitle>Engineer-Wise Material Usage</CardTitle>
                <CardDescription>Material consumption handled by each engineer.</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
      </div>
    </>
  );
}