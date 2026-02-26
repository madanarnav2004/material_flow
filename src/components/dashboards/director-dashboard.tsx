'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { useRouter } from 'next/navigation';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/dashboard/stat-card';
import {
  Package,
  AlertTriangle,
  PackageSearch,
  Eye,
  ChevronDown,
  FileText,
  Download,
  BarChart as BarChartIcon,
  FileSpreadsheet,
} from 'lucide-react';
import {
  monthlyConsumption,
  recentTransfers,
  detailedMonthlyConsumption,
  detailedStock,
  stockUpdates,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useMaterialContext, type IndentStatus, type InventoryItem, MaterialIndentBill } from '@/context/material-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


const chartConfig: ChartConfig = {
  consumption: {
    label: 'Consumption',
    color: 'hsl(var(--primary))',
  },
};

export default function DirectorDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { requests, setRequests, inventory } = useMaterialContext();
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialIndentBill | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null);
  const [isConsumptionDialogOpen, setIsConsumptionDialogOpen] = React.useState(false);
  const [consumptionSite, setConsumptionSite] = React.useState('All');
  const [stockSite, setStockSite] = React.useState('Overall');
  const [lowStockSite, setLowStockSite] = React.useState('All');

  const indentsForApproval = requests.filter(r => r.status === 'Pending Director Approval');
  
  const lowStockMaterials = React.useMemo(() => {
    return inventory.filter(item => item.quantity <= item.minQty);
  }, [inventory]);

  const filteredLowStockMaterials = React.useMemo(() => {
    if (lowStockSite === 'All') return lowStockMaterials;
    return lowStockMaterials.filter(item => item.site === lowStockSite);
  }, [lowStockMaterials, lowStockSite]);

  const sites = ['All', ...new Set(inventory.map(item => item.site))];

  const lowStockCount = lowStockMaterials.length;

  const stockLocations = ['Overall', 'MAPI Godown', ...new Set(inventory.map(s => s.site).filter(s => s !== 'MAPI Godown'))];
  
  const consumptionSites = React.useMemo(() => {
    const junData = detailedMonthlyConsumption?.Jun;
    if (junData && Array.isArray(junData.siteWise)) {
      const sites = new Set(junData.siteWise.map((s: any) => s.site));
      return ['All', ...Array.from(sites)];
    }
    return ['All'];
  }, []);

  const totalMaterials = React.useMemo(() => {
    return inventory.reduce((acc, item) => acc + item.quantity, 0);
  }, [inventory]);

  const stockTableData = React.useMemo(() => {
    if (stockSite === 'Overall') {
      return inventory;
    }
    return inventory.filter((item) => item.site === stockSite);
  }, [inventory, stockSite]);

  const handleStatusChange = (reqId: string, newStatus: IndentStatus) => {
    setRequests(prev => prev.map(req => (req.id === reqId ? { ...req, status: newStatus } : req)));
    toast({
      title: `Audit Decision: ${newStatus}`,
      description: `Indent ${reqId} has been officially updated in the system ledger.`,
    });
  };

  const handleViewBill = (reqId: string) => {
    const request = requests.find(r => r.id === reqId);
    if (request) {
      const bill: MaterialIndentBill = {
        ...request,
        requestId: request.id,
        requestDate: new Date(request.requestDate),
        requiredPeriod: { 
            from: new Date(request.requiredPeriod.from), 
            to: new Date(request.requiredPeriod.to) 
        },
        issuedId: request.issuedId || `ISS-${request.id.substring(4)}`,
        shiftingDate: new Date(),
        requester: { name: request.requesterName },
        totalValue: request.materials.reduce((acc, m) => acc + m.quantity * (m.rate || 0), 0),
      };
      setLastGeneratedBill(bill);
    }
  };

  const handleDownloadExcel = (reportName: string, site: string) => {
    toast({
      title: 'Audit Document Generation',
      description: `Preparing ${reportName} for ${site}. Document will be valid for 24h.`,
    });
  };
  
  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const month = data.activePayload[0].payload.month;
      setSelectedMonth(month);
      setConsumptionSite('All');
      setIsConsumptionDialogOpen(true);
    }
  };
  
  const selectedMonthData = selectedMonth ? detailedMonthlyConsumption[selectedMonth as keyof typeof detailedMonthlyConsumption] : null;


  return (
    <>
      <h1 className="text-3xl font-bold font-headline uppercase tracking-tight">Executive Dashboard</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Cost Analysis"
            value="BOQ Monitor"
            icon={FileSpreadsheet}
            description="Reconcile planned vs actual budgets"
            className="border-primary/50"
            onClick={() => router.push('/dashboard/boq-analysis')}
          />

          <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Org Inventory" value={`${totalMaterials.toLocaleString()} units`} icon={PackageSearch} description={`Verified across ${new Set(inventory.map(i => i.site)).size} site audits`} />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                  <DialogTitle>Unified Inventory Ledger</DialogTitle>
                  <DialogDescription>Central audit view of material distribution, discrepancies, and recent ledger updates.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                  {detailedStock.length > 0 && detailedStock.some(s => s.mismatch) && (
                    <div>
                        <h3 className="text-[10px] uppercase font-bold text-destructive mb-2 tracking-widest">Immediate Attention: Stock Mismatches</h3>
                        <Table>
                            <TableHeader className="bg-destructive/5"><TableRow><TableHead className="h-8 text-[10px]">Material</TableHead><TableHead className="h-8 text-[10px]">Managed Site</TableHead><TableHead className="h-8 text-[10px] text-right">Physical Audit</TableHead><TableHead className="h-8 text-[10px] text-right">System Ledger</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {detailedStock.filter(s => s.mismatch).map(item => (
                                    <TableRow key={item.id} className="bg-destructive/5 text-destructive border-b-destructive/10">
                                        <TableCell className="font-bold text-xs">{item.material}</TableCell>
                                        <TableCell className="text-xs">{item.site}</TableCell>
                                        <TableCell className="text-right font-black text-xs underline decoration-2">{item.quantity.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-xs opacity-70">{item.expected.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                  )}
                  <div>
                      <h3 className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-widest">Global Material Ledger</h3>
                      <Table>
                          <TableHeader><TableRow><TableHead className="text-[10px] h-8">Material Identifier</TableHead><TableHead className="text-[10px] h-8">Managed site</TableHead><TableHead className="text-[10px] h-8">Classification</TableHead><TableHead className="text-right text-[10px] h-8">Verified Qty</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {detailedStock.map(item => (
                                  <TableRow key={item.id}>
                                      <TableCell className="font-bold text-xs">{item.material}</TableCell>
                                      <TableCell className="text-xs">{item.site}</TableCell>
                                      <TableCell><Badge variant="secondary" className="text-[9px] uppercase font-bold">{item.type}</Badge></TableCell>
                                      <TableCell className="text-right font-black text-xs text-primary">{item.quantity.toLocaleString()}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
                   <div>
                      <h3 className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-widest">Audit Event Stream (Last 5)</h3>
                      <Table>
                          <TableHeader><TableRow><TableHead className="text-[10px] h-8">Resource</TableHead><TableHead className="text-[10px] h-8">Location</TableHead><TableHead className="text-[10px] h-8">Audit Change</TableHead><TableHead className="text-[10px] h-8">Timestamp</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {stockUpdates.map(item => (
                                  <TableRow key={item.id}>
                                      <TableCell className="text-xs font-medium">{item.material}</TableCell>
                                      <TableCell className="text-xs">{item.site}</TableCell>
                                      <TableCell className={cn("text-xs font-black", item.change.startsWith('+') ? 'text-green-600' : 'text-red-600')}>{item.change}</TableCell>
                                      <TableCell className="text-xs text-muted-foreground">{item.date}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
              </div>
              <DialogFooter className="bg-muted/30 p-4 border-t rounded-b-lg">
                  <Button variant="outline" className="text-xs" onClick={() => handleDownloadExcel('Full Audit Ledger', 'All Sites')}>
                      <Download className="mr-2 h-3 w-3" />
                      Export Verified Ledger (XLSX)
                  </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <StatCard
                  title="Awaiting Approval"
                  value={indentsForApproval.length.toString()}
                  icon={Package}
                  description={`Official indents from ${new Set(indentsForApproval.map(p => p.site)).size} sites`}
                  className="border-yellow-500/50"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Official Approval Queue</DialogTitle>
                <DialogDescription>Review and authorize material indents to trigger site-assignment or PO flow.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                {indentsForApproval.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px]">Indent ID</TableHead>
                      <TableHead className="text-[10px]">Material Resource</TableHead>
                      <TableHead className="text-[10px]">Total Qty</TableHead>
                      <TableHead className="text-[10px]">Requesting site</TableHead>
                      <TableHead className="text-right text-[10px]">Decision</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indentsForApproval.map(req => (
                      <TableRow key={req.id}>
                        <TableCell className="font-black text-xs">{req.id}</TableCell>
                        <TableCell className="text-xs">{req.materials.map(m=>m.materialName).join(', ')}</TableCell>
                        <TableCell className="text-xs font-black">{req.materials.reduce((acc,m)=>acc+m.quantity,0)}</TableCell>
                        <TableCell className="text-xs font-bold">{req.requestingSite}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleViewBill(req.id)}><Eye className="h-3 w-3" /></Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 px-2 font-bold text-[10px]">
                                EXECUTE <ChevronDown className="ml-1 h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem className="text-xs font-bold" onClick={() => handleStatusChange(req.id, 'Director Approved')}>
                                Authorize Indent
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs font-bold text-destructive" onClick={() => handleStatusChange(req.id, 'Director Rejected')}>
                                Decline Authorization
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center p-12 text-muted-foreground text-xs italic">All material indents have been authorized. Queue empty.</div>
              )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <StatCard
                  title="Safety Threshold Alerts"
                  value={`${lowStockCount} critical`}
                  icon={AlertTriangle}
                  description="Physical stock below re-order points"
                  className="text-destructive border-destructive/50 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Critical Stock Shortages</DialogTitle>
                <div className="flex justify-between items-center pt-2">
                  <DialogDescription>Managed resources below authorized safety thresholds.</DialogDescription>
                   <Select value={lowStockSite} onValueChange={setLowStockSite}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue placeholder="Scope Site" />
                      </SelectTrigger>
                      <SelectContent>
                          {sites.map(site => <SelectItem key={site} value={site}>{site}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
              </DialogHeader>
               <div className="max-h-[60vh] overflow-y-auto">
                {filteredLowStockMaterials.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-muted/50">
                          <TableRow>
                          <TableHead className="text-[10px] h-8">Material</TableHead>
                          <TableHead className="text-[10px] h-8">Scope site</TableHead>
                          <TableHead className="text-right text-[10px] h-8">Physical stock</TableHead>
                          <TableHead className="text-right text-[10px] h-8">Safety level</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {filteredLowStockMaterials.map((item: InventoryItem) => (
                          <TableRow key={item.id} className="text-destructive border-destructive/10">
                              <TableCell className="font-bold text-xs">{item.material}</TableCell>
                              <TableCell className="text-xs">{item.site}</TableCell>
                              <TableCell className="text-right font-black text-xs underline">{`${item.quantity.toLocaleString()} ${item.unit}`}</TableCell>
                              <TableCell className="text-right text-xs opacity-70">{`${item.minQty.toLocaleString()} ${item.unit}`}</TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground p-12 text-xs italic">Authorized sites are currently above critical stock thresholds.</p>
                )}
              </div>
              <DialogFooter className="bg-muted/20 border-t p-4">
                <Button className="text-xs h-8" onClick={() => handleDownloadExcel('Critical Stock Exception', lowStockSite)}>
                  <Download className="mr-2 h-3 w-3" />
                  Generate Purchase Alert Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <Dialog open={isConsumptionDialogOpen} onOpenChange={setIsConsumptionDialogOpen}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-2xl transition-all border-primary/10">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-lg">Resource Consumption Trend</CardTitle>
                      <CardDescription className="text-xs">Organizational material utilization vs time.</CardDescription>
                    </div>
                    <BarChartIcon className="h-5 w-5 text-primary opacity-50" />
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                      <BarChart data={monthlyConsumption} accessibilityLayer onClick={handleBarClick}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} className="text-[10px] font-bold" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="consumption" fill="var(--color-consumption)" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Audit: Monthly Resource Utilization ({selectedMonth})</DialogTitle>
                  <div className="flex justify-between items-center pt-2">
                    <DialogDescription className="text-xs">
                      Drill-down data for organizational consumption.
                    </DialogDescription>
                    <Select value={consumptionSite} onValueChange={setConsumptionSite}>
                        <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                            <SelectValue placeholder="Filter Site" />
                        </SelectTrigger>
                        <SelectContent>
                            {consumptionSites.map(site => <SelectItem key={site} value={site}>{site}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                </DialogHeader>
                {selectedMonthData ? (
                  <div className="max-h-[60vh] overflow-y-auto space-y-8 pr-2">
                    {selectedMonthData.organizationWise && Array.isArray(selectedMonthData.organizationWise) && (
                      <div className="rounded-xl border p-4 bg-muted/5">
                        <h3 className="text-[10px] uppercase font-bold text-primary mb-3 tracking-widest">Global Resource Burn</h3>
                         <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="text-[10px] h-8">MaterialIdentifier</TableHead>
                                <TableHead className="text-right text-[10px] h-8">Total Dispatched</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedMonthData.organizationWise.map((item:any) => (
                                <TableRow key={item.name} className="h-10">
                                  <TableCell className="text-xs font-medium">{item.name}</TableCell>
                                  <TableCell className="text-right font-black text-xs text-primary">{item.quantity.toLocaleString()} {item.unit}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                      </div>
                    )}
                    {selectedMonthData.siteWise && Array.isArray(selectedMonthData.siteWise) && (
                      <div className="space-y-4">
                        <h3 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Authorized Site Utilization</h3>
                         {(selectedMonthData.siteWise.filter((s:any) => consumptionSite === 'All' || s.site === consumptionSite)).map((siteData:any) => (
                           <div key={siteData.site} className="border rounded-xl p-4 shadow-sm bg-background">
                             <div className="flex justify-between items-center mb-3">
                                <h4 className="font-black text-xs uppercase tracking-tighter text-primary">{siteData.site}</h4>
                                <Badge variant="outline" className="text-[9px] h-4">Site Audit Confirmed</Badge>
                             </div>
                              <Table>
                                <TableHeader className="bg-muted/20">
                                  <TableRow>
                                    <TableHead className="text-[10px] h-7">Resource</TableHead>
                                    <TableHead className="text-right text-[10px] h-7">Qty</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {siteData.materials?.map((material:any) => (
                                    <TableRow key={material.name} className="h-8 border-dashed">
                                      <TableCell className="text-[11px] font-medium py-1">{material.name}</TableCell>
                                      <TableCell className="text-right font-black text-[11px] py-1">{material.quantity.toLocaleString()} {material.unit}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground text-xs italic">Select a valid data series from the executive trend chart.</div>
                )}
                <DialogFooter className="border-t pt-4">
                  <Button size="sm" className="text-[10px] h-8 font-bold" onClick={() => handleDownloadExcel(`Resource Audit ${selectedMonth}`, consumptionSite)}>
                    <Download className="mr-2 h-3 w-3" />
                    EXPORT DRILL-DOWN (XLSX)
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Card className="border-primary/10 shadow-sm">
              <CardHeader className="pb-2 border-b">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-base">Asset & Material Distribution</CardTitle>
                        <CardDescription className="text-[10px] uppercase tracking-widest">Verified physical stock by site.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={stockSite} onValueChange={setStockSite}>
                          <SelectTrigger className="w-[160px] h-7 text-[10px] bg-background">
                              <SelectValue placeholder="Scope site" />
                          </SelectTrigger>
                          <SelectContent>
                              {stockLocations.map(loc => <SelectItem key={loc} value={loc} className="text-[10px]">{loc}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleDownloadExcel('Distribution Audit', stockSite)}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-auto scrollbar-thin scrollbar-thumb-muted">
                    <Table>
                        <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-sm"><TableRow><TableHead className="text-[10px] h-8">SiteIdentifier</TableHead><TableHead className="text-[10px] h-8">Resource Identifier</TableHead><TableHead className="text-right text-[10px] h-8 pr-6">Verified Stock</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {stockTableData.length > 0 ? (
                                stockTableData.map((item) => (
                                    <TableRow key={item.id} className="h-10 hover:bg-primary/5 transition-colors">
                                        <TableCell className="text-xs font-bold opacity-70">{item.site}</TableCell>
                                        <TableCell className="text-xs font-bold">{item.material}</TableCell>
                                        <TableCell className="text-right pr-6 font-black text-xs text-primary">{item.quantity.toLocaleString()} {item.unit}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center p-12 text-xs italic text-muted-foreground">The verified stock ledger is empty for this scope.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            {lastGeneratedBill && (
              <div className="lg:col-span-2 animate-in fade-in slide-in-from-right-4 duration-500">
                <Card className="border-primary/20 shadow-2xl overflow-hidden">
                  <CardHeader className="flex flex-row items-start justify-between bg-primary/5 p-6 border-b">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <FileText className="h-5 w-5" /> Executive Bill Audit
                      </CardTitle>
                      <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Indent Reference: {lastGeneratedBill.requestId}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase font-black tracking-widest shadow-sm" onClick={() => handleDownloadExcel('Official Bill Document', lastGeneratedBill.requestId)}>
                        <Download className="mr-1 h-3 w-3" /> EXPORT PDF
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6 bg-background">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-3 rounded-xl border p-4 bg-muted/10 relative">
                            <div className="absolute top-0 right-0 p-2 opacity-5"><FileText className="h-12 w-12"/></div>
                            <h3 className="font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Original Indent Metadata</h3>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div><p className="opacity-50 uppercase text-[8px]">Request ID</p><p className="font-bold">{lastGeneratedBill.requestId}</p></div>
                                <div><p className="opacity-50 uppercase text-[8px]">Submit Date</p><p className="font-bold">{format(lastGeneratedBill.requestDate, 'PPP')}</p></div>
                                <div><p className="opacity-50 uppercase text-[8px]">Source site</p><p className="font-bold">{lastGeneratedBill.requestingSite}</p></div>
                                <div><p className="opacity-50 uppercase text-[8px]">Authorizer</p><p className="font-bold">{lastGeneratedBill.requester?.name}</p></div>
                            </div>
                        </div>
                        <div className="space-y-3 rounded-xl border p-4 bg-primary/5 border-primary/10 relative">
                            <div className="absolute top-0 right-0 p-2 opacity-5"><PackageSearch className="h-12 w-12 text-primary"/></div>
                            <h3 className="font-black text-[9px] uppercase tracking-[0.2em] text-primary">Authorized Logistics Flow</h3>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div><p className="opacity-50 uppercase text-[8px]">Fulfillment site</p><p className="font-bold">{lastGeneratedBill.issuingSite}</p></div>
                                <div><p className="opacity-50 uppercase text-[8px]">Issue reference</p><p className="font-bold">{lastGeneratedBill.issuedId}</p></div>
                                <div><p className="opacity-50 uppercase text-[8px]">Audit timestamp</p><p className="font-bold">{format(lastGeneratedBill.shiftingDate, 'PPP')}</p></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground px-1">Resource Line Items (Audited)</h3>
                      <div className="rounded-xl border shadow-sm overflow-hidden bg-background">
                        <Table>
                            <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-[9px] h-8 px-4">Identifier</TableHead>
                                <TableHead className="text-[9px] h-8">Qty</TableHead>
                                <TableHead className="text-[9px] h-8">Rate</TableHead>
                                <TableHead className="text-right text-[9px] h-8 px-4">ExtendedValue</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {lastGeneratedBill.materials.map((m, i) => (
                                <TableRow key={i} className="h-10 hover:bg-muted/20 transition-colors">
                                <TableCell className="text-[11px] font-bold px-4">{m.materialName} ({m.unit})</TableCell>
                                <TableCell className="text-[11px] font-black">{m.quantity.toLocaleString()}</TableCell>
                                <TableCell className="text-[11px] opacity-70">${m.rate.toFixed(2)}</TableCell>
                                <TableCell className="text-right text-[11px] font-black px-4 text-primary">${(m.quantity * m.rate).toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                      </div>
                      <Separator className="my-4 opacity-50" />
                      <div className="flex flex-col items-end px-2">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Audit Confirmed Taxable Total</p>
                        <span className="text-4xl font-black text-primary font-headline tracking-tighter">${lastGeneratedBill.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-2xl transition-all border-amber-500/10 hover:border-amber-500/30 group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="group-hover:text-amber-600 transition-colors">Asset Return & Renewal Cycle</CardTitle>
                        <CardDescription className="text-xs">Resources due for site return or project completion audit.</CardDescription>
                    </div>
                    <Badge variant="outline" className="animate-pulse bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 uppercase tracking-widest text-[10px] font-bold">Action Queue</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead className="text-[9px] h-8">Identifier</TableHead><TableHead className="text-[9px] h-8">Quantity</TableHead><TableHead className="text-[9px] h-8">SiteLocation</TableHead><TableHead className="text-[9px] h-8">Threshold date</TableHead><TableHead className="text-right text-[9px] h-8">AuditState</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {requests.slice(0, 3).map(req => (
                      <TableRow key={req.id} className="h-10 border-dashed">
                        <TableCell className="font-bold text-xs">{req.material}</TableCell>
                        <TableCell className="text-xs font-black">{req.quantity}</TableCell>
                        <TableCell className="text-xs font-medium opacity-70">{req.site}</TableCell>
                        <TableCell className="text-xs font-black">{format(new Date(req.returnDate), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-right">
                           <Badge 
                              variant="outline"
                              className={cn(
                                  'text-[9px] uppercase font-black h-5 px-2 border-2',
                                  req.status === 'Pending Director Approval' && 'border-yellow-500 text-yellow-600 bg-yellow-500/5',
                                  req.status === 'Director Approved' && 'border-blue-500 text-blue-600 bg-blue-500/5',
                                  req.status === 'Issued' && 'border-green-600 text-green-600 bg-green-600/5',
                                  req.status === 'PO Generated' && 'border-purple-500 text-purple-600 bg-purple-500/5',
                                  req.status === 'Completed' && 'opacity-50 grayscale'
                              )}
                          >
                              {req.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Unified Resource Lifecycle Ledger</DialogTitle>
              <DialogDescription>Full audit history of material indents, authorizations, and return cycles across Swanag Infrastructures.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto border rounded-xl shadow-inner scrollbar-thin">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-[10px] h-10 px-4">Audit ID</TableHead>
                    <TableHead className="text-[10px] h-10">ResourceIdentifier</TableHead>
                    <TableHead className="text-[10px] h-10">Issuer site</TableHead>
                    <TableHead className="text-[10px] h-10">Request site</TableHead>
                    <TableHead className="text-[10px] h-10">Return date</TableHead>
                    <TableHead className="text-[10px] h-10">State</TableHead>
                    <TableHead className="text-right text-[10px] h-10 px-4">Operation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(req => (
                    <TableRow key={req.id} className="h-12 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-black text-[10px] px-4 opacity-50">{req.id}</TableCell>
                      <TableCell className="text-xs font-bold">{req.material}</TableCell>
                      <TableCell className="text-xs font-medium">{req.issuingSite || '---'}</TableCell>
                      <TableCell className="text-xs font-bold text-primary">{req.site}</TableCell>
                      <TableCell className="text-xs font-black">{format(new Date(req.returnDate), 'dd MMM yy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[9px] uppercase font-black px-2 py-0.5", req.status === 'Completed' ? 'grayscale opacity-50' : 'border-primary/20 bg-primary/5 text-primary')}>
                            {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-4 space-x-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleViewBill(req.id)}><Eye className="h-3 w-3" /></Button>
                        {req.status === 'Pending Director Approval' && (
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 px-2 text-[9px] font-black uppercase">ACTION <ChevronDown className="ml-1 h-3 w-3" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem className="text-xs font-bold" onClick={() => handleStatusChange(req.id, 'Director Approved')}>Authorize Request</DropdownMenuItem>
                              <DropdownMenuItem className="text-xs font-bold text-destructive" onClick={() => handleStatusChange(req.id, 'Director Rejected')}>Reject Request</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter className="border-t p-4 bg-muted/10">
              <Button size="sm" className="text-[10px] h-8 font-bold" onClick={() => handleDownloadExcel('Lifecycle Audit Report', 'Overall Organization')}>
                <Download className="mr-2 h-3 w-3" />
                EXPORT FULL LIFECYCLE (XLSX)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b py-3">
            <CardTitle className="text-base">Recent verified material transfers</CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-widest">Log of verified goods movement between project site hubs.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30"><TableRow><TableHead className="text-[10px] h-8 px-4">ResourceIdentifier</TableHead><TableHead className="text-[10px] h-8">Issuing point</TableHead><TableHead className="text-[10px] h-8">Receiving point</TableHead><TableHead className="text-[10px] h-8">Status</TableHead><TableHead className="text-[10px] h-8 pr-4">Timestamp</TableHead></TableRow></TableHeader>
              <TableBody>
                {recentTransfers.map(transfer => (
                  <TableRow key={transfer.id} className="h-10">
                    <TableCell className="font-bold text-xs px-4">{transfer.material}</TableCell>
                    <TableCell className="text-[11px] opacity-70">{transfer.issuingSite}</TableCell>
                    <TableCell className="text-[11px] font-bold text-primary">{transfer.receivingSite}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                           "text-[9px] uppercase font-black px-2",
                           transfer.status === 'Completed' && 'bg-green-600/80 text-white',
                           transfer.status === 'PO Generated' && 'bg-purple-500/80 text-white'
                        )}
                      >
                        {transfer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground pr-4">{transfer.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}