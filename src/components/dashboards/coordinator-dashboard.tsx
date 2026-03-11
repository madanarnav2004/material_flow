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
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { useToast } from '@/hooks/use-toast';

export default function CoordinatorDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { requests, inventory } = useMaterialContext();

  const toProcess = requests.filter(r => r.status === 'Director Approved').length;

  const handleDownloadReport = (type: string) => {
    toast({
      title: 'Generating Report',
      description: `Downloading ${type} report for all sites...`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline">Project Coordinator Hub</h1>
        <p className="text-muted-foreground">Manage logistics, BOQs, and site-to-site synchronization</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Process Indents"
          value={toProcess.toString()}
          icon={Settings}
          description="Awaiting site-assignment or PO"
          className={toProcess > 0 ? "border-primary/50 bg-primary/5" : ""}
          onClick={() => router.push('/dashboard/requests')}
        />
        <StatCard
          title="BOQ Management"
          value="Upload/Sync"
          icon={FileUp}
          description="Configure site-wise master BOQs"
          onClick={() => router.push('/dashboard/boq-management')}
        />
        <StatCard
          title="Site Shifting"
          value="Active Transfers"
          icon={Truck}
          description="Material movements between hubs"
          onClick={() => router.push('/dashboard/material-issue')}
        />
        <StatCard
          title="Excel Stock Sync"
          value="Update Live"
          icon={PlusCircle}
          description="Upload field stock reports"
          onClick={() => router.push('/dashboard/inventory')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Coordination Modules</CardTitle>
            <CardDescription>Main operational tools</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/requests')}>
              <Package className="h-6 w-6 text-primary" />
              <span>Logistics & Indent Queue</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/boq-analysis')}>
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <span>Execution vs BOQ Audit</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/inventory')}>
              <PackageSearch className="h-6 w-6 text-primary" />
              <span>Global Stock Ledger</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/reports')}>
              <Download className="h-6 w-6 text-primary" />
              <span>Organization Reports</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Download Quick Reports
            </CardTitle>
            <CardDescription>Logistics and site progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Site Transfer')}>
              Material Shifting Register <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Pending Indent')}>
              Unfulfilled Indent List <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Work Done')}>
              Site Progress Summary <Download className="h-4 w-4" />
            </Button>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-bold">Audit live stock every 24h</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
