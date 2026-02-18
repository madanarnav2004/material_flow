'use client';

import { Building, FileText, Eye, Download, FileSpreadsheet, AlertTriangle, ChevronDown, Package, PackageSearch } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useMaterialContext, type InventoryItem, type IndentStatus, MaterialIndent, MaterialIndentBill } from '@/context/material-context';
import { boqUsage, engineerUsage, mockBoqData } from '@/lib/mock-data';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '../ui/select';
import { Label } from '../ui/label';


export default function CoordinatorDashboard() {
  const { toast } = useToast();
  const router = useRouter();
  const { requests, setRequests, inventory } = useMaterialContext();
  const [lastGeneratedBill, setLastGeneratedBill] = React.useState<MaterialIndentBill | null>(null);
  const [lowStockSite, setLowStockSite] = React.useState('All');
  const [stockOverviewSite, setStockOverviewSite] = React.useState('Overall');
  const [selectedIndent, setSelectedIndent] = React.useState<MaterialIndent | null>(null);
  const [issuingSite, setIssuingSite] = React.useState<string>('');

  const indentsForApproval = requests.filter(r => r.status === 'Pending Director Approval');

  const handleStatusChange = (reqId: string, newStatus: IndentStatus) => {
    setRequests(requests.map(req => (req.id === reqId ? { ...req, status: newStatus } : req)));
    toast({
      title: `Indent ${newStatus}`,
      description: `Indent ID ${reqId} has been updated. A notification has been sent.`,
    });
  };

  const handleProcessClick = (indent: MaterialIndent) => {
    setSelectedIndent(indent);
    setIssuingSite('');
  };

  const handleFinalApproval = (decision: 'Issued' | 'Purchase Rejected') => {
    if (!selectedIndent) return;

    if (decision === 'Issued' && !issuingSite) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select an issuing site.' });
        return;
    }

    setRequests(prevRequests =>
        prevRequests.map(req =>
            req.id === selectedIndent.id ? { ...req, status: decision, issuingSite: decision === 'Issued' ? issuingSite : undefined } : req
        )
    );

    toast({
        title: `Indent ${decision}`,
        description: `Indent ${selectedIndent.id} has been processed.`,
    });
    setSelectedIndent(null);
  };
  
  const handleGeneratePo = () => {
    if (!selectedIndent) return;
    setRequests(prevRequests =>
        prevRequests.map(req =>
            req.id === selectedIndent!.id ? { 
                ...req, 
                status: 'PO Generated', 
                poDate: new Date().toISOString(),
            } : req
        )
    );
     toast({
      title: 'Purchase Order Generated',
      description: `A new PO for ${selectedIndent.material} has been generated.`,
    });
    setSelectedIndent(null);
  };

  const materialAvailability = selectedIndent
    ? inventory.filter(s => s.material.toLowerCase() === selectedIndent.material.toLowerCase())
    : [];

  const availableSites = [...new Set(materialAvailability.map(s => s.site))];

  const lowStockMaterials = React.useMemo(() => {
    return inventory.filter(item => item.quantity <= item.minQty);
  }, [inventory]);
  const lowStockCount = lowStockMaterials.length;
  
  const sites = React.useMemo(() => {
    return ['All', ...Array.from(new Set(inventory.map(item => item.site)))];
  }, [inventory]);

  const stockLocations = ['Overall', ...new Set(inventory.map(item => item.site))];

  const filteredLowStockMaterials = React.useMemo(() => {
    if (lowStockSite === 'All') return lowStockMaterials;
    return lowStockMaterials.filter(item => item.site === lowStockSite);
  }, [lowStockMaterials, lowStockSite]);

  const { orgStock, siteStock } = React.useMemo(() => {
    const org: { [key: string]: { quantity: number; unit: string } } = {};
    const site: { [key: string]: {name: string, quantity: number, unit: string}[] } = {};
    
    inventory.forEach(item => {
      if (org[item.material]) {
        org[item.material].quantity += item.quantity;
      } else {
        org[item.material] = { quantity: item.quantity, unit: item.unit };
      }
      
      if (!site[item.site]) {
        site[item.site] = [];
      }
      site[item.site].push({ name: item.material, quantity: item.quantity, unit: item.unit });
    });

    const orgStock = Object.entries(org).map(([name, data]) => ({ name, ...data }));
    const siteStock = site;

    return { orgStock, siteStock };
  }, [inventory]);

  const stockToDisplay = React.useMemo(() => {
    if (stockOverviewSite === 'Overall') {
      return orgStock.map(item => ({...item, name: item.name}));
    }
    return siteStock[stockOverviewSite] || [];
  }, [stockOverviewSite, orgStock, siteStock]);


  const handleViewBill = (reqId: string) => {
    const request = requests.find(r => r.id === reqId);
    if (request) {
      const returnDate = request.requiredPeriod ? new Date(request.requiredPeriod.to) : new Date(request.returnDate);
      const fromDate = request.requiredPeriod ? new Date(request.requiredPeriod.from) : new Date(returnDate.getTime() - 10 * 24 * 60 * 60 * 1000);
      const requestDate = request.requestDate ? new Date(request.requestDate) : new Date(returnDate.getTime() - 11 * 24 * 60 * 60 * 1000);
      const idParts = request.id.split('-');
      const datePart = idParts.length > 2 ? idParts[2] : format(requestDate, 'yyyyMMdd');
      const countPart = idParts.length > 3 ? idParts[3] : request.id.slice(-3);
      const siteCode = idParts.length > 1 ? idParts[1] : 'SITE';
      const materialInfo = mockBoqData.materials.find(m => m.type.toLowerCase() === request.material.toLowerCase()) || {rate: 0};


      const bill: MaterialIndentBill = {
        requestId: request.id,
        requestDate: requestDate,
        requesterName: request.requesterName || 'Sample Requester',
        requestingSite: request.site,
        materials: request.materials || [{ materialName: request.material, quantity: request.quantity, rate: materialInfo.rate }],
        requiredPeriod: { from: fromDate, to: returnDate },
        remarks: request.remarks || `This is a sample bill for request ${request.id}`,
        issuedId: `ISS-${siteCode}-${datePart}-${countPart}`,
        shiftingDate: new Date(returnDate.getTime() - 9 * 24 * 60 * 60 * 1000),
        requester: { name: request.requesterName || 'Sample Requester' },
        totalValue: request.materials ? request.materials.reduce((acc, m) => acc + m.quantity * (m.rate || 0), 0) : request.quantity * materialInfo.rate,
        issuingSite: request.issuingSite || 'Pending Assignment',
      };
      setLastGeneratedBill(bill);
    }
  };

  const handleDownloadExcel = (reportName: string, site: string) => {
    toast({
      title: "Download Started",
      description: `Your ${reportName} for ${site} is being generated.`,
    });
  };


  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Coordinator Dashboard</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="BOQ Analysis"
            value="Open Analyzer"
            icon={FileSpreadsheet}
            description="Compare planned vs actuals"
            className="border-primary/50"
            onClick={() => router.push('/dashboard/boq-analysis')}
          />
          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <StatCard
                  title="Sites Overview"
                  value={`${sites.length - 1} Sites`}
                  icon={Building}
                  description="Total active project sites"
                />
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Active Project Sites</DialogTitle>
              </DialogHeader>
              <Table>
                <TableHeader><TableRow><TableHead>Site Name</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sites.filter(s => s !== 'All' && s !== 'MAPI Godown').map(site => (
                    <TableRow key={site}><TableCell>{site}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <DialogFooter>
                 <Button onClick={() => handleDownloadExcel('Site List', 'All Sites')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download List
                  </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
               <div className="cursor-pointer">
                <StatCard
                  title="Pending Indents"
                  value={indentsForApproval.length.toString()}
                  icon={Package}
                  description="Awaiting action"
                  className="border-yellow-500/50"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Indents Awaiting Approval</DialogTitle>
                <DialogDescription>Review and approve or reject material indents from sites.</DialogDescription>
              </DialogHeader>
               <div className="max-h-[60vh] overflow-y-auto">
                  {indentsForApproval.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Indent ID</TableHead>
                                <TableHead>Material</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Site</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {indentsForApproval.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.id}</TableCell>
                                <TableCell>{item.material}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.site}</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        Actions <ChevronDown className="ml-2 h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewBill(item.id)}>
                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'Director Approved')}>
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'Director Rejected')} className="text-destructive">
                                        Reject
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleProcessClick(item)}>
                                        Process
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground p-8">No pending indents.</p>
                  )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <StatCard
                  title="Low Stock Alerts"
                  value={`${lowStockCount} materials`}
                  icon={AlertTriangle}
                  description="Across all sites"
                  className="text-destructive border-destructive/50"
                />
              </div>
            </DialogTrigger>
             <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Low Stock Material Alerts</DialogTitle>
                <div className="flex justify-between items-center pt-2">
                  <DialogDescription>
                    Materials that have fallen below the minimum required quantity.
                  </DialogDescription>
                  <Select value={lowStockSite} onValueChange={setLowStockSite}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by site..." />
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
                      <TableHeader>
                          <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-right">Current Qty</TableHead>
                          <TableHead className="text-right">Min. Threshold</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {filteredLowStockMaterials.map((item: InventoryItem) => (
                          <TableRow key={item.id} className="text-destructive">
                              <TableCell className="font-medium">{item.material}</TableCell>
                              <TableCell>{item.site}</TableCell>
                              <TableCell className="text-right font-bold">{`${item.quantity} ${item.unit}`}</TableCell>
                              <TableCell className="text-right">{`${item.minQty} ${item.unit}`}</TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground p-8">No low stock alerts for this site.</p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => handleDownloadExcel('Low Stock Report', lowStockSite)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

           <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer">
                  <StatCard
                    title="Material Stock"
                    value={`${inventory.length} types`}
                    icon={PackageSearch}
                    description="View across all sites"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Material Stock Overview</DialogTitle>
                  <div className="flex justify-between items-center pt-2">
                    <DialogDescription>
                      Live inventory counts across the organization.
                    </DialogDescription>
                     <Select value={stockOverviewSite} onValueChange={setStockOverviewSite}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Location" />
                        </SelectTrigger>
                        <SelectContent>
                            {stockLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                </DialogHeader>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead className="text-right">Total Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stockToDisplay.length > 0 ? stockToDisplay.map(item => (
                            <TableRow key={item.name}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right">{item.quantity.toLocaleString()} {item.unit}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">No stock data for this location.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                 <DialogFooter>
                    <Button onClick={() => handleDownloadExcel('Stock Overview', stockOverviewSite)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Report
                    </Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>BOQ Item-Wise Material Usage</CardTitle>
                        <CardDescription>Comparison of actual vs. budgeted material consumption.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {boqUsage.length > 0 ? (
                        <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>BOQ Item</TableHead>
                                      <TableHead>Consumed</TableHead>
                                      <TableHead>Budget</TableHead>
                                      <TableHead>Status</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {boqUsage.slice(0, 4).map(item => (
                                      <TableRow key={item.item}>
                                          <TableCell className="font-medium">{item.item}</TableCell>
                                          <TableCell>{item.consumed}</TableCell>
                                          <TableCell>{item.budget}</TableCell>
                                          <TableCell className={item.status === 'Over Budget' ? 'text-destructive' : ''}>{item.status}</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground">No BOQ usage data available.</p>
                      )}
                    </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Indents for Approval</CardTitle>
                    <CardDescription>Material indents awaiting action across all sites.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {indentsForApproval.length > 0 ? (
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Indent ID</TableHead>
                                  <TableHead>Material</TableHead>
                                  <TableHead>Qty</TableHead>
                                  <TableHead>Site</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                          {indentsForApproval.map(item => (
                              <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.id}</TableCell>
                                  <TableCell>{item.material}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{item.site}</TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          Actions <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleViewBill(item.id)}>
                                          <Eye className="mr-2 h-4 w-4" /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'Director Approved')}>
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'Director Rejected')} className="text-destructive">
                                          Reject
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))}
                          </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground p-4">No indents are awaiting approval.</p>
                    )}
                  </CardContent>
                </Card>
            </div>
            {lastGeneratedBill && (
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText /> Material Indent Bill
                      </CardTitle>
                      <CardDescription>
                        This is the generated bill for the selected indent.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 rounded-lg border p-4">
                      <h3 className="font-semibold">Indent Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>Indent ID:</strong> {lastGeneratedBill.requestId}</p>
                        <p><strong>Indent Date:</strong> {format(lastGeneratedBill.requestDate, 'PPP')}</p>
                        <p><strong>Requesting Site:</strong> {lastGeneratedBill.requestingSite}</p>
                        <p><strong>Requester:</strong> {lastGeneratedBill.requester?.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2 rounded-lg border p-4">
                      <h3 className="font-semibold">Issue Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>Issuing Site:</strong> {lastGeneratedBill.issuingSite}</p>
                        <p><strong>Issued ID:</strong> {lastGeneratedBill.issuedId}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">Material Details</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lastGeneratedBill.materials.map((m, i) => (
                            <TableRow key={i}>
                              <TableCell>{m.materialName}</TableCell>
                              <TableCell>{m.quantity}</TableCell>
                              <TableCell>${(m.rate || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-right">${(m.quantity * (m.rate || 0)).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Separator />
                      <div className="flex justify-end font-bold text-lg">
                          Total Value: ${lastGeneratedBill.totalValue.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                  <CardTitle>Material Indent Return Reminders</CardTitle>
                  <CardDescription>All materials due for return or with extended dates.</CardDescription>
              </CardHeader>
              <CardContent>
                  {requests.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Site</TableHead>
                                <TableHead>Return Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.slice(0, 3).map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.material}</TableCell>
                                    <TableCell>{req.site}</TableCell>
                                    <TableCell>{req.returnDate}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={
                                                req.status === 'Director Rejected' || req.status === 'Purchase Rejected' ? 'destructive' :
                                                req.status === 'Completed' ? 'outline' :
                                                'default'
                                            }
                                            className={cn(
                                                req.status === 'Pending Director Approval' && 'bg-yellow-500',
                                                req.status === 'Director Approved' && 'bg-blue-500',
                                                req.status === 'Issued' && 'bg-green-600',
                                                req.status === 'PO Generated' && 'bg-purple-500',
                                                req.status === 'Partially Issued' && 'bg-orange-500',
                                                req.status !== 'Completed' && 'text-white'
                                            )}
                                        >
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground">No return reminders.</p>
                  )}
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>All Material Indent Return Reminders</DialogTitle>
              <DialogDescription>All materials due for return or with extended dates.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {requests.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Issuing Site</TableHead>
                            <TableHead>Requesting Site</TableHead>
                            <TableHead>Return Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.material}</TableCell>
                                <TableCell>{req.issuingSite || 'Pending'}</TableCell>
                                <TableCell>{req.site}</TableCell>
                                <TableCell>{req.returnDate}</TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={
                                            req.status === 'Director Rejected' || req.status === 'Purchase Rejected' ? 'destructive' :
                                            req.status === 'Completed' ? 'outline' :
                                            'default'
                                        }
                                        className={cn(
                                            req.status === 'Pending Director Approval' && 'bg-yellow-500',
                                            req.status === 'Director Approved' && 'bg-blue-500',
                                            req.status === 'Issued' && 'bg-green-600',
                                            req.status === 'PO Generated' && 'bg-purple-500',
                                            req.status === 'Partially Issued' && 'bg-orange-500',
                                            req.status !== 'Completed' && 'text-white'
                                        )}
                                    >
                                        {req.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button variant="outline" size="sm" onClick={() => handleViewBill(req.id)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Bill
                                  </Button>
                              </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground">No return reminders.</p>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => handleDownloadExcel('Return Reminders Report', 'All Sites')}>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle>Engineer-Wise Material Usage</CardTitle>
                    <CardDescription>Material consumption handled by each engineer.</CardDescription>
                </CardHeader>
                <CardContent>
                {engineerUsage.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Engineer Name</TableHead>
                                <TableHead>Materials</TableHead>
                                <TableHead>Site</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {engineerUsage.slice(0, 4).map(eng => (
                                <TableRow key={eng.name}>
                                    <TableCell className="font-medium">{eng.name}</TableCell>
                                    <TableCell>{eng.materials}</TableCell>
                                    <TableCell>{eng.site}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground">No engineer usage data available.</p>
                )}
                </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Engineer-Wise Material Usage</DialogTitle>
              <DialogDescription>Material consumption handled by each engineer.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {engineerUsage.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Engineer Name</TableHead>
                            <TableHead>Materials</TableHead>
                            <TableHead>Site</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {engineerUsage.map(eng => (
                            <TableRow key={eng.name}>
                                <TableCell className="font-medium">{eng.name}</TableCell>
                                <TableCell>{eng.materials}</TableCell>
                                <TableCell>{eng.site}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground">No engineer usage data available.</p>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => handleDownloadExcel('Engineer Usage Report', 'All Sites')}>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Dialog open={!!selectedIndent} onOpenChange={(isOpen) => !isOpen && setSelectedIndent(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Process Indent: {selectedIndent?.id}</DialogTitle>
            <DialogDescription>
              Assign an issuing site or generate a PO for <span className="font-semibold">{selectedIndent?.quantity} units</span> of <span className="font-semibold">{selectedIndent?.material}</span> for <span className="font-semibold">{selectedIndent?.site}</span>.
            </DialogDescription>
          </DialogHeader>

          {materialAvailability.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Material Availability</h3>
                    <Card>
                        <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="text-right">Available Quantity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materialAvailability.map(stock => (
                                    <TableRow key={stock.id}>
                                        <TableCell>{stock.site}</TableCell>
                                        <TableCell className="text-right">{stock.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Assign Site & Action</h3>
                    <div className="p-4 border rounded-lg space-y-4">
                        <div>
                            <Label htmlFor="issuing-site-select" className="text-sm font-normal text-muted-foreground">Option 1: Issue from existing stock</Label>
                            <Select onValueChange={setIssuingSite} value={issuingSite}>
                                <SelectTrigger id="issuing-site-select">
                                    <SelectValue placeholder="Choose a site..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSites.map(site => (
                                        <SelectItem key={site} value={site}>{site}</SelectItem>
                                    ))}
                                    <SelectItem value="Other Site">Other Site</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button onClick={() => handleFinalApproval('Issued')} disabled={!issuingSite} className="w-full mt-2">
                                <Building className="mr-2 h-4 w-4" /> Issue from Selected Site
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or
                                </span>
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-normal text-muted-foreground">Option 2: Purchase new material</Label>
                             <Button variant="secondary" className="w-full" onClick={handleGeneratePo}>
                                Generate New Purchase Order
                            </Button>
                        </div>

                        <Separator />

                        <Button onClick={() => handleFinalApproval('Purchase Rejected')} variant="destructive" className="w-full">
                             Reject Indent
                        </Button>
                    </div>
                </div>
            </div>
          ) : (
             <div className="py-4">
                <div className="text-center p-8 border rounded-lg bg-secondary/50">
                    <h3 className="font-semibold text-lg">No Stock Found</h3>
                    <p className="text-muted-foreground mb-4">
                        This material is not available at any site or the central store. Please generate a new Purchase Order.
                    </p>
                    <Button onClick={handleGeneratePo}>
                        Generate New Purchase Order
                    </Button>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
