'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Warehouse,
  Truck,
  Package,
  ClipboardList,
  Download,
  AlertTriangle,
  PackageSearch,
  CheckCircle2,
  FilePlus,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function GodownManagerDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { inventory, requests } = useMaterialContext();

  const godownStock = inventory.filter(i => i.site === 'MAPI Godown');
  const pendingIssue = requests.filter(r => r.status === 'Director Approved').length;
  const lowStock = godownStock.filter(i => i.quantity <= i.minQty).length;

  const handleDownloadReport = (type: string) => {
    toast({
      title: 'Report Ready',
      description: `Downloading Godown ${type} report...`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline text-primary">Godown Management Terminal</h1>
        <p className="text-muted-foreground">MAPI Godown Central Inventory Control</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Fulfill Indents"
          value={pendingIssue.toString()}
          icon={Package}
          description="Awaiting dispatch to sites"
          className={pendingIssue > 0 ? "border-primary/50 bg-primary/5" : ""}
          onClick={() => router.push('/dashboard/material-issue')}
        />
        <StatCard
          title="Godown Stock"
          value={godownStock.length.toString()}
          icon={Warehouse}
          description="Verified items in central store"
          onClick={() => router.push('/dashboard/inventory')}
        />
        <StatCard
          title="Issue Slip (MIS)"
          value="MIS Control"
          icon={ClipboardList}
          description="Confirm physical material release"
          onClick={() => router.push('/dashboard/material-issue')}
        />
        <StatCard
          title="Direct Purchase"
          value="GRN Entry"
          icon={FilePlus}
          description="Log vendor shop receipts"
          onClick={() => router.push('/dashboard/receipts')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg border-primary/10">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle>Godown Operations</CardTitle>
            <CardDescription>Core warehouse actions</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 pt-6">
            <Button variant="outline" className="h-24 flex-col gap-2 border-2 hover:bg-primary/5" onClick={() => router.push('/dashboard/material-issue')}>
              <Truck className="h-6 w-6 text-primary" />
              <span className="font-bold">Dispatch & Transfers</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2 hover:bg-primary/5" onClick={() => router.push('/dashboard/inventory')}>
              <PackageSearch className="h-6 w-6 text-primary" />
              <span className="font-bold">Inventory Sync (Excel)</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2 hover:bg-primary/5" onClick={() => router.push('/dashboard/receipts')}>
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <span className="font-bold">Verify Receipts (GRN)</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2 hover:bg-primary/5" onClick={() => router.push('/dashboard/reports')}>
              <Download className="h-6 w-6 text-primary" />
              <span className="font-bold">Stock Audit Reports</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Godown Audit
            </CardTitle>
            <CardDescription>Download store snapshots</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Stock')}>
              Full Stock Ledger <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Dispatch')}>
              Daily Dispatch Register <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Low Stock')}>
              Re-order Alert List <Download className="h-4 w-4" />
            </Button>
            <div className={cn(
              "p-4 rounded-lg border flex items-center gap-3 mt-4",
              lowStock > 0 ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-green-500/10 border-green-500/20 text-green-600"
            )}>
              {lowStock > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              <span className="text-sm font-bold">{lowStock} Low stock items alert</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
