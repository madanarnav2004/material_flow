'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  PackageSearch,
  Users,
  AreaChart,
  Download,
  AlertTriangle,
  CheckCircle2,
  Package,
  Building2,
  ArrowUpRight,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function DirectorDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { inventory, requests } = useMaterialContext();
  const [selectedSite, setSelectedSite] = React.useState<string>('All Sites');

  const filteredInventory = selectedSite === 'All Sites' 
    ? inventory 
    : inventory.filter(i => i.site === selectedSite);

  const filteredRequests = selectedSite === 'All Sites'
    ? requests
    : requests.filter(r => r.requestingSite === selectedSite);

  const pendingApprovals = filteredRequests.filter(r => r.status === 'Pending Director Approval').length;
  const lowStockCount = filteredInventory.filter(item => item.quantity <= item.minQty).length;

  const sitesList = Array.from(new Set(inventory.map(i => i.site)));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary">Executive Hub</h1>
          <p className="text-muted-foreground">Organizational Control & Audit Center</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-2 rounded-xl border shadow-sm">
          <Building2 className="h-4 w-4 text-muted-foreground ml-2" />
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-[200px] border-none focus:ring-0 shadow-none font-bold">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Sites">All Sites Combined</SelectItem>
              {sitesList.map(site => <SelectItem key={site} value={site}>{site}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals.toString()}
          icon={CheckCircle2}
          description="Awaiting your authorization"
          className={pendingApprovals > 0 ? "border-amber-500 bg-amber-500/5" : ""}
          onClick={() => router.push('/dashboard/requests')}
        />
        <StatCard
          title="Stock Exceptions"
          value={lowStockCount.toString()}
          icon={AlertTriangle}
          description="Critical items below threshold"
          className={lowStockCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}
          onClick={() => router.push('/dashboard/inventory')}
        />
        <StatCard
          title="Active Materials"
          value={filteredInventory.length.toString()}
          icon={PackageSearch}
          description={`Tracked in ${selectedSite}`}
          onClick={() => router.push('/dashboard/inventory')}
        />
        <StatCard
          title="Detailed Audit"
          value="Reports"
          icon={AreaChart}
          description="Access full data exports"
          onClick={() => router.push('/dashboard/reports')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-primary/10 shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Operational Oversight</CardTitle>
                <CardDescription>Main audit and management modules</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/reports')}>
                Detailed Downloads <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 pt-6">
            <Button variant="outline" className="h-32 flex-col gap-3 border-2 hover:border-primary hover:bg-primary/5 transition-all group" onClick={() => router.push('/dashboard/boq-analysis')}>
              <FileSpreadsheet className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className="font-bold">BOQ Analysis</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Planned vs Actual</p>
              </div>
            </Button>
            <Button variant="outline" className="h-32 flex-col gap-3 border-2 hover:border-primary hover:bg-primary/5 transition-all group" onClick={() => router.push('/dashboard/inventory')}>
              <Package className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className="font-bold">Live Inventory</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Multi-Site Ledger</p>
              </div>
            </Button>
            <Button variant="outline" className="h-32 flex-col gap-3 border-2 hover:border-primary hover:bg-primary/5 transition-all group" onClick={() => router.push('/dashboard/user-management')}>
              <Users className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className="font-bold">Team Access</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Roles & Permissions</p>
              </div>
            </Button>
            <Button variant="outline" className="h-32 flex-col gap-3 border-2 hover:border-primary hover:bg-primary/5 transition-all group" onClick={() => router.push('/dashboard/reports')}>
              <Download className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className="font-bold">Download Reports</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Consolidated Exports</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <AreaChart className="h-5 w-5 text-primary" /> Quick Downloads
              </CardTitle>
              <CardDescription>Instant summary exports for {selectedSite}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Button variant="secondary" className="w-full justify-between h-11" onClick={() => router.push('/dashboard/reports')}>
                Site-wise Stock Report <Download className="h-4 w-4 opacity-50" />
              </Button>
              <Button variant="secondary" className="w-full justify-between h-11" onClick={() => router.push('/dashboard/reports')}>
                Material Issue Register <Download className="h-4 w-4 opacity-50" />
              </Button>
              <Button variant="secondary" className="w-full justify-between h-11" onClick={() => router.push('/dashboard/reports')}>
                Progress vs BOQ <Download className="h-4 w-4 opacity-50" />
              </Button>
              <div className={cn(
                "p-4 rounded-lg border mt-4 flex items-center gap-3",
                lowStockCount > 0 ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-green-500/10 border-green-500/20 text-green-600"
              )}>
                {lowStockCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                <span className="text-xs font-bold">{lowStockCount} Critical stock alerts active</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
