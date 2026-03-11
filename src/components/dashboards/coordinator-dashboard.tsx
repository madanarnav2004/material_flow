
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileUp,
  Truck,
  Settings,
  PackageSearch,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  PlusCircle,
  Package,
  ArrowRightLeft,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { useToast } from '@/hooks/use-toast';

export default function CoordinatorDashboard() {
  const router = useRouter();
  const { requests, inventory } = useMaterialContext();

  const toProcess = requests.filter(r => r.status === 'Director Approved').length;
  const activeTransfers = inventory.filter(i => i.quantity < i.minQty).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black font-headline text-primary">Project Operations Hub</h1>
        <p className="text-muted-foreground">Manage logistics, BOQs, and organization-wide synchronization</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Indent Queue"
          value={toProcess.toString()}
          icon={Settings}
          description="Awaiting site-assignment"
          className={toProcess > 0 ? "border-primary/50 bg-primary/5" : ""}
          onClick={() => router.push('/dashboard/requests')}
        />
        <StatCard
          title="Stock Sync"
          value="Excel Upload"
          icon={FileUp}
          description="Update field levels"
          onClick={() => router.push('/dashboard/inventory')}
        />
        <StatCard
          title="Logistics"
          value="Inter-Site"
          icon={Truck}
          description="Material shifting"
          onClick={() => router.push('/dashboard/material-issue')}
        />
        <StatCard
          title="Site Reports"
          value="Detailed"
          icon={Download}
          description="Download audit data"
          onClick={() => router.push('/dashboard/reports')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg border-primary/10">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle>Management Suite</CardTitle>
            <CardDescription>Core coordination tools</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 pt-6">
            <Button variant="outline" className="h-28 flex-col gap-2 border-2 hover:bg-muted/50" onClick={() => router.push('/dashboard/requests')}>
              <Package className="h-6 w-6 text-primary" />
              <div className="text-center">
                <span className="font-bold block">Indent Dispatch</span>
                <span className="text-[10px] text-muted-foreground">Fulfill approved requests</span>
              </div>
            </Button>
            <Button variant="outline" className="h-28 flex-col gap-2 border-2 hover:bg-muted/50" onClick={() => router.push('/dashboard/boq-analysis')}>
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <div className="text-center">
                <span className="font-bold block">Execution Audit</span>
                <span className="text-[10px] text-muted-foreground">Work-done vs BOQ</span>
              </div>
            </Button>
            <Button variant="outline" className="h-28 flex-col gap-2 border-2 hover:bg-muted/50" onClick={() => router.push('/dashboard/material-issue')}>
              <ArrowRightLeft className="h-6 w-6 text-primary" />
              <div className="text-center">
                <span className="font-bold block">Material Shifting</span>
                <span className="text-[10px] text-muted-foreground">Site-to-site movement</span>
              </div>
            </Button>
            <Button variant="outline" className="h-28 flex-col gap-2 border-2 hover:bg-muted/50" onClick={() => router.push('/dashboard/inventory')}>
              <PackageSearch className="h-6 w-6 text-primary" />
              <div className="text-center">
                <span className="font-bold block">Inventory Sync</span>
                <span className="text-[10px] text-muted-foreground">Excel stock ledger</span>
              </div>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" /> Reports Hub
            </CardTitle>
            <CardDescription>Tailored logistics data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Button variant="secondary" className="w-full justify-between h-11" onClick={() => router.push('/dashboard/reports')}>
              Shifting Register <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between h-11" onClick={() => router.push('/dashboard/reports')}>
              Global Stock Status <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between h-11" onClick={() => router.push('/dashboard/reports')}>
              Site Activity Log <Download className="h-4 w-4" />
            </Button>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3 mt-4">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold leading-tight">Coordinators must verify stock sync weekly.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
