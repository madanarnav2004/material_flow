
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, ChevronDown } from "lucide-react";
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
    // In a real app, this would trigger a file download (e.g., CSV generation)
    console.log("Downloading report:", reportTitle, reportData);
    setDialogOpen(false);
  }

  const renderCellData = (row: any, key: string) => {
    const cellData = row[key];

    if (key === 'materials' && Array.isArray(cellData)) {
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
        <h1 className="text-3xl font-bold font-headline">Generate Reports</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Standard Reports</CardTitle>
            <CardDescription>Generate detailed reports for audit and analysis. Click to preview the data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {reportTypes.map((report) => (
              <Card key={report.id} className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                      {report.title}
                  </CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  {report.variants.length > 0 ? (
                    report.variants.map((variant) => {
                      if (variant === 'Site-wise' || variant === 'Store-wise') {
                        return (
                          <DropdownMenu key={variant}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Preview {variant}
                                <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>Select a Location</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {(variant === 'Site-wise' ? sitesList : ['MAPI Godown']).map((site) => (
                                <DropdownMenuItem key={site} onClick={() => handleGenerateReport(report.id, site)}>
                                  {site}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      }
                      return (
                        <Button key={variant} variant="outline" onClick={() => handleGenerateReport(report.id, variant)}>
                          <Download className="mr-2 h-4 w-4" />
                          Preview {variant}
                        </Button>
                      );
                    })
                  ) : (
                    <Button onClick={() => handleGenerateReport(report.id, 'All')}>
                      <Download className="mr-2 h-4 w-4" />
                      Preview Report
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{reportTitle}</DialogTitle>
            <DialogDescription>
              This is a preview of the report data. The actual download would be in Excel format.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {reportData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {reportHeaders.map(header => <TableHead key={header}>{header}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row, index) => (
                    <TableRow key={index}>
                      {reportKeys.map((key) => (
                        <TableCell key={key}>
                          {renderCellData(row, key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground p-8">No data available for this report.</p>
            )}
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
             <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
