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
    setRequests(requests.map(req => (req.id === reqId ? { ...req, status: newStatus } : req)));
    toast({
      title: `Indent ${newStatus}`,
      description: `Indent ID ${reqId} has been updated. A notification has been sent.`,
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
      title: 'Purchase Order Generated',
      description: `A new PO for ${selectedIndent.materials.map(m=>m.materialName).join(', ')} has been generated.`,
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
        requestDate: new Date(request.requestDate),
        requiredPeriod: { 
          from: new Date(request.requiredPeriod.from), 
          to: new Date(request.requiredPeriod.to),
        },
        issuedId: request.issuedId || `ISS-${request.id.substring(4)}`,
        shiftingDate: new Date(), // Placeholder
        requester: { name: request.requesterName },
        totalValue: request.materials.reduce((acc, m) => acc + m.quantity * (m.rate || 0), 0),
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="BOQ Analysis"
            value="Open Analyzer"
            icon={FileSpreadsheet}
            description="Compare planned vs actuals"
            className="border-primary/50"
            onClick={() => router.push('/dashboard/boq-analysis')}
          />
          <StatCard
              title="Indents to Process"
              value={indentsForProcessing.length.toString()}
              icon={Settings}
              description="Director-approved indents"
            />
          <Dialog>
            <DialogTrigger asChild>
               <div className="cursor-pointer">
                <StatCard
                  title="Pending Indents"
                  value={indentsForApproval.length.toString()}
                  icon={Package}
                  description="Awaiting director approval"
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
                                <TableCell>{item.materials.map(m => m.materialName).join(', ')}</TableCell>
                                <TableCell>{item.materials.reduce((acc, m) => acc + m.quantity, 0)}</TableCell>
                                <TableCell>{item.requestingSite}</TableCell>
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
                    <CardTitle>Indents for Processing</CardTitle>
                    <CardDescription>Assign an issuing site for director-approved indents.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {indentsForProcessing.length > 0 ? (
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Indent ID</TableHead>
                                  <TableHead>Material</TableHead>
                                  <TableHead>Requesting Site</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                          {indentsForProcessing.map(item => (
                              <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.id}</TableCell>
                                  <TableCell>{item.materials.map(m => m.materialName).join(', ')}</TableCell>
                                  <TableCell>{item.requestingSite}</TableCell>
                                  <TableCell className="text-right">
                                    <Button size="sm" onClick={() => handleProcessClick(item)}>
                                      <Settings className="mr-2 h-4 w-4" />
                                      Process
                                    </Button>
                                  </TableCell>
                              </TableRow>
                          ))}
                          </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground p-4">No indents are awaiting processing.</p>
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
      </div>
      <Dialog open={!!selectedIndent} onOpenChange={(isOpen) => !isOpen && setSelectedIndent(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Process Indent: {selectedIndent?.id}</DialogTitle>
            <DialogDescription>
              Assign an issuing site or generate a PO for <span className="font-semibold">{selectedIndent?.materials.reduce((acc, m) => acc + m.quantity, 0)} units</span> of <span className="font-semibold">{selectedIndent?.materials.map(m=>m.materialName).join(', ')}</span> for <span className="font-semibold">{selectedIndent?.requestingSite}</span>.
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
                                    <TableHead>Material</TableHead>
                                    <TableHead className="text-right">Available Qty</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materialAvailability.map(stock => (
                                    <TableRow key={stock.id}>
                                        <TableCell>{stock.site}</TableCell>
                                        <TableCell>{stock.material}</TableCell>
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
                                <Send className="mr-2 h-4 w-4" /> Issue from Selected Site
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
                            <Form {...poForm}>
                              <form onSubmit={poForm.handleSubmit(onGeneratePo)} className="space-y-4">
                                <FormField control={poForm.control} name="vendorName" render={({ field }) => (
                                  <FormItem><FormLabel className="sr-only">Vendor</FormLabel><FormControl><Input placeholder="Vendor Name" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <Button type="submit" className="w-full"> <FilePlus className="mr-2 h-4 w-4" /> Generate New PO</Button>
                              </form>
                            </Form>
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
                        This material is not available at any site or the central store. Please enter purchase details to generate a PO.
                    </p>
                    <Form {...poForm}>
                      <form onSubmit={poForm.handleSubmit(onGeneratePo)} className="space-y-4 max-w-sm mx-auto text-left">
                          <FormField control={poForm.control} name="vendorName" render={({ field }) => (
                            <FormItem><FormLabel>Vendor Name</FormLabel><FormControl><Input placeholder="e.g., Acme Suppliers" {...field} /></FormControl><FormMessage /></FormItem>
                          )}/>
                           <FormField control={poForm.control} name="vendorContact" render={({ field }) => (
                            <FormItem><FormLabel>Vendor Contact (Optional)</FormLabel><FormControl><Input placeholder="Phone or Email" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                          )}/>
                          <FormField control={poForm.control} name="billNumber" render={({ field }) => (
                            <FormItem><FormLabel>Reference/Bill Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., Q-12345" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
                          )}/>
                          <Button type="submit" className="w-full">
                              <FilePlus className="mr-2 h-4 w-4" />
                              Generate & Download PO
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
