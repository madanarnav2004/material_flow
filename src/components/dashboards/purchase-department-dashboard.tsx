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
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { useToast } from '@/hooks/use-toast';

export default function PurchaseDepartmentDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { inventory, requests } = useMaterialContext();

  const pendingPO = requests.filter(r => r.status === 'Director Approved').length;
  const lowStockOrg = inventory.filter(i => i.quantity <= i.minQty).length;

  const handleDownloadReport = (type: string) => {
    toast({
      title: 'Audit Document Ready',
      description: `Downloading organization-wide ${type} summary...`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline">Purchase Department Dashboard</h1>
        <p className="text-muted-foreground">Manage vendor rates, PO generation, and bill verification</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="PO Generation"
          value={pendingPO.toString()}
          icon={FilePlus}
          description="Director approved indents"
          className={pendingPO > 0 ? "border-primary/50 bg-primary/5" : ""}
          onClick={() => router.push('/dashboard/requests')}
        />
        <StatCard
          title="Rate Fixing"
          value="Manage Price"
          icon={DollarSign}
          description="Update material and labor rates"
          onClick={() => router.push('/dashboard/rate-fixing')}
        />
        <StatCard
          title="Bill Audit"
          value="Verification"
          icon={ClipboardList}
          description="Verify shop and vendor invoices"
          onClick={() => router.push('/dashboard/receipts')}
        />
        <StatCard
          title="Global Stock"
          value={inventory.length.toString()}
          icon={PackageSearch}
          description="Organization inventory levels"
          onClick={() => router.push('/dashboard/inventory')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Procurement Modules</CardTitle>
            <CardDescription>Core purchase functions</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/requests')}>
              <ShoppingCart className="h-6 w-6 text-primary" />
              <span>Purchase Order Management</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/rate-fixing')}>
              <DollarSign className="h-6 w-6 text-primary" />
              <span>Rate Configuration</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/receipts')}>
              <ArrowRightLeft className="h-6 w-6 text-primary" />
              <span>Bill Reconciliation (GRN)</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/reports')}>
              <Download className="h-6 w-6 text-primary" />
              <span>Procurement Reports</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Purchase Audit
            </CardTitle>
            <CardDescription>Procurement snapshots</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('PO Status')}>
              Active PO Summary <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Vendor Bill')}>
              Bill Verification Report <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Org Stock')}>
              Consolidated Stock report <Download className="h-4 w-4" />
            </Button>
            <div className={cn(
              "p-4 rounded-lg border flex items-center gap-3",
              lowStockOrg > 0 ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-green-500/10 border-green-500/20 text-green-600"
            )}>
              {lowStockOrg > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              <span className="text-sm font-bold">{lowStockOrg} Organizational re-order alerts</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
