
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  DollarSign,
  PackageSearch,
  ClipboardList,
  Download,
  AlertTriangle,
  FilePlus,
  ArrowRightLeft,
  CheckCircle2,
  Building2,
  Truck,
  Receipt,
  Search,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function PurchaseDepartmentDashboard() {
  const router = useRouter();
  const { inventory, requests, receipts } = useMaterialContext();
  const [siteFilter, setSiteFilter] = React.useState<string>('All');

  const pendingPO = requests.filter(r => r.status === 'Director Approved').length;
  const sitesList = Array.from(new Set(inventory.map(i => i.site)));

  const filteredRequests = siteFilter === 'All' 
    ? requests 
    : requests.filter(r => r.requestingSite === siteFilter);

  const filteredInventory = siteFilter === 'All'
    ? inventory
    : inventory.filter(i => i.site === siteFilter);

  const filteredReceipts = siteFilter === 'All'
    ? receipts
    : receipts.filter(r => r.receivingSite === siteFilter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black font-headline text-primary uppercase">Procurement Control</h1>
          <p className="text-muted-foreground">Global Stock, Indents & Audit Monitoring</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-2 rounded-xl border shadow-sm">
          <Building2 className="h-4 w-4 text-muted-foreground ml-2" />
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-[200px] border-none focus:ring-0 shadow-none font-bold">
              <SelectValue placeholder="Filter by Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Sites Hub</SelectItem>
              {sitesList.map(site => <SelectItem key={site} value={site}>{site}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="PO Generation"
          value={pendingPO.toString()}
          icon={FilePlus}
          description="Awaiting procurement"
          className={pendingPO > 0 ? "border-primary/50 bg-primary/5 shadow-primary/10" : ""}
          onClick={() => router.push('/dashboard/requests')}
        />
        <StatCard
          title="Manage Rates"
          value="Fixed Rates"
          icon={DollarSign}
          description="Configure units & pricing"
          onClick={() => router.push('/dashboard/rate-fixing')}
        />
        <StatCard
          title="GRN Verification"
          value={filteredReceipts.length.toString()}
          icon={Receipt}
          description="Audit trail logs"
          onClick={() => router.push('/dashboard/receipts')}
        />
        <StatCard
          title="Audit Reports"
          value="Exports"
          icon={Download}
          description="Download for all sites"
          onClick={() => router.push('/dashboard/reports')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Material Indent Requests Monitoring */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Indent Queue (All Sites)</CardTitle>
                <CardDescription>Track material requests raised across the organization</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/reports')}>
                Full Register <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="text-[10px] h-8">Indent ID</TableHead>
                    <TableHead className="text-[10px] h-8">Site</TableHead>
                    <TableHead className="text-[10px] h-8">Material</TableHead>
                    <TableHead className="text-[10px] h-8">Status</TableHead>
                    <TableHead className="text-[10px] h-8 text-right pr-4">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length > 0 ? filteredRequests.map(req => (
                    <TableRow key={req.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => router.push('/dashboard/requests')}>
                      <TableCell className="font-bold text-xs">{req.id}</TableCell>
                      <TableCell className="text-xs">{req.requestingSite}</TableCell>
                      <TableCell className="text-xs truncate max-w-[150px]">{req.materials.map(m => m.materialName).join(', ')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] h-4 uppercase">{req.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-[10px] pr-4">{format(new Date(req.requestDate), 'dd MMM')}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} className="text-center p-8 text-muted-foreground italic text-xs">No active indents matching selection.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Global Inventory Status */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg">Site-wise Stock Status</CardTitle>
            <CardDescription>Live levels for {siteFilter}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="text-[10px] h-8">Material</TableHead>
                    <TableHead className="text-[10px] h-8 text-right pr-4">Balance Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length > 0 ? filteredInventory.map(item => (
                    <TableRow key={item.id} className="h-10">
                      <TableCell className="text-xs font-medium">
                        {item.material} <span className="text-[9px] text-muted-foreground ml-1">({item.site})</span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-black text-primary pr-4">
                        {item.quantity.toLocaleString()} {item.unit}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={2} className="text-center p-8 text-muted-foreground italic text-xs">No stock data available.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Combined GRN & E-Way Bill Audit Trail */}
        <Card className="shadow-xl border-primary/10">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Receipt className="text-primary h-5 w-5" /> Audit Trail: GRN & E-Way Bill Details
                </CardTitle>
                <CardDescription>Mandatory verification logs for every incoming material shipment</CardDescription>
              </div>
              <Button onClick={() => router.push('/dashboard/reports')}>
                <Download className="mr-2 h-4 w-4" /> Download Full Audit Log
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-[10px] h-10 px-4">GRN/Receipt ID</TableHead>
                  <TableHead className="text-[10px] h-10">Site</TableHead>
                  <TableHead className="text-[10px] h-10">Material</TableHead>
                  <TableHead className="text-[10px] h-10 text-right">Received Qty</TableHead>
                  <TableHead className="text-[10px] h-10">E-Way Bill #</TableHead>
                  <TableHead className="text-[10px] h-10">Vehicle No</TableHead>
                  <TableHead className="text-[10px] h-10">Audit Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.length > 0 ? filteredReceipts.map(rec => (
                  <TableRow key={rec.receivedBillId} className="h-12 hover:bg-primary/5 transition-colors">
                    <TableCell className="text-xs font-bold px-4">{rec.receivedBillId}</TableCell>
                    <TableCell className="text-xs">{rec.receivingSite}</TableCell>
                    <TableCell className="text-xs">{rec.materialName}</TableCell>
                    <TableCell className="text-xs text-right font-black">{rec.receivedQuantity}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{rec.eWayBillNumber || 'NOT ATTACHED'}</TableCell>
                    <TableCell className="text-xs">{rec.vehicleNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={rec.status === 'Accepted' ? 'bg-green-600' : 'bg-destructive'} variant="default">
                        {rec.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No verification records found for the selected scope.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
