'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  FileText,
  ClipboardCheck,
  Car,
  Download,
  AlertTriangle,
  PackageSearch,
  CheckCircle2,
  History,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';

export default function SiteManagerDashboard() {
  const router = useRouter();
  const { site } = useUser();
  const { toast } = useToast();
  const { inventory, requests, issueSlips } = useMaterialContext();

  const siteInventory = inventory.filter(i => i.site === site);
  const siteRequests = requests.filter(r => r.requestingSite === site && r.status === 'Pending Director Approval').length;
  const lowStock = siteInventory.filter(i => i.quantity <= i.minQty).length;

  const handleDownloadReport = (type: string) => {
    toast({
      title: 'Report Download Started',
      description: `Preparing ${type} report for ${site}...`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline">{site} Controller</h1>
        <p className="text-muted-foreground">Site Progress, Material Issue & Inventory</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Issue Slip (MIS)"
          value="Create Slip"
          icon={FileText}
          description="Generate controlled issuance"
          onClick={() => router.push('/dashboard/material-issue')}
        />
        <StatCard
          title="Material Indent"
          value={siteRequests.toString()}
          icon={Package}
          description="Active site requests"
          onClick={() => router.push('/dashboard/requests')}
        />
        <StatCard
          title="Vehicle Entry"
          value="Log Usage"
          icon={Car}
          description="Fuel and hourly tracking"
          onClick={() => router.push('/dashboard/vehicle-entry')}
        />
        <StatCard
          title="Work Done"
          value="Submit Report"
          icon={ClipboardCheck}
          description="Daily site progress report"
          onClick={() => router.push('/dashboard/work-done-report')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Site Operational Modules</CardTitle>
            <CardDescription>Manage daily field tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/material-issue')}>
              <FileText className="h-6 w-6 text-primary" />
              <span>Material Issue Slips</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/receipts')}>
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <span>Goods Received (GRN)</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/inventory')}>
              <PackageSearch className="h-6 w-6 text-primary" />
              <span>Live Site Inventory</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/reports')}>
              <History className="h-6 w-6 text-primary" />
              <span>Site Audit Logs</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Site Reports
            </CardTitle>
            <CardDescription>Download field snapshots</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Daily Stock')}>
              Daily Stock Report <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('MIS Register')}>
              Material Issue Register <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Progress')}>
              Work Done Summary <Download className="h-4 w-4" />
            </Button>
            <div className={cn(
              "p-4 rounded-lg border flex items-center gap-3",
              lowStock > 0 ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-green-500/10 border-green-500/20 text-green-600"
            )}>
              {lowStock > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              <span className="text-sm font-bold">{lowStock} Low stock alerts</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
