'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, ChevronDown, PackageCheck, ClipboardList, Calendar as CalendarIcon, Filter, LayoutDashboard, FileUp, ClipboardCheck, BrainCircuit } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMaterialContext } from '@/context/material-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { detailedBoqAnalysis } from '@/lib/mock-data';

const reportTypes = [
  {
    id: "mis-register",
    title: "Material Issue Slip (MIS) Register",
    description: "Detailed log of all materials issued via official slips at project sites.",
    variants: ["Site-wise", "Organization-wise"],
    headers: ['Slip #', 'Material', 'Qty', 'Unit', 'Requested By', 'Status', 'Date'],
    dataKeys: ['slipNumber', 'materialName', 'quantity', 'unit', 'requestedBy', 'status', 'date'],
  },
  {
    id: "material-stock",
    title: "Material Stock Report",
    description: "Current inventory levels across different locations.",
    variants: ["Site-wise", "Store-wise", "Organization-wise"],
    headers: ['Material', 'Site', 'Quantity', 'Unit', 'Classification'],
    dataKeys: ['material', 'site', 'quantity', 'unit', 'classification'],
  },
  {
    id: "work-done-report",
    title: "Daily Work Done Register",
    description: "Audit list of all daily work progress reported from project sites.",
    variants: ["Site-wise", "Organization-wise"],
    headers: ['Site', 'Date', 'Work Item', 'Quantity', 'Total Cost ($)'],
    dataKeys: ['siteName', 'reportDate', 'itemOfWork', 'quantityOfWork', 'totalCost'],
  },
  {
    id: "boq-analysis",
    title: "BOQ vs Actual Analysis",
    description: "Comparison of planned BOQ quantities against actual reported work.",
    variants: ["Site-wise", "Organization-wise"],
    headers: ['BOQ Item', 'BOQ Qty', 'Actual Qty', 'Balance Qty', 'BOQ Cost', 'Actual Cost'],
    dataKeys: ['item', 'boqQty', 'actualQty', 'balanceQty', 'boqCost', 'actualCost'],
  },
  {
    id: "boq-management",
    title: "BOQ Management Log",
    description: "Audit trail of BOQ file uploads and master configurations.",
    variants: ["Site-wise", "Organization-wise"],
    headers: ['Filename', 'Site', 'Uploaded By', 'Items', 'Timestamp'],
    dataKeys: ['filename', 'site', 'uploadedBy', 'itemsCount', 'timestamp'],
  },
  {
    id: "ai-review",
    title: "AI Bill Review History",
    description: "Log of automated bill checks and discrepancy findings.",
    variants: ["Organization-wise"],
    headers: ['Audit Date', 'Bill Reference', 'Accuracy', 'Summary'],
    dataKeys: ['date', 'billRef', 'isAccurate', 'summary'],
  },
  {
    id: "returnable-material",
    title: "Returnable Material Report",
    description: "Audit list of issued materials (assets) that must be returned to site stock.",
    variants: ["Site-wise", "Organization-wise"],
    headers: ['Slip #', 'Material', 'Qty', 'Requester', 'Issue Date', 'Status'],
    dataKeys: ['slipNumber', 'materialName', 'quantity', 'requestedBy', 'date', 'status'],
  },
  {
    id: "material-shifting",
    title: "Goods Received Note (GRN) Ledger",
    description: "Tracks material receipt, E-Way bills, and transport verification details.",
    variants: ["Site-wise", "Organization-wise"],
    headers: ['GRN ID', 'Material', 'Qty Received', 'Issuing Site', 'E-Way Bill', 'Status'],
    dataKeys: ['receivedBillId', 'materialName', 'receivedQuantity', 'issuingSite', 'eWayBillNumber', 'status'],
  },
  {
    id: "indent-register",
    title: "Material Indent Register",
    description: "A complete log of all material indents and procurement requests.",
    variants: ["Site-wise", "Organization-wise"],
    headers: ['Indent ID', 'Materials', 'Qty', 'Site', 'Status', 'Request Date'],
    dataKeys: ['id', 'materialsDisplay', 'totalQty', 'requestingSite', 'status', 'requestDate'],
  },
];

export default function ReportsPage() {
  const { requests, inventory, receipts, issueSlips, workDoneReports, inventoryUploads } = useMaterialContext();
  const searchParams = useSearchParams();
  
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [reportTitle, setReportTitle] = React.useState('');
  const [reportData, setReportData] = React.useState<any[]>([]);
  const [reportHeaders, setReportHeaders] = React.useState<string[]>([]);
  const [reportKeys, setReportKeys] = React.useState<string[]>([]);
  
  const [startDate, setStartDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = React.useState<Date | undefined>(new Date());
  const [selectedReportId, setSelectedReportId] = React.useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = React.useState<string | null>(null);

  const sitesList = React.useMemo(() => Array.from(new Set(inventory.map(i => i.site))), [inventory]);

  React.useEffect(() => {
    const moduleId = searchParams.get('module');
    const site = searchParams.get('site');
    if (moduleId) {
        handleGenerateReport(moduleId, site || 'Organization-wise');
    }
  }, [searchParams]);

  const handleGenerateReport = (reportId: string, filter?: string) => {
    const reportInfo = reportTypes.find(r => r.id === reportId);
    if (!reportInfo) return;

    setSelectedReportId(reportId);
    setSelectedFilter(filter || 'Organization-wise');
    setReportTitle(filter ? `${reportInfo.title} (${filter})` : reportInfo.title);
    setReportHeaders(reportInfo.headers);
    setReportKeys(reportInfo.dataKeys);
    
    refreshData(reportId, filter || 'Organization-wise');
    setDialogOpen(true);
  };

  const refreshData = (reportId: string, filter: string) => {
    let data: any[] = [];
    const dateRange = (dateStr: string) => {
        if (!startDate || !endDate) return true;
        const d = new Date(dateStr);
        return isWithinInterval(d, { start: startOfDay(startDate), end: endOfDay(endDate) });
    };

    switch (reportId) {
      case 'mis-register':
        data = issueSlips.filter(s => {
            const siteMatch = filter === 'Organization-wise' || s.siteName === filter;
            return siteMatch && dateRange(s.date);
        });
        break;
      
      case 'material-stock':
         data = filter === 'Organization-wise'
            ? inventory
            : inventory.filter(i => i.site === filter || (filter === "Store-wise" && i.site === "MAPI Godown"));
         break;

      case 'work-done-report':
        data = workDoneReports.filter(r => {
            const siteMatch = filter === 'Organization-wise' || r.siteName === filter;
            return siteMatch && dateRange(r.reportDate);
        });
        break;

      case 'boq-analysis':
        data = detailedBoqAnalysis.filter(b => filter === 'Organization-wise' || b.site === filter).map(b => {
            const actuals = workDoneReports.filter(w => w.siteName === b.site && w.itemOfWork === b.item);
            const totalActualQty = actuals.reduce((acc, curr) => acc + curr.quantityOfWork, 0);
            const totalActualCost = actuals.reduce((acc, curr) => acc + curr.totalCost, 0);
            const boqCost = b.boqQty * b.boqRate;
            return {
                ...b,
                actualQty: totalActualQty,
                actualCost: totalActualCost,
                balanceQty: b.boqQty - totalActualQty,
                pendingCost: boqCost - totalActualCost
            };
        });
        break;

      case 'boq-management':
        data = inventoryUploads.filter(u => {
            const siteMatch = filter === 'Organization-wise' || u.site === filter;
            return siteMatch && dateRange(u.timestamp);
        });
        break;

      case 'ai-review':
        data = [
            { date: new Date().toISOString(), billRef: 'INV-2024-001', isAccurate: 'Yes', summary: 'Matched perfectly with GRN and PO.' },
            { date: new Date(Date.now() - 86400000).toISOString(), billRef: 'INV-2024-002', isAccurate: 'No', summary: 'Qty mismatch found in Cement bags.' },
        ].filter(r => dateRange(r.date));
        break;
      
      case 'returnable-material':
        data = issueSlips.filter(slip => {
            const siteMatch = filter === 'Organization-wise' || slip.siteName === filter;
            return siteMatch && slip.isReturnable && dateRange(slip.date);
        });
        break;

      case 'material-shifting':
        data = receipts.filter(r => {
            const siteMatch = filter === 'Organization-wise' || r.receivingSite === filter;
            return siteMatch && dateRange(r.receivedDate);
        });
        break;

      case 'indent-register':
        data = requests.filter(r => {
            const siteMatch = filter === 'Organization-wise' || r.requestingSite === filter;
            return siteMatch && dateRange(r.requestDate);
        }).map(r => ({
            ...r,
            materialsDisplay: r.materials.map(m => m.materialName).join(', '),
            totalQty: r.materials.reduce((acc, m) => acc + m.quantity, 0)
        }));
        break;
    }

    setReportData(data);
  };

  React.useEffect(() => {
    if (selectedReportId && selectedFilter) {
        refreshData(selectedReportId, selectedFilter);
    }
  }, [startDate, endDate]);
  
  const handleDownload = () => {
    console.log("Downloading report:", reportTitle, reportData);
    setDialogOpen(false);
  }

  const renderCellData = (row: any, key: string) => {
    const cellData = row[key];
    if (key === 'date' || key === 'receivedDate' || key === 'requestDate' || key === 'reportDate' || key === 'timestamp') return format(new Date(cellData), 'dd MMM yyyy');
    if (key === 'status') return <Badge variant="outline" className="text-[9px] h-4 uppercase">{cellData}</Badge>;
    if (key === 'isAccurate') return <Badge variant={cellData === 'Yes' ? 'default' : 'destructive'} className="text-[9px] uppercase px-2">{cellData}</Badge>;
    if (key === 'eWayBillNumber') return cellData || <span className="text-[10px] opacity-40">N/A</span>;
    if (key === 'totalCost' || key === 'boqCost' || key === 'actualCost') return `$${Number(cellData).toLocaleString()}`;
    return cellData;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-headline">Audit Reports</h1>
            <Button variant="ghost" size="sm" className="font-bold uppercase tracking-widest text-[10px]" onClick={() => window.history.back()}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Return to Dashboard
            </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-primary/20 shadow-md">
                <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="flex items-center gap-2"><ClipboardList className="text-primary" /> Site & Field Logs</CardTitle>
                    <CardDescription>Site Issue Slips and Progress reports.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    {reportTypes.filter(r => ['mis-register', 'work-done-report', 'returnable-material'].includes(r.id)).map(report => (
                        <div key={report.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div>
                                <p className="font-bold text-sm">{report.title}</p>
                                <p className="text-[10px] text-muted-foreground">{report.description}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleGenerateReport(report.id)}>View</Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-amber-500/20 shadow-md">
                <CardHeader className="bg-amber-500/5 border-b">
                    <CardTitle className="flex items-center gap-2"><PackageCheck className="text-amber-600" /> Logistics & Stock</CardTitle>
                    <CardDescription>Inventory balance and GRN monitoring.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    {reportTypes.filter(r => ['material-stock', 'material-shifting', 'indent-register'].includes(r.id)).map(report => (
                        <div key={report.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div>
                                <p className="font-bold text-sm">{report.title}</p>
                                <p className="text-[10px] text-muted-foreground">{report.description}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleGenerateReport(report.id)}>View</Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-indigo-500/20 shadow-md">
                <CardHeader className="bg-indigo-500/5 border-b">
                    <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="text-indigo-600" /> Audit & Analysis</CardTitle>
                    <CardDescription>BOQ comparisons and AI discrepancies.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    {reportTypes.filter(r => ['boq-analysis', 'boq-management', 'ai-review'].includes(r.id)).map(report => (
                        <div key={report.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div>
                                <p className="font-bold text-sm">{report.title}</p>
                                <p className="text-[10px] text-muted-foreground">{report.description}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleGenerateReport(report.id)}>View</Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 border-b shrink-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                        <FileSpreadsheet className="text-primary" /> {reportTitle}
                    </DialogTitle>
                    <DialogDescription>Verified record data for the selected audit scope.</DialogDescription>
                </div>
                <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-xl border">
                    <div className="flex flex-col">
                        <Label className="text-[8px] uppercase font-black px-1 opacity-50">Date Range Filter</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold">
                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                        {startDate ? format(startDate, 'dd MMM') : 'Start'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <span className="text-muted-foreground">→</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold">
                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                        {endDate ? format(endDate, 'dd MMM') : 'End'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto border-b">
            {reportData.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    {reportHeaders.map(header => <TableHead key={header} className="text-[10px] uppercase font-black tracking-widest h-10">{header}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row, i) => (
                    <TableRow key={i} className="hover:bg-primary/5 transition-colors h-12">
                      {reportKeys.map((key) => <TableCell key={key} className="text-xs">{renderCellData(row, key)}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-24 text-center space-y-2">
                  <PackageCheck className="h-12 w-12 mx-auto opacity-10" />
                  <p className="text-muted-foreground text-sm italic">No records found matching the current filters.</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="bg-muted/30 p-4 shrink-0 flex justify-between items-center sm:justify-between">
             <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                Showing {reportData.length} entries
             </div>
             <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Close Review</Button>
                <Button onClick={handleDownload} className="font-bold"><Download className="mr-2 h-4 w-4" /> Export XLSX</Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
