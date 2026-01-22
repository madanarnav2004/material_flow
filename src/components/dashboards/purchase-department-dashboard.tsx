'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Upload, CheckCircle, Settings, Send, FilePlus, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMaterialContext, MaterialIndent, InventoryItem } from '@/context/material-context';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '../dashboard/stat-card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

type PurchaseOrder = MaterialIndent & {
    poId: string;
    poDate: Date;
    vendorName?: string;
    vendorContact?: string;
    billNumber?: string;
};

const poDetailsSchema = z.object({
  vendorName: z.string().min(2, 'Vendor name is required.'),
  vendorContact: z.string().optional(),
  billNumber: z.string().optional(),
});
type PoDetailsFormValues = z.infer<typeof poDetailsSchema>;

export default function PurchaseDepartmentDashboard() {
  const { toast } = useToast();
  const { requests, setRequests, inventory } = useMaterialContext();
  const [selectedIndent, setSelectedIndent] = React.useState<MaterialIndent | null>(null);
  const [issuingSite, setIssuingSite] = React.useState<string>('');
  
  const indentsForProcessing = requests.filter(req => req.status === 'Director Approved');

  const generatedPOs: PurchaseOrder[] = requests
    .filter(req => req.status === 'PO Generated' && req.poDate)
    .map(req => ({
        ...req,
        poId: `PO-${req.id}`,
        poDate: new Date(req.poDate!),
    }));

  const lowStockMaterials = React.useMemo(() => {
    return inventory.filter(item => item.quantity <= item.minQty);
  }, [inventory]);
  const lowStockCount = lowStockMaterials.length;

  const materialAvailability = selectedIndent
    ? inventory.filter(s => s.material.toLowerCase() === selectedIndent.material.toLowerCase())
    : [];

  const availableSites = [...new Set(materialAvailability.map(s => s.site))];

  const poForm = useForm<PoDetailsFormValues>({
    resolver: zodResolver(poDetailsSchema),
  });

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
  
  const handleDownloadPO = (po: PurchaseOrder) => {
    if (!po) {
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: "Could not find the PO content to download."
        });
        return;
    };
    
    const poHtml = `
        <div class="p-4 border rounded-lg space-y-2">
            <div class="flex justify-between">
                <span class="font-semibold">PO Number:</span>
                <span>${po.poId}</span>
            </div>
             <div class="flex justify-between">
                <span class="font-semibold">PO Date:</span>
                <span>${po.poDate.toLocaleDateString()}</span>
            </div>
            <div class="flex justify-between">
                <span class="font-semibold">Material:</span>
                <span>${po.material}</span>
            </div>
            <div class="flex justify-between">
                <span class="font-semibold">Quantity:</span>
                <span>${po.quantity}</span>
            </div>
            <div class="flex justify-between">
                <span class="font-semibold">Requesting Site:</span>
                <span>${po.site}</span>
            </div>
            ${po.vendorName ? `<div class="flex justify-between"><span class="font-semibold">Vendor:</span><span>${po.vendorName}</span></div>` : ''}
            ${po.vendorContact ? `<div class="flex justify-between"><span class="font-semibold">Vendor Contact:</span><span>${po.vendorContact}</span></div>` : ''}
            ${po.billNumber ? `<div class="flex justify-between"><span class="font-semibold">Bill/Ref #:</span><span>${po.billNumber}</span></div>` : ''}
        </div>
    `;

    const blob = new Blob([`<html><head><title>PO: ${po.poId}</title><style>body{font-family:sans-serif;padding:20px}.flex{display:flex}.justify-between{justify-content:space-between}h1{font-size:1.5rem;font-weight:bold;margin-bottom:1rem}.p-4{padding:1rem}.border{border:1px solid #ddd}.rounded-lg{border-radius:0.5rem}.space-y-2>*{margin-top:0.5rem}.font-semibold{font-weight:600}</style></head><body><h1>Purchase Order: ${po.poId}</h1>${poHtml}</body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PO-${po.poId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
        title: "Download Started",
        description: `Purchase Order ${po.poId} is downloading.`
    });
  };

  const onGeneratePo = (values: PoDetailsFormValues) => {
    if (!selectedIndent) return;

    const poDate = new Date();
    const po: PurchaseOrder = {
        ...selectedIndent,
        ...values,
        poId: `PO-${selectedIndent.id}`,
        poDate: poDate,
        status: 'PO Generated',
    };
    
    setRequests(prevRequests =>
        prevRequests.map(req =>
            req.id === selectedIndent.id ? { ...req, status: 'PO Generated', poDate: poDate.toISOString() } : req
        )
    );

    setSelectedIndent(null);
    handleDownloadPO(po);
    toast({
      title: 'Purchase Order Generated',
      description: `A new PO for ${selectedIndent.material} has been generated.`,
    });
  };

  // Memoize stock calculations
  const { orgStock, siteStock, storeStock } = React.useMemo(() => {
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
    const storeStock = inventory.filter(s => s.site === 'MAPI Godown');

    return { orgStock, siteStock, storeStock };
  }, [inventory]);


  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Purchase Department Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer">
              <StatCard
                  title="Indents to Process"
                  value={indentsForProcessing.length.toString()}
                  icon={Settings}
                  description="Awaiting site assignment"
                />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Indents for Processing</DialogTitle>
              <DialogDescription>Assign an issuing site for director-approved indents.</DialogDescription>
            </DialogHeader>
             {indentsForProcessing.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indent Number</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Requesting Site</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indentsForProcessing.map(indent => (
                    <TableRow key={indent.id}>
                      <TableCell className="font-medium">{indent.id}</TableCell>
                      <TableCell>{indent.material}</TableCell>
                      <TableCell>{indent.quantity}</TableCell>
                      <TableCell>{indent.site}</TableCell>
                      <TableCell className="text-right space-x-2">
                         <Button size="sm" onClick={() => handleProcessClick(indent)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Process Indent
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center p-8">
                <p className="text-center text-muted-foreground">No indents are awaiting processing.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer">
              <StatCard
                title="Generated POs"
                value={generatedPOs.length.toString()}
                icon={FilePlus}
                description="Awaiting fulfillment"
              />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
             <DialogHeader>
              <DialogTitle>Generated Purchase Orders</DialogTitle>
              <DialogDescription>A list of all generated purchase orders awaiting fulfillment.</DialogDescription>
            </DialogHeader>
             {generatedPOs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Requesting Site</TableHead>
                    <TableHead>PO Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedPOs.map(po => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.poId}</TableCell>
                      <TableCell>{po.material}</TableCell>
                      <TableCell>{po.quantity}</TableCell>
                      <TableCell>{po.site}</TableCell>
                      <TableCell>{po.poDate.toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPO(po)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download PO
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center p-8">
                <p className="text-center text-muted-foreground">
                  No purchase orders have been generated yet.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer">
              <StatCard
                title="Total Inventory Value"
                value="$XXX,XXX"
                icon={CheckCircle}
                description="Across all locations"
              />
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inventory Value Breakdown</DialogTitle>
            </DialogHeader>
            <p className="text-center text-muted-foreground p-8">
              Detailed value breakdown is not yet implemented.
            </p>
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
              <DialogDescription>Materials that have fallen below their minimum required quantity.</DialogDescription>
            </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
              {lowStockMaterials.length > 0 ? (
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
                        {lowStockMaterials.map((item: InventoryItem) => (
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
                  <p className="text-center text-muted-foreground p-8">No low stock alerts.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
              <CardTitle>Material Stock Overview</CardTitle>
              <CardDescription>
                  Live inventory counts across the organization.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <Tabs defaultValue="organization" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="organization">Organization-wise</TabsTrigger>
                      <TabsTrigger value="site">Site-wise</TabsTrigger>
                      <TabsTrigger value="store">Store-wise</TabsTrigger>
                  </TabsList>
                  <TabsContent value="organization">
                      <Table>
                          <TableHeader><TableRow><TableHead>Material</TableHead><TableHead className="text-right">Total Quantity</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {orgStock.map(item => (<TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell className="text-right">{item.quantity.toLocaleString()} {item.unit}</TableCell></TableRow>))}
                          </TableBody>
                      </Table>
                  </TabsContent>
                  <TabsContent value="site">
                      {Object.entries(siteStock).map(([siteName, materials]) => (
                          <div key={siteName} className="mb-4">
                              <h3 className="font-semibold mb-2">{siteName}</h3>
                              <Table>
                                  <TableHeader><TableRow><TableHead>Material</TableHead><TableHead className="text-right">Quantity</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                      {materials.map(item => (<TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell className="text-right">{item.quantity.toLocaleString()} {item.unit}</TableCell></TableRow>))}
                                  </TableBody>
                              </Table>
                          </div>
                      ))}
                  </TabsContent>
                  <TabsContent value="store">
                      <Table>
                          <TableHeader><TableRow><TableHead>Material</TableHead><TableHead className="text-right">Quantity</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {storeStock.map(item => (<TableRow key={item.id}><TableCell>{item.material}</TableCell><TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell></TableRow>))}
                          </TableBody>
                      </Table>
                  </TabsContent>
              </Tabs>
          </CardContent>
      </Card>
      </div>

      <Dialog open={!!selectedIndent} onOpenChange={(isOpen) => !isOpen && setSelectedIndent(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Process Indent: {selectedIndent?.id}</DialogTitle>
            <DialogDescription>
              Assign an issuing site for <span className="font-semibold">{selectedIndent?.quantity} units</span> of <span className="font-semibold">{selectedIndent?.material}</span> for <span className="font-semibold">{selectedIndent?.site}</span>.
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
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" className="w-full">
                                        <FilePlus className="mr-2 h-4 w-4" /> Purchase New (Generate PO)
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>New Purchase Order Details</DialogTitle>
                                        <DialogDescription>Enter vendor details for this new purchase.</DialogDescription>
                                    </DialogHeader>
                                    <Form {...poForm}>
                                        <form onSubmit={poForm.handleSubmit(onGeneratePo)} className="space-y-4">
                                            <FormField
                                                control={poForm.control}
                                                name="vendorName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Vendor Name</FormLabel>
                                                        <FormControl><Input placeholder="e.g., Acme Suppliers" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={poForm.control}
                                                name="vendorContact"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Vendor Contact (Optional)</FormLabel>
                                                        <FormControl><Input placeholder="Phone or Email" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={poForm.control}
                                                name="billNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Reference/Bill Number (Optional)</FormLabel>
                                                        <FormControl><Input placeholder="e.g., Q-12345" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit">Generate & Download PO</Button>
                                        </form>
                                    </Form>
                                </DialogContent>
                             </Dialog>
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
                          <FormField
                              control={poForm.control}
                              name="vendorName"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Vendor Name</FormLabel>
                                      <FormControl><Input placeholder="e.g., Acme Suppliers" {...field} /></FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                           <FormField
                              control={poForm.control}
                              name="vendorContact"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Vendor Contact (Optional)</FormLabel>
                                      <FormControl><Input placeholder="Phone or Email" {...field} /></FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={poForm.control}
                              name="billNumber"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Reference/Bill Number (Optional)</FormLabel>
                                      <FormControl><Input placeholder="e.g., Q-12345" {...field} /></FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
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
