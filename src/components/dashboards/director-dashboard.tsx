'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  PackageSearch,
  AreaChart,
  CheckCircle2,
  Package,
  Building2,
  ArrowUpRight,
  ClipboardList,
  Receipt,
  Car,
  FileUp,
  ClipboardCheck,
  BrainCircuit,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMaterialContext } from '@/context/material-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { isSameDay, subDays } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DirectorDashboard() {
  const router = useRouter();
  const { inventory, requests, workDoneReports } = useMaterialContext();
  const [selectedSite, setSelectedSite] = React.useState<string>('Organization-wise');
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

  const sitesList = Array.from(new Set(inventory.map(i => i.site)));
  const yesterday = subDays(new Date(), 1);

  const missingSites = React.useMemo(() => {
    return sitesList.filter(siteName => {
      if (siteName === 'MAPI Godown' || siteName === 'Global' || siteName === 'All') return false;
      const hasReport = workDoneReports.some(report => 
        report.siteName === siteName && 
        isSameDay(new Date(report.reportDate), yesterday)
      );
      return !hasReport;
    });
  }, [sitesList, workDoneReports, yesterday]);

  const showMissingAlert = isPastEightAM && missingSites.length > 0;

  const filteredInventory = selectedSite === 'Organization-wise' 
    ? inventory 
    : inventory.filter(i => i.site === selectedSite);

  const filteredRequests = selectedSite === 'Organization-wise'
    ? requests
    : requests.filter(r => r.requestingSite === selectedSite);

  const pendingApprovals = filteredRequests.filter(r => r.status === 'Pending Director Approval').length;
  const lowStockCount = filteredInventory.filter(item => item.quantity <= item.minQty).length;

  const modules = [
    { id: 'material-stock', title: 'Inventory Ledger', icon: PackageSearch, color: 'text-blue-600', desc: 'Real-time stock across sites' },
    { id: 'indent-register', title: 'Material Indents', icon: Package, color: 'text-amber-600', desc: 'Authorized requests & status' },
    { id: 'mis-register', title: 'Issue Slips (MIS)', icon: ClipboardList, color: 'text-green-600', desc: 'On-site material distribution' },
    { id: 'material-shifting', title: 'Bill Checking (GRN)', icon: Receipt, color: 'text-purple-600', desc: 'Audit verified receipts' },
    { id: 'work-done-report', title: 'Work Done Report', icon: ClipboardCheck, color: 'text-indigo-600', desc: 'Daily site progress tracking' },
    { id: 'boq-analysis', title: 'BOQ Analysis', icon: FileSpreadsheet, color: 'text-emerald-600', desc: 'Planned vs Actual comparison' },
    { id: 'boq-management', title: 'BOQ Management', icon: FileUp, color: 'text-cyan-600', desc: 'Master BOQ & configurations' },
    { id: 'ai-review', title: 'AI Bill Review', icon: BrainCircuit, color: 'text-pink-600', desc: 'Automated audit & discrepancies' },
    { id: 'returnable-material', title: 'Returnable Assets', icon: RefreshCw, color: 'text-orange-600', desc: 'Track tools & machinery' },
    { id: 'vehicle-usage', title: 'Vehicle Entries', icon: Car, color: 'text-rose-600', desc: 'Logistics & fuel tracking' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary">Executive Oversight</h1>
          <p className="text-muted-foreground">MaterialFlow Organizational Control</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-2 rounded-xl border shadow-sm">
          <Building2 className="h-4 w-4 text-muted-foreground ml-2" />
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-[220px] border-none focus:ring-0 shadow-none font-bold">
              <SelectValue placeholder="Select Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Organization-wise">All Sites Combined</SelectItem>
              {sitesList.filter(s => s !== 'Global' && s !== 'All').map(site => <SelectItem key={site} value={site}>{site}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showMissingAlert && (
        <Alert variant="destructive" className="border-2 border-destructive bg-destructive/5 animate-pulse shadow-xl py-6">
          <AlertCircle className="h-8 w-8" />
          <div className="ml-4 flex-1">
            <AlertTitle className="text-xl font-black uppercase tracking-tight mb-1">
              Audit Alert: Overdue Site Reports
            </AlertTitle>
            <AlertDescription className="text-base font-medium opacity-90">
              Yesterday's Daily Work Done Report is missing for the following sites: <span className="font-black underline">{missingSites.join(', ')}</span>. 
              Site Managers must update these logs immediately.
            </AlertDescription>
          </div>
          <Button 
            size="lg" 
            className="ml-4 font-black uppercase tracking-widest bg-destructive hover:bg-destructive/90 text-white"
            onClick={() => router.push('/dashboard/work-done-report')}
          >
            Review Reports <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Alert>
      )}

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
          title="Daily Progress"
          value="Reports"
          icon={ClipboardCheck}
          description="View work done"
          onClick={() => router.push('/dashboard/work-done-report')}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((m) => (
            <Card key={m.id} className="hover:shadow-lg transition-all cursor-pointer group border-primary/10 overflow-hidden" onClick={() => router.push(`/dashboard/reports?module=${m.id}&site=${selectedSite}`)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                <CardTitle className="text-sm font-bold">{m.title}</CardTitle>
                <m.icon className={cn("h-5 w-5", m.color)} />
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-[10px] text-muted-foreground mb-4 h-8 line-clamp-2">{m.desc}</p>
                <Button variant="ghost" size="sm" className="w-full justify-between font-bold text-[9px] uppercase tracking-widest text-primary group-hover:bg-primary/5">
                  View Audit Data <ArrowUpRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
