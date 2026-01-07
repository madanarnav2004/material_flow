'use client';

import {
  Package,
  PackageSearch,
  AlertTriangle,
  Truck,
  History,
  Building,
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
import { Progress } from '@/components/ui/progress';
import { pendingRequests, lowStockMaterials, materialReturnReminders } from '@/lib/mock-data';
import { cn } from '@/lib/utils';


const storeInventory = [
  { id: 'mat-1', name: 'Cement', quantity: '5000 bags', siteDistribution: 5 },
  { id: 'mat-2', name: 'Steel Rebar', quantity: '150 tons', siteDistribution: 8 },
  { id: 'mat-3', name: 'Sand', quantity: '800 m³', siteDistribution: 4 },
  { id: 'mat-4', name: 'Bricks', quantity: '500,000 pcs', siteDistribution: 10 },
  { id: 'mat-5', name: 'Paint', quantity: '1200 liters', siteDistribution: 3 },
];

const recentStoreActivity = [
    { id: 'ISS-012', type: 'Issue', details: '100 bags of Cement', site: 'North Site', status: 'Completed', date: '1 day ago' },
    { id: 'REC-008', type: 'Receipt', details: '10 bags of cement', site: 'West Site (Return)', status: 'Accepted', date: '2 days ago' },
    { id: 'REQ-025', type: 'Request', details: '5 tons Steel', site: 'South Site', status: 'Pending', date: '2 days ago' },
    { id: 'INV-015', type: 'Invoice', details: 'Uploaded for 10000 bricks', site: 'N/A', status: 'Processed', date: '3 days ago' },
];

export default function StoreManagerDashboard() {
  return (
    <>
      <h1 className="text-3xl font-bold font-headline">MAPI Store Dashboard</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Inventory"
            value="350+ items"
            icon={PackageSearch}
            description="Total distinct material types"
          />
          <StatCard
            title="Pending Requests"
            value="3"
            icon={Package}
            description="From 3 different sites"
          />
           <StatCard
            title="Materials Issued"
            value="42 items"
            icon={Truck}
            description="In the last 24 hours"
          />
          <StatCard
            title="Low Stock Alerts"
            value="3 materials"
            icon={AlertTriangle}
            className="text-destructive border-destructive/50"
            description="Across store & sites"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                    <CardDescription>Material requests awaiting issue from the store.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Requesting Site</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {pendingRequests.map((req) => (
                        <TableRow key={req.id}>
                            <TableCell className="font-medium">{req.material}</TableCell>
                            <TableCell>{req.quantity}</TableCell>
                            <TableCell>{req.site}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Low Stock Materials</CardTitle>
                    <CardDescription>Materials running low in the store or across sites.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Location</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lowStockMaterials.map(item => (
                                <TableRow key={item.id} className="text-destructive">
                                    <TableCell className="font-medium">{item.material}</TableCell>
                                    <TableCell className="font-bold">{item.quantity}</TableCell>
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
              <CardTitle>Material Return Reminders</CardTitle>
              <CardDescription>All materials due for return or with extended dates.</CardDescription>
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
                <div className="flex items-center gap-2">
                    <Building className="h-6 w-6" />
                    <CardTitle>Overall Store Inventory</CardTitle>
                </div>
                <CardDescription>
                    Live summary of materials available at the central MAPI store.
                </CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Available Quantity</TableHead>
                        <TableHead>Sites Supplied</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {storeInventory.map((material) => (
                    <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell>{material.quantity}</TableCell>
                        <TableCell>{material.siteDistribution}</TableCell>
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
