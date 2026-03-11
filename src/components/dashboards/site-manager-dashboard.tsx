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
  AlertCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { isSameDay, subDays } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SiteManagerDashboard() {
  const router = useRouter();
  const { site } = useUser();
  const { toast } = useToast();
  const { inventory, requests, workDoneReports } = useMaterialContext();
  const [isPastEightAM, setIsPastEightAM] = React.useState(false);

  React.useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      setIsPastEightAM(now.getHours() >= 8);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const siteInventory = inventory.filter(i => i.site === site);
  const siteRequests = requests.filter(r => r.requestingSite === site && r.status === 'Pending Director Approval').length;
  const lowStock = siteInventory.filter(i => i.quantity <= i.minQty).length;

  const yesterday = subDays(new Date(), 1);
  
  const missingDays = React.useMemo(() => {
    let count = 0;
    let checkDate = subDays(new Date(), 1);
    while (count < 30) {
      const hasReport = workDoneReports.some(report => 
        report.siteName === site && 
        isSameDay(new Date(report.reportDate), checkDate)
      );
      if (hasReport) break;
      count++;
      checkDate = subDays(checkDate, 1);
    }
    return count;
  }, [site, workDoneReports]);

  const showMissingReportAlert = isPastEightAM && missingDays > 0;

  const handleDownloadReport = (type: string) => {
    toast({
      title: 'Report Download Started',
      description: `Preparing ${type} report for ${site}...`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 text-sm">
        <h1 className="text-3xl font-bold font-headline text-primary">{site} Controller</h1>
        <p className="text-muted-foreground">Site Progress, Material Issue & Inventory</p>
      </div>

      {showMissingReportAlert && (
        <Alert variant="destructive" className="border-2 border-destructive bg-destructive/5 animate-pulse shadow-2xl py-10">
          <div className="flex items-center gap-8">
            <div className="bg-destructive text-white p-4 rounded-3xl shadow-xl">
              <AlertCircle className="h-12 w-12" />
            </div>
            <div className="flex-1 space-y-2">
              <AlertTitle className="text-3xl font-black uppercase tracking-tighter">
                Audit Warning: Missing Site Progress Logs
              </AlertTitle>
              <AlertDescription className="text-lg font-bold opacity-90 flex items-center gap-3">
                <span className="bg-white/50 px-3 py-1 rounded-lg border border-destructive/20 flex items-center gap-2">
                  <Clock className="h-5 w-5" /> {missingDays} {missingDays === 1 ? 'Day' : 'Days'} Overdue
                </span>
                <span>You must update your Daily Work Done Reports immediately to maintain site audit compliance.</span>
              </AlertDescription>
            </div>
            <Button 
              size="lg" 
              className="font-black uppercase tracking-widest bg-destructive hover:bg-destructive/90 text-white h-20 px-12 text-xl shadow-2xl rounded-2xl"
              onClick={() => router.push('/dashboard/work-done-report')}
            >
              Update Now <ArrowRight className="ml-3 h-8 w-8" />
            </Button>
          </div>
        </Alert>
      )}

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
          className={showMissingReportAlert ? "border-destructive/50 bg-destructive/5" : ""}
          onClick={() => router.push('/dashboard/work-done-report')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg border-primary/10">
          <CardHeader className="bg-muted/30 border-b text-sm">
            <CardTitle>Site Operational Modules</CardTitle>
            <CardDescription>Manage daily field tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 pt-6">
            <Button variant="outline" className="h-24 flex-col gap-2 border-2 hover:bg-primary/5" onClick={() => router.push('/dashboard/material-issue')}>
              <FileText className="h-6 w-6 text-primary" />
              <span className="font-bold">Material Issue Slips</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2 hover:bg-primary/5" onClick={() => router.push('/dashboard/receipts')}>
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <span className="font-bold">Goods Received (GRN)</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2 hover:bg-primary/5" onClick={() => router.push('/dashboard/inventory')}>
              <PackageSearch className="h-6 w-6 text-primary" />
              <span className="font-bold">Live Site Inventory</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2 hover:bg-primary/5" onClick={() => router.push('/dashboard/reports')}>
              <History className="h-6 w-6 text-primary" />
              <span className="font-bold">Site Audit Logs</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-muted/30 border-b text-sm">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Site Reports
            </CardTitle>
            <CardDescription>Download field snapshots</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Button variant="secondary" className="w-full justify-between h-11" onClick={() => handleDownloadReport('Daily Stock')}>
              Daily Stock Report <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between h-11" onClick={() => handleDownloadReport('MIS Register')}>
              Material Issue Register <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between h-11" onClick={() => handleDownloadReport('Progress')}>
              Work Done Summary <Download className="h-4 w-4" />
            </Button>
            <div className={cn(
              "p-4 rounded-xl border flex items-center gap-3 mt-4 text-sm",
              lowStock > 0 ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-green-500/10 border-green-500/20 text-green-600"
            )}>
              {lowStock > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              <span className="text-sm font-bold">{lowStock} Low stock alerts active</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
