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
  ClipboardList,
  CheckCircle2,
  Package,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { useToast } from '@/hooks/use-toast';

export default function DirectorDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { inventory, requests, issueSlips } = useMaterialContext();

  const pendingApprovals = requests.filter(r => r.status === 'Pending Director Approval').length;
  const lowStockCount = inventory.filter(item => item.quantity <= item.minQty).length;

  const handleDownloadReport = (type: string) => {
    toast({
      title: 'Report Generation Started',
      description: `Preparing your executive ${type} summary...`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline uppercase tracking-tight">Executive Control Panel</h1>
        <p className="text-muted-foreground">Swanag Infrastructures Organization-wide Overview</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="BOQ Analysis"
          value="Audit Cost"
          icon={FileSpreadsheet}
          description="Planned vs Actual Reconciliation"
          className="border-primary/50"
          onClick={() => router.push('/dashboard/boq-analysis')}
        />
        <StatCard
          title="Approvals"
          value={pendingApprovals.toString()}
          icon={CheckCircle2}
          description="Pending Director Authorization"
          className={pendingApprovals > 0 ? "border-yellow-500/50 bg-yellow-500/5" : ""}
          onClick={() => router.push('/dashboard/requests')}
        />
        <StatCard
          title="Total Inventory"
          value={inventory.length.toString()}
          icon={PackageSearch}
          description="Managed material types across sites"
          onClick={() => router.push('/dashboard/inventory')}
        />
        <StatCard
          title="User Management"
          value="Site Logins"
          icon={Users}
          description="Manage roles and site access"
          onClick={() => router.push('/dashboard/user-management')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Main Audit Modules</CardTitle>
            <CardDescription>Access primary operational controls</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/reports')}>
              <AreaChart className="h-6 w-6 text-primary" />
              <span>Full Audit Reports</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/inventory')}>
              <Package className="h-6 w-6 text-primary" />
              <span>Inventory Database</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/boq-management')}>
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <span>Master BOQ Settings</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/user-management')}>
              <Users className="h-6 w-6 text-primary" />
              <span>Organization Structure</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Quick Audit Reports
            </CardTitle>
            <CardDescription>Summarized executive snapshots</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Stock')}>
              Organization Stock Report <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('MIS')}>
              Site Issue (MIS) Summary <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('BOQ')}>
              BOQ Progress Overview <Download className="h-4 w-4" />
            </Button>
            <div className={cn(
              "p-4 rounded-lg border flex items-center gap-3",
              lowStockCount > 0 ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-green-500/10 border-green-500/20 text-green-600"
            )}>
              {lowStockCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              <span className="text-sm font-bold">{lowStockCount} Critical stock exceptions</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
