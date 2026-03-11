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
  Package,
  ArrowRightLeft,
  ClipboardCheck,
  BrainCircuit,
  LayoutDashboard,
  AlertCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { isSameDay, subDays } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CoordinatorDashboard() {
  const router = useRouter();
  const { requests, inventory, workDoneReports } = useMaterialContext();
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

  const sitesList = React.useMemo(() => 
    Array.from(new Set(inventory.map(i => i.site))).filter(s => s !== 'Global' && s !== 'All' && s !== 'MAPI Godown'),
    [inventory]
  );

  const delinquentSites = React.useMemo(() => {
    return sitesList.map(siteName => {
      let missingCount = 0;
      let checkDate = subDays(new Date(), 1);
      
      while (missingCount < 30) {
        const hasReport = workDoneReports.some(r => 
          r.siteName === siteName && isSameDay(new Date(r.reportDate), checkDate)
        );
        if (hasReport) break;
        missingCount++;
        checkDate = subDays(checkDate, 1);
      }
      return { siteName, missingCount };
    }).filter(s => s.missingCount > 0);
  }, [sitesList, workDoneReports]);

  const showMissingAlert = isPastEightAM && delinquentSites.length > 0;
  const toProcess = requests.filter(r => r.status === 'Director Approved').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 text-sm">
        <h1 className="text-3xl font-black font-headline text-primary">Project Operations Hub</h1>
        <p className="text-muted-foreground">Manage logistics, BOQs, and organization-wide synchronization</p>
      </div>

      {showMissingAlert && (
        <Alert variant="destructive" className="border-2 border-destructive bg-destructive/5 animate-pulse shadow-2xl py-8">
          <div className="flex items-start gap-6">
            <div className="bg-destructive text-white p-3 rounded-2xl shadow-lg">
              <AlertCircle className="h-10 w-10" />
            </div>
            <div className="flex-1 space-y-3">
              <AlertTitle className="text-2xl font-black uppercase tracking-tighter">
                Operational Alert: Missing Site Progress Reports
              </AlertTitle>
              <div className="flex flex-wrap gap-2">
                {delinquentSites.map(s => (
                  <div key={s.siteName} className="bg-white/80 border border-destructive/20 rounded-xl px-4 py-2 flex flex-col">
                    <span className="font-black text-xs text-destructive">{s.siteName}</span>
                    <span className="text-[10px] uppercase font-bold flex items-center gap-1 opacity-70">
                      <Clock className="h-3 w-3" /> {s.missingCount} {s.missingCount === 1 ? 'day' : 'days'} overdue
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Button 
              size="lg" 
              className="font-black uppercase tracking-widest bg-destructive hover:bg-destructive/90 text-white h-16 px-8 shadow-xl"
              onClick={() => router.push('/dashboard/work-done-report')}
            >
              Resolve Gaps <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </Alert>
      )}

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
          title="Execution Audit"
          value="BOQ Track"
          icon={FileSpreadsheet}
          description="Compare work vs plan"
          onClick={() => router.push('/dashboard/boq-analysis')}
        />
        <StatCard
          title="Logistics"
          value="Inter-Site"
          icon={Truck}
          description="Material shifting"
          onClick={() => router.push('/dashboard/material-issue')}
        />
        <StatCard
          title="Audit Reports"
          value="Detailed"
          icon={Download}
          description="Download all logs"
          onClick={() => router.push('/dashboard/reports')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg border-primary/10">
          <CardHeader className="border-b bg-muted/30 text-sm">
            <CardTitle>Management Suite</CardTitle>
            <CardDescription>Core coordination and execution tools</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 pt-6">
            <Button variant="outline" className="h-28 flex-col gap-2 border-2 hover:bg-muted/50" onClick={() => router.push('/dashboard/boq-management')}>
              <FileUp className="h-6 w-6 text-primary" />
              <div className="text-center">
                <span className="font-bold block">BOQ Management</span>
                <span className="text-[10px] text-muted-foreground">Upload Master BOQs</span>
              </div>
            </Button>
            <Button variant="outline" className="h-28 flex-col gap-2 border-2 hover:bg-muted/50" onClick={() => router.push('/dashboard/work-done-report')}>
              <ClipboardCheck className="h-6 w-6 text-primary" />
              <div className="text-center">
                <span className="font-bold block">Work Reports</span>
                <span className="text-[10px] text-muted-foreground">Verify daily progress</span>
              </div>
            </Button>
            <Button variant="outline" className="h-28 flex-col gap-2 border-2 hover:bg-muted/50" onClick={() => router.push('/dashboard/boq-analysis')}>
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <div className="text-center">
                <span className="font-bold block">BOQ Analysis</span>
                <span className="text-[10px] text-muted-foreground">Cost vs Execution</span>
              </div>
            </Button>
            <Button variant="outline" className="h-28 flex-col gap-2 border-2 hover:bg-muted/50" onClick={() => router.push('/dashboard/ai-review')}>
              <BrainCircuit className="h-6 w-6 text-primary" />
              <div className="text-center">
                <span className="font-bold block">AI Bill Review</span>
                <span className="text-[10px] text-muted-foreground">Automated Auditing</span>
              </div>
            </Button>
            <Button variant="outline" className="h-28 flex-col gap-2 border-2 hover:bg-muted/50" onClick={() => router.push('/dashboard/material-issue')}>
              <ArrowRightLeft className="h-6 w-6 text-primary" />
              <div className="text-center">
                <span className="font-bold block">Inter-Site Shifting</span>
                <span className="text-[10px] text-muted-foreground">Logistics control</span>
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
          <CardHeader className="border-b bg-muted/30 text-sm">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" /> Download Hub
            </CardTitle>
            <CardDescription>Export site-specific registers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Button variant="secondary" className="w-full justify-between h-11" onClick={() => router.push('/dashboard/reports?module=work-done-report')}>
              Daily Work Register <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between h-11" onClick={() => router.push('/dashboard/reports?module=boq-analysis')}>
              BOQ Progress Report <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between h-11" onClick={() => router.push('/dashboard/reports?module=material-stock')}>
              Global Stock Status <Download className="h-4 w-4" />
            </Button>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3 mt-4 text-sm">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold leading-tight">Coordinators must audit AI discrepancies weekly.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
