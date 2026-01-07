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
import { materialReturnReminders } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

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

const pendingSiteRequests = [
    { id: 'pr-1', material: 'Cement', quantity: '100 bags', requestedFrom: 'MAPI Store'},
    { id: 'pr-2', material: 'Gravel', quantity: '10 m³', requestedFrom: 'West Site'},
];

const lowStockSite = [
    { id: 'ls-1', name: 'Bricks', quantity: '5000 pcs' }
]

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
            value="2"
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                                <TableHead>Quantity</TableHead>
                                <TableHead>From</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingSiteRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.material}</TableCell>
                                    <TableCell>{req.quantity}</TableCell>
                                    <TableCell>{req.requestedFrom}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                   </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Low Stock Materials</CardTitle>
                    <CardDescription>Materials running low on this site.</CardDescription>
                </CardHeader>
                <CardContent>
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
                                    <TableCell className="font-medium">{item.name}</TableCell>
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
              <CardDescription>Materials due for return or with extended dates for this site.</CardDescription>
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
                      {materialReturnReminders.slice(0,3).map(req => (
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
      </div>
    </>
  );
}