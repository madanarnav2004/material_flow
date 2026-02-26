'use client';

import { Building, FileText, Eye, Download, FileSpreadsheet, AlertTriangle, ChevronDown, Package, PackageSearch, Settings, Send, FilePlus } from 'lucide-react';
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
import { Input } from '../ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

const poDetailsSchema = z.object({
  vendorName: z.string().min(2, 'Vendor name is required.'),
  vendorContact: z.string().optional(),
  billNumber: z.string().optional(),
});
type PoDetailsFormValues = z.infer<typeof poDetailsSchema>;

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
  const indentsForProcessing = requests.filter(r => r.status === 'Director Approved');

  const poForm = useForm<PoDetailsFormValues>({
    resolver: zodResolver(poDetailsSchema),
    defaultValues: { vendorName: '', vendorContact: '', billNumber: '' },
  });


  const handleStatusChange = (reqId: string, newStatus: IndentStatus) => {
    setRequests(prev => prev.map(req => (req.id === reqId ? { ...req, status: newStatus } : req)));
    toast({
      title: `Audit Trail Updated`,
      description: `Indent ${reqId} marked as ${newStatus}.`,
    });
  };

  const handleProcessClick = (indent: MaterialIndent) => {
    setSelectedIndent(indent);
    setIssuingSite('');
    poForm.reset();
  };

  const handleFinalApproval = (decision: 'Issued' | 'Purchase Rejected') => {
    if (!selectedIndent) return;

    if (decision === 'Issued' && !issuingSite) {
        toast({ variant: 'destructive', title: 'Action Required', description: 'Assign an issuing site before proceeding.' });
        return;
    }

    setRequests(prevRequests =>
        prevRequests.map(req =>
            req.id === selectedIndent.id ? { ...req, status: decision, issuingSite: decision === 'Issued' ? issuingSite : undefined } : req
        )
    );

    toast({
        title: decision === 'Issued' ? 'Site Assigned' : 'Indent Rejected',
        description: `Material logistics sequence started for ${selectedIndent.id}.`,
    });
    setSelectedIndent(null);
  };
  
  const onGeneratePo = (values: PoDetailsFormValues) => {
    if (!selectedIndent) return;
    setRequests(prevRequests =>
        prevRequests.map(req =>
            req.id === selectedIndent!.id ? { 
                ...req, 
                status: 'PO Generated', 
                poDate: new Date().toISOString(),
                vendorName: values.vendorName,
                vendorContact: values.vendorContact,
                billNumber: values.billNumber
            } : req
        )
    );
     toast({
      title: 'PO Generated Successfully',
      description: `Purchase sequence for ${selectedIndent.id} initiated.`,
    });
    setSelectedIndent(null);
  };

  const materialAvailability = selectedIndent
    ? inventory.filter(s => selectedIndent.materials.some(m => m.materialName.toLowerCase() === s.material.toLowerCase()))
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
      const bill: MaterialIndentBill = {
        ...request,
        requestId: request.id,
        requestDate: new Date(request.requestDate),
        requiredPeriod: { 
          from: new Date(request.requiredPeriod.from), 
          to: new Date(request.requiredPeriod.to),
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
      title: "Audit Report Initiated",
      description: `Generating ${reportName} for ${site}.`,
    });
  };


  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Coordinator Console</h1>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="BOQ Analysis"
            value="Active Audit"
            icon={FileSpreadsheet}
            description="Planned vs Actual Reconciliation"
            className="border-primary/50"
            onClick={() => router.push('/dashboard/boq-analysis')}
          />
          <StatCard
              title="Indents to Process"
              value={indentsForProcessing.length.toString()}
              icon={Settings}
              description="Awaiting Logistics/PO"
            />
          <Dialog>
            <DialogTrigger asChild>
               <div className="cursor-pointer">
                <StatCard
                  title="Awaiting Approval"
                  value={indentsForApproval.length.toString()}
                  icon={Package}
                  description="Pending Director Action"
                  className="border-yellow-500/50"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Audit Queue: Indents Awaiting Approval</DialogTitle>
                <DialogDescription>Review source indents before official approval status is granted.</DialogDescription>
              </DialogHeader>
               <div className="max-h-[60vh] overflow-y-auto">
                  {indentsForApproval.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Indent ID</TableHead>
                                <TableHead>Material Items</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Requesting Site</TableHead>
                                <TableHead className="text-right">Verification</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {indentsForApproval.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-bold text-xs">{item.id}</TableCell>
                                <TableCell className="text-xs">{item.materials.map(m => m.materialName).join(', ')}</TableCell>
                                <TableCell className="text-xs">{item.materials.reduce((acc, m) => acc + m.quantity, 0)}</TableCell>
                                <TableCell className="text-xs">{item.requestingSite}</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        Action <ChevronDown className="ml-2 h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewBill(item.id)}>
                                        <Eye className="mr-2 h-4 w-4" /> View Indent Bill
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'Director Approved')}>
                                        Force Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'Director Rejected')} className="text-destructive">
                                        Reject Indent
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground p-12 italic">The approval queue is currently empty.</p>
                  )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer">
                <StatCard
                  title="Low Stock Warning"
                  value={`${lowStockCount} items`}
                  icon={AlertTriangle}
                  description="Re-order sequence required"
                  className="text-destructive border-destructive/50"
                />
              </div>
            </DialogTrigger>
             <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Critical Inventory Alerts</DialogTitle>
                <div className="flex justify-between items-center pt-2">
                  <DialogDescription>
                    Materials below master safety thresholds.
                  </DialogDescription>
                  <Select value={lowStockSite} onValueChange={setLowStockSite}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Site Filter" />
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
                          <TableHead className="text-right">Available</TableHead>
                          <TableHead className="text-right">Threshold</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {filteredLowStockMaterials.map((item: InventoryItem) => (
                          <TableRow key={item.id} className="text-destructive">
                              <TableCell className="font-bold text-xs">{item.material}</TableCell>
                              <TableCell className="text-xs">{item.site}</TableCell>
                              <TableCell className="text-right font-black text-xs">{`${item.quantity} ${item.unit}`}</TableCell>
                              <TableCell className="text-right text-xs">{`${item.minQty} ${item.unit}`}</TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground p-12 italic">Inventory levels are healthy for the selected scope.</p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => handleDownloadExcel('Low Stock Audit', lowStockSite)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Audit List
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

           <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer">
                  <StatCard
                    title="Live Stock"
                    value={`${inventory.length} types`}
                    icon={PackageSearch}
                    description="Verified Org Inventory"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Organization-wide Stock Audit</DialogTitle>
                  <div className="flex justify-between items-center pt-2">
                    <DialogDescription>
                      Live verified quantity across all managed locations.
                    </DialogDescription>
                     <Select value={stockOverviewSite} onValueChange={setStockOverviewSite}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Scope Location" />
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
                            <TableHead>Material Identifier</TableHead>
                            <TableHead className="text-right">Audited Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stockToDisplay.length > 0 ? stockToDisplay.map(item => (
                            <TableRow key={item.name}>
                                <TableCell className="font-medium text-xs">{item.name}</TableCell>
                                <TableCell className="text-right font-bold text-xs">{item.quantity.toLocaleString()} {item.unit}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground p-12 italic">No stock found for this location.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                 <DialogFooter>
                    <Button onClick={() => handleDownloadExcel('Inventory Snapshot', stockOverviewSite)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Excel Snapshot
                    </Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Logistics Processing</CardTitle>
                    <CardDescription>Assign issuing site for Director-approved requests.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {indentsForProcessing.length > 0 ? (
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Indent ID</TableHead>
                                  <TableHead>Source</TableHead>
                                  <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                          {indentsForProcessing.map(item => (
                              <TableRow key={item.id}>
                                  <TableCell className="font-bold text-xs">{item.id}</TableCell>
                                  <TableCell className="text-xs">{item.requestingSite}</TableCell>
                                  <TableCell className="text-right">
                                    <Button size="sm" className="h-8" onClick={() => handleProcessClick(item)}>
                                      <Settings className="mr-2 h-3 w-3" />
                                      Process
                                    </Button>
                                  </TableCell>
                              </TableRow>
                          ))}
                          </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground p-8 italic text-xs">No approved indents awaiting site assignment.</p>
                    )}
                  </CardContent>
                </Card>
            </div>
            {lastGeneratedBill && (
              <div className="lg:col-span-1">
                <Card className="border-primary/20">
                  <CardHeader className="bg-primary/5 rounded-t-lg">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-primary" /> Material Indent Audit
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Reference Indent ID: {lastGeneratedBill.requestId}
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2 rounded-lg border p-4 bg-muted/30">
                      <h3 className="font-bold text-[10px] uppercase text-muted-foreground">Indent Meta</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <p><strong>Date:</strong> {format(lastGeneratedBill.requestDate, 'PPP')}</p>
                        <p><strong>Site:</strong> {lastGeneratedBill.requestingSite}</p>
                        <p><strong>Requester:</strong> {lastGeneratedBill.requester?.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-[10px] uppercase text-muted-foreground">Line Items</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="h-8 text-[10px]">Material</TableHead>
                            <TableHead className="h-8 text-[10px]">Qty</TableHead>
                            <TableHead className="h-8 text-[10px] text-right">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lastGeneratedBill.materials.map((m, i) => (
                            <TableRow key={i} className="h-8">
                              <TableCell className="py-1 text-xs">{m.materialName}</TableCell>
                              <TableCell className="py-1 text-xs font-bold">{m.quantity}</TableCell>
                              <TableCell className="py-1 text-right text-xs font-bold">${(m.quantity * (m.rate || 0)).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Separator />
                      <div className="flex justify-between items-center px-2">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Verified Value</span>
                          <span className="font-black text-primary text-xl font-headline">${lastGeneratedBill.totalValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
        </div>
      </div>
      <Dialog open={!!selectedIndent} onOpenChange={(isOpen) => !isOpen && setSelectedIndent(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Material Logistics Sequence: {selectedIndent?.id}</DialogTitle>
            <DialogDescription>
              Map logistics route for <span className="font-bold text-primary">{selectedIndent?.materials.reduce((acc, m) => acc + m.quantity, 0)} units</span> of <span className="font-bold text-primary">{selectedIndent?.materials.map(m=>m.materialName).join(', ')}</span>.
            </DialogDescription>
          </DialogHeader>

          {materialAvailability.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase text-muted-foreground">Verified Material Availability</h3>
                    <div className="border rounded-lg overflow-hidden shadow-inner">
                        <Table>
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead className="text-[10px]">Managed Location</TableHead>
                                    <TableHead className="text-[10px] text-right">Available</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materialAvailability.map(stock => (
                                    <TableRow key={stock.id} className="h-10">
                                        <TableCell className="text-xs font-medium">{stock.site}</TableCell>
                                        <TableCell className="text-right text-xs font-black">{stock.quantity} {stock.unit}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase text-muted-foreground">Logistics Mapping & Action</h3>
                    <div className="p-6 border-2 border-primary/10 rounded-xl space-y-6 bg-primary/5 shadow-sm">
                        <div className="space-y-2">
                            <Label htmlFor="issuing-site-select" className="text-xs font-bold uppercase text-primary">Sequence A: Internal Stock Issue</Label>
                            <Select onValueChange={setIssuingSite} value={issuingSite}>
                                <SelectTrigger id="issuing-site-select" className="bg-background">
                                    <SelectValue placeholder="Select Source Site" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSites.map(site => (
                                        <SelectItem key={site} value={site}>{site}</SelectItem>
                                    ))}
                                    <SelectItem value="Other Site">Other Authorized Site</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button onClick={() => handleFinalApproval('Issued')} disabled={!issuingSite} className="w-full mt-2">
                                <Send className="mr-2 h-4 w-4" /> Trigger Shifting Sequence
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-dashed" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-primary/5 px-2 text-muted-foreground font-black tracking-tighter">
                                    Audit Alternate
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-primary">Sequence B: External Vendor Purchase</Label>
                            <Form {...poForm}>
                              <form onSubmit={poForm.handleSubmit(onGeneratePo)} className="space-y-3">
                                <FormField control={poForm.control} name="vendorName" render={({ field }) => (
                                  <FormItem><FormControl><Input placeholder="Verified Vendor Name" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <Button type="submit" variant="secondary" className="w-full"> <FilePlus className="mr-2 h-4 w-4" /> Initiate External PO Flow</Button>
                              </form>
                            </Form>
                        </div>

                        <Separator className="bg-primary/10" />

                        <Button onClick={() => handleFinalApproval('Purchase Rejected')} variant="destructive" className="w-full h-8 text-[10px] uppercase">
                             Reject Entire Sequence
                        </Button>
                    </div>
                </div>
            </div>
          ) : (
             <div className="py-12">
                <div className="text-center p-12 border-2 border-dashed rounded-2xl bg-secondary/30">
                    <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4 opacity-50" />
                    <h3 className="font-black text-xl font-headline">Zero Internal Stock</h3>
                    <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
                        This material is not available at any managed location. An external Purchase Order is mandatory to fulfill this indent.
                    </p>
                    <Form {...poForm}>
                      <form onSubmit={poForm.handleSubmit(onGeneratePo)} className="space-y-4 max-w-md mx-auto text-left bg-background p-6 rounded-xl border shadow-sm">
                          <FormField control={poForm.control} name="vendorName" render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-bold uppercase">Vendor Entity</FormLabel><FormControl><Input placeholder="e.g., Acme Steel" {...field} /></FormControl><FormMessage /></FormItem>
                          )}/>
                           <FormField control={poForm.control} name="vendorContact" render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-bold uppercase">Vendor POC (Optional)</FormLabel><FormControl><Input placeholder="Contact Name / Phone" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                          )}/>
                          <FormField control={poForm.control} name="billNumber" render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-bold uppercase">Mapping Ref # (Optional)</FormLabel><FormControl><Input placeholder="Internal Ref or Vendor Quote" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                          )}/>
                          <Button type="submit" size="lg" className="w-full mt-4 font-bold uppercase tracking-widest">
                              <FilePlus className="mr-2 h-5 w-5" />
                              Generate & Map PO
                          </Button>
                      </form>
                    </Form>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}