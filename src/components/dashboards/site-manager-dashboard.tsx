'use client';

import {
  Package,
  PackageCheck,
  PackageSearch,
  AlertTriangle,
  History,
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

export default function SiteManagerDashboard() {
  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Site Manager Dashboard</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Available Materials"
            value="125 items"
            icon={PackageSearch}
            description="Total distinct materials on site"
          />
          <StatCard
            title="Pending Requests"
            value="3"
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
            value="1 material"
            icon={AlertTriangle}
            className="text-destructive border-destructive/50"
            description="Needs immediate re-ordering"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
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

          <Card className="lg:col-span-2">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <History className="h-6 w-6" />
                    <CardTitle>Recent Site Activity</CardTitle>
                </div>
              <CardDescription>
                Latest material movements and requests for this site.
              </CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSiteActivity.map(activity => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.type}</TableCell>
                      <TableCell>{activity.details} <span className="text-muted-foreground text-xs">{activity.to ? `to ${activity.to}` : `from ${activity.from}`}</span></TableCell>
                      <TableCell>
                        <Badge
                          variant={activity.status === 'Completed' ? 'default' : activity.status === 'Pending' ? 'secondary' : 'outline'}
                          className={activity.status === 'Pending' ? 'bg-accent text-accent-foreground hover:bg-accent/80' : activity.status === 'In Transit' ? 'text-destructive' : ''}
                        >
                          {activity.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        {/* Placeholder for BOQ-based usage */}
        <Card>
            <CardHeader>
                <CardTitle>BOQ-Based Material Usage</CardTitle>
                <CardDescription>Consumption analysis based on Bill of Quantities.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Charts and tables for BOQ item-wise, engineer-wise, and building-wise usage will be displayed here.</p>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
