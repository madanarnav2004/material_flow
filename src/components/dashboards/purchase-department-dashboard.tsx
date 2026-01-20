'use client';

import * as React from 'react';
import { Download, Upload, CheckCircle, Settings, Send, FilePlus, ChevronDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMaterialContext, MaterialIndent, IndentStatus } from '@/context/material-context';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { detailedStock } from '@/lib/mock-data';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import StatCard from '../dashboard/stat-card';
import { useRouter } from 'next/navigation';

type PurchaseOrder = MaterialIndent & {
    poId: string;
    poDate: Date;
};


export default function PurchaseDepartmentDashboard() {
  const { toast } = useToast();
  const router = useRouter();
  const { requests, setRequests, inventory } = useMaterialContext();
  const [selectedIndent, setSelectedIndent] = React.useState<MaterialIndent | null>(null);
  const [issuingSite, setIssuingSite] = React.useState<string>('');
  const [generatedPO, setGeneratedPO] = React.useState<PurchaseOrder | null>(null);

  const indentsForProcessing = requests.filter(req => req.status === 'Director Approved');

  const lowStockCount = React.useMemo(() => {
    return inventory.filter(item => item.quantity <= item.minQty).length;
  }, [inventory]);

  const materialAvailability = selectedIndent
    ? inventory.filter(s => s.material.toLowerCase() === selectedIndent.material.toLowerCase())
    : [];

  const availableSites = [...new Set(materialAvailability.map(s => s.site))];

  const handleProcessClick = (indent: MaterialIndent) => {
    setSelectedIndent(indent);
    setIssuingSite('');
    setGeneratedPO(null);
  };

  const handleFinalApproval = (decision: 'Issued' | 'Purchase Rejected') => {
    if (!selectedIndent || !issuingSite) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select an issuing site.' });
        return;
    }

    setRequests(prevRequests =>
        prevRequests.map(req =>
            req.id === selectedIndent.id ? { ...req, status: decision, issuingSite: issuingSite } : req
        )
    );

    toast({
        title: `Indent ${decision}`,
        description: `Indent ${selectedIndent.id} has been processed.`,
    });
    setSelectedIndent(null);
  };
  
  const handleCreatePO = () => {
    if (!selectedIndent) return;

    const po: PurchaseOrder = {
        ...selectedIndent,
        poId: `PO-${selectedIndent.id}`,
        poDate: new Date(),
        status: 'PO Generated',
    };
    
    setGeneratedPO(po);
    
    setRequests(prevRequests =>
        prevRequests.map(req =>
            req.id === selectedIndent.id ? { ...req, status: 'PO Generated' } : req
        )
    );

    setSelectedIndent(null);
    toast({
      title: 'Purchase Order Generated',
      description: `A new PO for ${selectedIndent.material} has been generated.`,
    });
  };

  const handleDownloadPO = (poId: string) => {
      toast({
          title: "Download Started",
          description: `Purchase Order ${poId} is downloading.`
      });
  }

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
    const storeStock = inventory.filter(s => s.site === 'MAPI Store');

    return { orgStock, siteStock, storeStock };
  }, [inventory]);


  return (
    <>
      <h1 className="text-3xl font-bold font-headline">Purchase Department Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard
            title="Indents to Process"
            value={indentsForProcessing.length.toString()}
            icon={Settings}
            description="Awaiting site assignment"
          />
          <StatCard
            title="Generated POs"
            value={requests.filter(r => r.status === 'PO Generated').length.toString()}
            icon={FilePlus}
            description="Awaiting fulfillment"
          />
          <StatCard
            title="Total Inventory Value"
            value="$XXX,XXX"
            icon={CheckCircle}
            description="Across all locations"
          />
           <StatCard
            title="Low Stock Alerts"
            value={`${lowStockCount} materials`}
            icon={AlertTriangle}
            description="Across all sites"
            className="text-destructive border-destructive/50"
            onClick={() => router.push('/dashboard/inventory?filter=low-stock')}
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Indents for Processing</CardTitle>
            <CardDescription>
              Assign an issuing site for director-approved indents.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {generatedPO && (
            <Card>
                <CardHeader>
                    <CardTitle>Generated Purchase Order</CardTitle>
                    <CardDescription>A new PO has been created for an unavailable material.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="font-semibold">PO Number:</span>
                            <span>{generatedPO.poId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Material:</span>
                            <span>{generatedPO.material}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="font-semibold">Quantity:</span>
                            <span>{generatedPO.quantity}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="font-semibold">Requesting Site:</span>
                            <span>{generatedPO.site}</span>
                        </div>
                    </div>
                    <Button onClick={() => handleDownloadPO(generatedPO.poId)} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download Purchase Order
                    </Button>
                </CardContent>
            </Card>
        )}
      </div>
      
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
                        <Label htmlFor="issuing-site-select">Select Issuing Site</Label>
                        <Select onValueChange={setIssuingSite} value={issuingSite}>
                            <SelectTrigger id="issuing-site-select">
                                <SelectValue placeholder="Choose a site..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableSites.map(site => (
                                    <SelectItem key={site} value={site}>{site}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button disabled={!issuingSite} className="w-full">
                              Select Final Action <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleFinalApproval('Issued')}>
                                <Send className="mr-2 h-4 w-4" /> Issue from Selected Site
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFinalApproval('Purchase Rejected')} className="text-destructive">
                                Reject Indent
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                    </div>
                </div>
            </div>
          ) : (
             <div className="py-4">
                <div className="text-center p-8 border rounded-lg bg-secondary/50">
                    <h3 className="font-semibold text-lg">No Stock Found</h3>
                    <p className="text-muted-foreground mb-4">
                        This material is not available at any site or the central store.
                    </p>
                    <Button onClick={handleCreatePO}>
                        <FilePlus className="mr-2 h-4 w-4" />
                        Create Purchase Order
                    </Button>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
