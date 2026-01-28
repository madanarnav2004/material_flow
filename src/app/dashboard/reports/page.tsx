
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const reportTypes = [
  {
    title: "Material Shifting Report",
    description: "Tracks material movement between sites and overall organizational shifts.",
    variants: ["Site-wise", "Organization-wise"],
  },
  {
    title: "Returnable Material Report",
    description: "Details on materials that are returnable to the godown or another site.",
    variants: ["Site-wise", "Organization-wise", "Godown-wise"],
  },
  {
    title: "Material Stock Report",
    description: "Current inventory levels across different locations.",
    variants: ["Site-wise", "Store-wise", "Organization-wise"],
  },
  {
    title: "BOQ Item-wise Material Issued",
    description: "Details on materials issued against Bill of Quantities items, including cost.",
    variants: [],
    hasSiteDropdown: true,
  },
  {
    title: "Site-wise BOQ Report",
    description: "Consumption and budget tracking per site based on BOQ (includes quantity, rate, amount).",
    variants: [],
    hasSiteDropdown: true,
  },
  {
    title: "Goods Received Note (GRN) Report",
    description: "Confirmation of materials received at various locations.",
    variants: ["Site-wise", "Organization-wise"],
  },
  {
    title: "Material Indent Register",
    description: "A complete log of all material indents.",
    variants: ["Site-wise", "Organization-wise"],
  },
  {
    title: "Indent vs. GRN Comparison",
    description: "Analysis of discrepancies between requested and received quantities.",
    variants: [],
  },
];

export default function ReportsPage() {
  const { requests, inventory, receipts } = useMaterialContext();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [reportTitle, setReportTitle] = React.useState('');
  const [reportData, setReportData] = React.useState<any[]>([]);
  const [reportHeaders, setReportHeaders] = React.useState<string[]>([]);
  
  const sitesList = React.useMemo(() => ["MAPI Godown", ...Array.from(new Set(inventory.map(i => i.site)))], [inventory]);

  const handleGenerateReport = (reportTitle: string, filter?: string) => {
    setReportTitle(filter ? `${reportTitle} (${filter})` : reportTitle);
    let data: any[] = [];
    let headers: string[] = [];

    switch (reportTitle) {
      case 'Material Indent Register':
        headers = ['Indent ID', 'Material', 'Qty', 'Site', 'Status', 'Return Date'];
        data = filter === 'Organization-wise' 
          ? requests 
          : requests.filter(r => r.site === filter);
        break;
      
      case 'Material Stock Report':
         headers = ['Material', 'Site', 'Quantity', 'Unit'];
         data = filter === 'Organization-wise'
            ? inventory
            : inventory.filter(i => i.site === filter);
         break;

      case 'Goods Received Note (GRN) Report':
        headers = ['GRN ID', 'Indent ID', 'Material', 'Received Qty', 'Receiving Site', 'Status'];
        data = filter === 'Organization-wise'
            ? receipts
            : receipts.filter(r => r.receivingSite === filter);
        break;
      
      default:
        setReportData([]);
        setReportHeaders([]);
        setDialogOpen(false);
        return;
    }

    setReportData(data);
    setReportHeaders(headers);
    setDialogOpen(true);
  };
  

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
              <Card key={report.title} className="shadow-none">
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
                              {sitesList.map((site) => (
                                <DropdownMenuItem key={site} onClick={() => handleGenerateReport(report.title, site)}>
                                  {site}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      }
                      return (
                        <Button key={variant} variant="outline" onClick={() => handleGenerateReport(report.title, variant)}>
                          <Download className="mr-2 h-4 w-4" />
                          Preview {variant}
                        </Button>
                      );
                    })
                  ) : (
                    <Button onClick={() => handleGenerateReport(report.title, 'All')}>
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
                      {Object.values(row).map((cell: any, cellIndex: number) => (
                          <TableCell key={cellIndex}>{typeof cell === 'object' ? JSON.stringify(cell) : cell}</TableCell>
                      )).slice(0, reportHeaders.length)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground p-8">No data available for this report.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
