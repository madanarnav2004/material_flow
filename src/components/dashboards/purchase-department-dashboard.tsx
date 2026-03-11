'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  DollarSign,
  PackageSearch,
  Download,
  Receipt,
  Building2,
  ArrowUpRight,
  Package,
  FilePlus,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function PurchaseDepartmentDashboard() {
  const router = useRouter();
  const { inventory, requests, receipts } = useMaterialContext();
  const [siteFilter, setSiteFilter] = React.useState<string>('Organization-wise');

  const pendingPO = requests.filter(r => r.status === 'Director Approved').length;
  const sitesList = Array.from(new Set(inventory.map(i => i.site)));

  const filteredRequests = siteFilter === 'Organization-wise' 
    ? requests 
    : requests.filter(r => r.requestingSite === siteFilter);

  const filteredInventory = siteFilter === 'Organization-wise'
    ? inventory
    : inventory.filter(i => i.site === siteFilter);

  const filteredReceipts = siteFilter === 'Organization-wise'
    ? receipts
    : receipts.filter(r => r.receivingSite === siteFilter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black font-headline text-primary uppercase">Procurement Hub</h1>
          <p className="text-muted-foreground">Consolidated Organization-wide Material Monitoring</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-2 rounded-xl border shadow-sm">
          <Building2 className="h-4 w-4 text-muted-foreground ml-2" />
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-[220px] border-none focus:ring-0 shadow-none font-bold">
              <SelectValue placeholder="Filter Site Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Organization-wise">All Sites Combined</SelectItem>
              {sitesList.map(site => <SelectItem key={site} value={site}>{site}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="PO Required"
          value={pendingPO.toString()}
          icon={FilePlus}
          description="Approved indents waiting"
          className={pendingPO > 0 ? "border-primary bg-primary/5" : ""}
          onClick={() => router.push('/dashboard/requests')}
        />
        <StatCard
          title="Standard Rates"
          value="Fixed"
          icon={DollarSign}
          description="Unit pricing master"
          onClick={() => router.push('/dashboard/rate-fixing')}
        />
        <StatCard
          title="Verified GRNs"
          value={filteredReceipts.length.toString()}
          icon={Receipt}
          description="Receipt audit logs"
          onClick={() => router.push('/dashboard/receipts')}
        />
        <StatCard
          title="Audit Trail"
          value="Full Export"
          icon={Download}
          description="XLSX Reports"
          onClick={() => router.push('/dashboard/reports')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg border-primary/10">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Material Indents (All Sites)</CardTitle>
                <CardDescription>Track project requests raised globally</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/reports?module=indent-register&site=${siteFilter}`)}>
                Audit Indents <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[350px] overflow-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="text-[10px] h-8">Indent ID</TableHead>
                    <TableHead className="text-[10px] h-8">Site</TableHead>
                    <TableHead className="text-[10px] h-8">Materials</TableHead>
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
                      <TableCell className="text-right text-[10px] pr-4 text-muted-foreground">{format(new Date(req.requestDate), 'dd MMM')}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} className="text-center p-12 text-muted-foreground text-xs italic">No matching indent requests.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Stock Balance</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/reports?module=material-stock&site=${siteFilter}`)}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Live levels for {siteFilter}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[350px] overflow-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="text-[10px] h-8">Material</TableHead>
                    <TableHead className="text-[10px] h-8 text-right pr-4">Qty</TableHead>
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
                    <TableRow><TableCell colSpan={2} className="text-center p-12 text-muted-foreground text-xs">Stock data empty.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-primary/10 overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Receipt className="text-primary h-5 w-5" /> Audit Trail: GRN & E-Way Bill Details
              </CardTitle>
              <CardDescription>Verified receipt logs for incoming material shipments across the organization</CardDescription>
            </div>
            <Button variant="outline" className="font-bold border-primary text-primary hover:bg-primary/10" onClick={() => router.push(`/dashboard/reports?module=material-shifting&site=${siteFilter}`)}>
              <Download className="mr-2 h-4 w-4" /> Download GRN Ledger
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-[10px] h-10 px-4">Receipt ID</TableHead>
                <TableHead className="text-[10px] h-10">Target Site</TableHead>
                <TableHead className="text-[10px] h-10">Material</TableHead>
                <TableHead className="text-[10px] h-10 text-right">Qty Received</TableHead>
                <TableHead className="text-[10px] h-10">E-Way Bill #</TableHead>
                <TableHead className="text-[10px] h-10">Carrier Info</TableHead>
                <TableHead className="text-[10px] h-10 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.length > 0 ? filteredReceipts.map(rec => (
                <TableRow key={rec.receivedBillId} className="h-12 hover:bg-primary/5 transition-colors">
                  <TableCell className="text-xs font-bold px-4">{rec.receivedBillId}</TableCell>
                  <TableCell className="text-xs font-medium">{rec.receivingSite}</TableCell>
                  <TableCell className="text-xs">{rec.materialName}</TableCell>
                  <TableCell className="text-xs text-right font-black text-primary">{rec.receivedQuantity}</TableCell>
                  <TableCell className="text-[10px] font-mono text-muted-foreground">{rec.eWayBillNumber || 'PENDING MAPPING'}</TableCell>
                  <TableCell className="text-[10px]">{rec.vehicleNumber || 'N/A'}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("text-[9px] h-5", rec.status === 'Accepted' ? 'bg-green-600' : 'bg-destructive')} variant="default">
                      {rec.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground italic">No verification records found for active filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
