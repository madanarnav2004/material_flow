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
  ClipboardList,
  Receipt,
  Car,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function DirectorDashboard() {
  const router = useRouter();
  const { inventory, requests } = useMaterialContext();
  const [selectedSite, setSelectedSite] = React.useState<string>('Organization-wise');

  const filteredInventory = selectedSite === 'Organization-wise' 
    ? inventory 
    : inventory.filter(i => i.site === selectedSite);

  const filteredRequests = selectedSite === 'Organization-wise'
    ? requests
    : requests.filter(r => r.requestingSite === selectedSite);

  const pendingApprovals = filteredRequests.filter(r => r.status === 'Pending Director Approval').length;
  const lowStockCount = filteredInventory.filter(item => item.quantity <= item.minQty).length;

  const sitesList = Array.from(new Set(inventory.map(i => i.site)));

  const modules = [
    { id: 'material-stock', title: 'Inventory Ledger', icon: PackageSearch, color: 'text-blue-600', desc: 'Real-time stock across sites' },
    { id: 'indent-register', title: 'Material Indents', icon: Package, color: 'text-amber-600', desc: 'Authorized requests & status' },
    { id: 'mis-register', title: 'Issue Slips (MIS)', icon: ClipboardList, color: 'text-green-600', desc: 'On-site material distribution' },
    { id: 'material-shifting', title: 'Bill Checking (GRN)', icon: Receipt, color: 'text-purple-600', desc: 'Audit verified receipts' },
    { id: 'returnable-material', title: 'Returnable Assets', icon: RefreshCw, color: 'text-orange-600', desc: 'Track tools & machinery' },
    { id: 'vehicle-usage', title: 'Vehicle Entries', icon: Car, color: 'text-rose-600', desc: 'Logistics & fuel tracking' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary">Executive Oversight</h1>
          <p className="text-muted-foreground">Swanag Infrastructures Organizational Control</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-2 rounded-xl border shadow-sm">
          <Building2 className="h-4 w-4 text-muted-foreground ml-2" />
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-[220px] border-none focus:ring-0 shadow-none font-bold">
              <SelectValue placeholder="Select Scope" />
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
          title="Pending Approvals"
          value={pendingApprovals.toString()}
          icon={CheckCircle2}
          description="Requires authorization"
          className={pendingApprovals > 0 ? "border-amber-500 bg-amber-500/5 shadow-amber-100" : ""}
          onClick={() => router.push('/dashboard/requests')}
        />
        <StatCard
          title="Stock Exceptions"
          value={lowStockCount.toString()}
          icon={AlertTriangle}
          description="Critical items below threshold"
          className={lowStockCount > 0 ? "border-destructive/50 bg-destructive/5 shadow-destructive/10" : ""}
          onClick={() => router.push('/dashboard/inventory')}
        />
        <StatCard
          title="Active Tenders"
          value="12"
          icon={FileSpreadsheet}
          description="Project estimations"
          onClick={() => router.push('/dashboard/tender-tools')}
        />
        <StatCard
          title="Consolidated Audit"
          value="Reports"
          icon={AreaChart}
          description="Full data accessibility"
          onClick={() => router.push('/dashboard/reports')}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-headline flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary"/> Project Modules for {selectedSite}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => (
            <Card key={m.id} className="hover:shadow-lg transition-all cursor-pointer group border-primary/10 overflow-hidden" onClick={() => router.push(`/dashboard/reports?module=${m.id}&site=${selectedSite}`)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                <CardTitle className="text-base font-bold">{m.title}</CardTitle>
                <m.icon className={cn("h-5 w-5", m.color)} />
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-4">{m.desc}</p>
                <Button variant="ghost" size="sm" className="w-full justify-between font-bold text-[10px] uppercase tracking-widest text-primary group-hover:bg-primary/5">
                  Open Audit Page <ArrowUpRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
