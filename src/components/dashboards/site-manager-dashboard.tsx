'use client';

import {
  Package,
  PackageCheck,
  PackageSearch,
  AlertTriangle,
  History,
  Eye,
  Download,
  FileText,
  ClipboardList
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { recentSiteActivity } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useMaterialContext, MaterialIndentBill } from '@/context/material-context';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockBoqData } from '@/lib/mock-data';


export default function SiteManagerDashboard() {
  const { toast } = useToast();
  const router = useRouter();
  const { requests, inventory, issuedMaterials, receipts: pastReceipts, issueSlips } = useMaterialContext();
  const { site } = useUser();
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialIndentBill | null>(null);
  const [activityFilter, setActivityFilter] = React.useState('All');
  const [otherSiteFilter, setOtherSiteFilter] = React.useState('All');

  const siteName = site || "Current Site"; 

  // MIS Stats
  const confirmedSlips = issueSlips.filter(s => s.siteName === siteName && s.status === 'Issued');
  const dailyIssuedCount = confirmedSlips.filter(s => isSameDay(new Date(s.date), new Date())).length;
  const totalIssuedQty = confirmedSlips.reduce((acc, s) => acc + s.quantity, 0);

  const sitePendingRequests = React.useMemo(() => {
      return requests.filter(req => req.site === siteName && (req.status === 'Pending Director Approval' || req.status === 'Director Approved' || req.status === 'PO Generated'));
  }, [requests, siteName]);


  const allSitesForFilter = React.useMemo(() => {
    return ['All', ...Array.from(new Set(inventory.map(item => item.site)))];
  }, [inventory]);

  const filteredSiteActivity = React.useMemo(() => {
    let activities = recentSiteActivity.filter(act => act.site === siteName);
    if (activityFilter !== 'All') activities = activities.filter(act => act.type === activityFilter);
    if (otherSiteFilter !== 'All') activities = activities.filter(act => act.from === otherSiteFilter || act.to === otherSiteFilter);
    return activities;
  }, [recentSiteActivity, siteName, activityFilter, otherSiteFilter]);

  const lowStockSite = React.useMemo(() => {
    return inventory.filter(item => item.site === siteName && item.quantity <= item.minQty);
  }, [inventory, siteName]);
  const lowStockCount = lowStockSite.length;
  
  const currentSiteStock = React.useMemo(() => {
      return inventory.filter(item => item.site === siteName);
  }, [inventory, siteName]);

  const pendingGrns = React.useMemo(() => {
    if (!site) return [];
    const receivedIssueIds = new Set(pastReceipts.map(r => r.issuedId));
    return issuedMaterials.filter(im => im.receivingSite === site && !receivedIssueIds.has(im.issuedId));
  }, [issuedMaterials, pastReceipts, site]);

  const handleLogReceipt = (issuedId: string) => {
    router.push(`/dashboard/receipts?issuedId=${issuedId}`);
  };

  const handleViewBill = (reqId: string) => {
    const request = requests.find(r => r.id === reqId);
    if (request) {
      const returnDate = request.requiredPeriod ? new Date(request.requiredPeriod.to) : new Date(request.returnDate);
      const requestDate = request.requestDate ? new Date(request.requestDate) : new Date(returnDate.getTime() - 11 * 24 * 60 * 60 * 1000);
      const materialInfo = mockBoqData.materials.find(m => m.type.toLowerCase() === request.material.toLowerCase()) || {rate: 0};

      const bill: MaterialIndentBill = {
        requestId: request.id,
        requestDate: requestDate,
        requesterName: request.requesterName || 'Sample Requester',
        requestingSite: request.site,
        materials: request.materials || [{ materialName: request.material, quantity: request.quantity, unit: 'unit', rate: materialInfo.rate }],
        requiredPeriod: { from: new Date(request.requiredPeriod?.from || requestDate), to: returnDate },
        remarks: request.remarks || `This is a sample bill for request ${request.id}`,
        issuedId: `ISS-${request.id.substring(4)}`,
        shiftingDate: new Date(),
        requester: { name: request.requesterName || 'Sample Requester' },
        totalValue: request.materials ? request.materials.reduce((acc, m) => acc + m.quantity * (m.rate || 0), 0) : request.quantity * materialInfo.rate,
        issuingSite: request.issuingSite || 'Pending Assignment',
      };
      setLastGeneratedBill(bill);
    }
  };

  const handleDownloadExcel = (reportName: string) => {
    toast({ title: "Download Started", description: `Your ${reportName} for ${siteName} is being generated.` });
  };

  return (
    <>
      <h1 className="text-3xl font-bold font-headline">{siteName} Dashboard</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
           <StatCard
              title="Daily Materials Issued"
              value={`${dailyIssuedCount} Slips`}
              icon={ClipboardList}
              description={`Total ${totalIssuedQty} units confirmed today`}
              onClick={() => router.push('/dashboard/material-issue')}
            />

           <Dialog>
            <DialogTrigger asChild>
               <div className="cursor-pointer">
                  <StatCard
                    title="Site Stock"
                    value={`${currentSiteStock.length} Items`}
                    icon={PackageSearch}
                    description="Live verified inventory"
                  />
               </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Stock Audit: {siteName}</DialogTitle>
                <DialogDescription>Live inventory of materials currently held at this project site.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                 {currentSiteStock.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Qty</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {currentSiteStock.map((material) => (
                          <TableRow key={material.id}>
                              <TableCell className="font-bold text-xs">{material.material}</TableCell>
                              <TableCell className="text-xs font-black">{material.quantity} {material.unit}</TableCell>
                              <TableCell><Badge variant={material.quantity <= material.minQty ? 'destructive' : 'outline'} className="text-[9px] uppercase">{material.quantity <= material.minQty ? 'Low Stock' : 'Stable'}</Badge></TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground p-8 italic text-xs">No stock data found for this site.</p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => handleDownloadExcel('Site Stock Report')}><Download className="mr-2 h-4 w-4" /> Download Audit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <StatCard
            title="Pending Indents"
            value={sitePendingRequests.length.toString()}
            icon={Package}
            description="Awaiting director authorization"
          />

          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <StatCard
                  title="Low Stock Alerts"
                  value={`${lowStockCount} Items`}
                  icon={AlertTriangle}
                  className="text-destructive border-destructive/50"
                  description="Immediate re-order required"
                />
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Critical Shortages: {siteName}</DialogTitle>
                <DialogDescription>These materials are below safety thresholds and require immediate indenting.</DialogDescription>
              </DialogHeader>
               {lowStockSite.length > 0 ? (
                  <Table>
                      <TableHeader><TableRow><TableHead>Material</TableHead><TableHead className="text-right">Available</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {lowStockSite.map(item => (
                              <TableRow key={item.id} className="text-destructive">
                                  <TableCell className="font-bold text-xs">{item.material}</TableCell>
                                  <TableCell className="text-right font-black text-xs underline">{item.quantity} {item.unit}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                </Table>
              ) : (
                  <p className="text-center text-muted-foreground p-8 text-xs italic">Safety levels are currently stable.</p>
              )}
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary"/> Recent Issue Slips (MIS)</CardTitle>
                        <CardDescription className="text-[10px] uppercase tracking-widest">Live log of materials issued to engineers at this site.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {confirmedSlips.length > 0 ? (
                        <Table>
                              <TableHeader className="bg-muted/30"><TableRow><TableHead className="text-[9px] h-8 px-4">Slip #</TableHead><TableHead className="text-[9px] h-8">Material</TableHead><TableHead className="text-[9px] h-8">Qty</TableHead><TableHead className="text-[9px] h-8">Requester</TableHead><TableHead className="text-right text-[9px] h-8 pr-4">Date</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {confirmedSlips.slice(0, 5).map(slip => (
                                      <TableRow key={slip.slipNumber}>
                                          <TableCell className="font-black text-[10px] px-4">{slip.slipNumber}</TableCell>
                                          <TableCell className="text-xs font-bold">{slip.materialName}</TableCell>
                                          <TableCell className="text-xs font-black text-primary">{slip.quantity} {slip.unit}</TableCell>
                                          <TableCell className="text-xs opacity-70">{slip.requestedBy}</TableCell>
                                          <TableCell className="text-right text-xs text-muted-foreground pr-4">{format(new Date(slip.date), 'dd MMM')}</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground p-12 text-xs italic">No confirmed issue slips recorded yet.</p>
                      )}
                    </CardContent>
                </Card>
            </div>
            {lastGeneratedBill && (
              <div className="lg:col-span-2">
                <Card className="border-primary/20">
                  <CardHeader className="bg-primary/5 rounded-t-lg">
                      <CardTitle className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-primary" /> Material Indent Bill</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest">ID: {lastGeneratedBill.requestId}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2 rounded-lg border p-4 bg-muted/10 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <p><strong>Date:</strong> {format(lastGeneratedBill.requestDate, 'PPP')}</p>
                        <p><strong>Site:</strong> {lastGeneratedBill.requestingSite}</p>
                        <p><strong>Requester:</strong> {lastGeneratedBill.requester?.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-[10px] uppercase text-muted-foreground">Material Details</h3>
                      <Table>
                        <TableHeader><TableRow><TableHead className="text-[9px] h-7">Item</TableHead><TableHead className="text-[9px] h-7 text-right">Value</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {lastGeneratedBill.materials.map((m, i) => (
                            <TableRow key={i} className="h-8"><TableCell className="text-xs">{m.materialName} ({m.quantity} {m.unit})</TableCell><TableCell className="text-right text-xs font-black">${(m.quantity * (m.rate || 0)).toFixed(2)}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Separator />
                      <div className="flex justify-between font-black text-primary text-lg px-2"><span>Total</span><span>${lastGeneratedBill.totalValue.toFixed(2)}</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
        </div>
      </div>
    </>
  );
}
