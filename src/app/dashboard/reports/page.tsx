'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, ChevronDown, PackageCheck, AlertCircle } from "lucide-react";
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

const reportTypes = [
  {
    id: "material-shifting",
    title: "Material Shifting Report",
    description: "Tracks material movement between sites and overall organizational shifts.",
    variants: ["Site-wise", "Organization-wise"],
    headers: ['GRN ID', 'Material', 'Received Qty', 'Issuing Site', 'Receiving Site', 'Status'],
    dataKeys: ['receivedBillId', 'materialName', 'receivedQuantity', 'issuingSite', 'receivingSite', 'status'],
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
    id: "grn-report",
    title: "Goods Received Note (GRN) Report",
    description: "Confirmation of materials received at various locations.",
    variants: ["Site-wise", "Organization-wise"],
    headers: ['GRN ID', 'Indent ID', 'Material', 'Received Qty', 'Receiving Site', 'Status'],
    dataKeys: ['receivedBillId', 'requestId', 'materialName', 'receivedQuantity', 'receivingSite', 'status'],
  },
  {
    id: "returnable-material",
    title: "Returnable Material Report",
    description: "Audit list of issued materials (assets) that must be returned to site stock.",
    variants: ["Site-wise", "Organization-wise"],
    headers: ['Voucher ID', 'Material', 'Qty', 'Issued To', 'Location', 'Date'],
    dataKeys: ['voucherId', 'materials', 'materials', 'issuedTo', 'buildingName', 'issueDate'],
  },
  {
    id: "indent-register",
    title: "Material Indent Register",
    description: "A complete log of all material indents.",
    variants: ["Site-wise", "Organization-wise"],
    headers: ['Indent ID', 'Material', 'Qty', 'Site', 'Status', 'Return Date'],
    dataKeys: ['id', 'material', 'quantity', 'site', 'status', 'returnDate'],
  },
  {
    id: 'daily-issue-report',
    title: 'Daily Material Issue Report',
    description: 'Materials issued from a site on a specific day.',
    variants: ['Site-wise'],
    headers: ['Voucher ID', 'Issued To', 'Building', 'Materials', 'Date'],
    dataKeys: ['voucherId', 'issuedTo', 'buildingName', 'materials', 'issueDate'],
  },
  {
    id: 'site-issue-report',
    title: 'Site-wise Issue Report',
    description: 'All materials issued from a specific site.',
    variants: ['Site-wise'],
    headers: ['Voucher ID', 'Issued To', 'Building', 'Materials', 'Date'],
    dataKeys: ['voucherId', 'issuedTo', 'buildingName', 'materials', 'issueDate'],
  }
];

export default function ReportsPage() {
  const { requests, inventory, receipts, siteIssues } = useMaterialContext();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [reportTitle, setReportTitle] = React.useState('');
  const [reportData, setReportData] = React.useState<any[]>([]);
  const [reportHeaders, setReportHeaders] = React.useState<string[]>([]);
  const [reportKeys, setReportKeys] = React.useState<string[]>([]);
  
  const sitesList = React.useMemo(() => ["MAPI Godown", ...Array.from(new Set(inventory.map(i => i.site)))].filter(s => s !== "MAPI Godown"), [inventory]);

  const handleGenerateReport = (reportId: string, filter?: string) => {
    const reportInfo = reportTypes.find(r => r.id === reportId);
    if (!reportInfo) return;

    setReportTitle(filter ? `${reportInfo.title} (${filter})` : reportInfo.title);
    setReportHeaders(reportInfo.headers);
    setReportKeys(reportInfo.dataKeys);
    let data: any[] = [];
    const today = new Date();

    switch (reportInfo.id) {
      case 'indent-register':
        data = filter === 'Organization-wise' || filter === 'All'
          ? requests 
          : requests.filter(r => r.site === filter);
        break;
      
      case 'material-stock':
         data = filter === 'Organization-wise' || filter === 'All'
            ? inventory
            : inventory.filter(i => i.site === filter || (filter === "Store-wise" && i.site === "MAPI Godown"));
         break;
      
      case 'material-shifting':
      case 'grn-report':
        data = filter === 'Organization-wise' || filter === 'All'
            ? receipts
            : receipts.filter(r => r.receivingSite === filter);
        break;
      
      case 'returnable-material':
        data = siteIssues.filter(issue => {
            const siteMatch = filter === 'Organization-wise' || issue.siteName === filter;
            const hasReturnable = issue.materials.some(m => m.returnable);
            return siteMatch && hasReturnable;
        });
        break;

      case 'daily-issue-report':
        data = siteIssues.filter(issue => {
            const issueDate = new Date(issue.issueDate);
            return issue.siteName === filter && isWithinInterval(issueDate, { start: startOfDay(today), end: endOfDay(today) });
        });
        break;

      case 'site-issue-report':
        data = siteIssues.filter(issue => issue.siteName === filter);
        break;
      
      default:
        setReportData([]);
        setReportHeaders([]);
        setDialogOpen(false);
        return;
    }

    setReportData(data);
    setDialogOpen(true);
  };
  
  const handleDownload = () => {
    console.log("Downloading report:", reportTitle, reportData);
    setDialogOpen(false);
  }

  const renderCellData = (row: any, key: string, index: number) => {
    const cellData = row[key];

    if (key === 'materials' && Array.isArray(cellData)) {
      // Logic for Returnable Material Report headers mapping
      if (reportTitle.includes('Returnable Material')) {
          if (index === 1) return cellData.filter(m => m.returnable).map(m => m.materialName).join(', ');
          if (index === 2) return cellData.filter(m => m.returnable).map(m => `${m.quantity} ${m.unit}`).join(', ');
      }
      return (
        <ul className="list-disc pl-4">
          {cellData.map((mat, i) => <li key={i}>{mat.quantity} {mat.unit} of {mat.materialName}</li>)}
        </ul>
      );
    }
    if (key === 'issueDate' || key === 'returnDate') {
        return format(new Date(cellData), 'PPP');
    }
    if (typeof cellData === 'boolean') {
      return cellData ? 'Yes' : 'No';
    }
    return cellData;
  }

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Swanag Audit Reports</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/20 shadow-md">
                <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <PackageCheck className="text-primary" /> Material & Inventory
                    </CardTitle>
                    <CardDescription>Track organizational stock and verified receipts.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    {reportTypes.slice(0, 3).map(report => (
                        <div key={report.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div>
                                <p className="font-bold text-sm">{report.title}</p>
                                <p className="text-xs text-muted-foreground">{report.description}</p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1"/> Download</Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {report.variants.map(v => (
                                        <DropdownMenuItem key={v} onClick={() => handleGenerateReport(report.id, v)}>{v}</DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-amber-500/20 shadow-md">
                <CardHeader className="bg-amber-500/5 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="text-amber-600" /> Asset & Site Issue
                    </CardTitle>
                    <CardDescription>Track issued materials, assets, and local consumption.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    {reportTypes.slice(3).map(report => (
                        <div key={report.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div>
                                <p className="font-bold text-sm">{report.title}</p>
                                <p className="text-xs text-muted-foreground">{report.description}</p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1"/> Download</Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {report.variants.map(v => {
                                        if (v === 'Site-wise') {
                                            return (
                                                <React.Fragment key={v}>
                                                    <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Select Site</DropdownMenuLabel>
                                                    {sitesList.map(site => (
                                                        <DropdownMenuItem key={site} onClick={() => handleGenerateReport(report.id, site)}>{site}</DropdownMenuItem>
                                                    ))}
                                                </React.Fragment>
                                            )
                                        }
                                        return <DropdownMenuItem key={v} onClick={() => handleGenerateReport(report.id, v)}>{v}</DropdownMenuItem>
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                <FileSpreadsheet className="text-primary" /> {reportTitle}
            </DialogTitle>
            <DialogDescription>
              Audit-verified physical record data for the selected report scope.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto border rounded-xl shadow-inner">
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
                      {reportKeys.map((key, kIndex) => (
                        <TableCell key={key} className="text-xs">
                          {renderCellData(row, key, kIndex)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-24 text-center space-y-2">
                  <PackageCheck className="h-12 w-12 mx-auto opacity-10" />
                  <p className="text-muted-foreground text-sm italic">No data records found matching the current report criteria.</p>
              </div>
            )}
          </div>
          <DialogFooter className="bg-muted/30 p-4 border-t rounded-b-lg">
             <Button variant="outline" onClick={() => setDialogOpen(false)}>Close Review</Button>
             <Button onClick={handleDownload} className="font-bold"><Download className="mr-2 h-4 w-4" /> Download Official XLSX</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
