'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMaterialContext, InventoryItem, InventoryUploadRecord } from '@/context/material-context';
import { cn } from '@/lib/utils';
import { Settings, Save, AlertTriangle, ArrowUp, PlusCircle, Trash, FileUp, History, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/hooks/use-user';
import { format } from 'date-fns';

function getStatus(item: InventoryItem) {
  if (item.quantity <= item.minQty) return 'Low Stock';
  if (item.quantity > item.maxQty) return 'Overstock';
  return 'In Stock';
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Low Stock':
      return 'bg-destructive/80 text-destructive-foreground';
    case 'Overstock':
      return 'bg-yellow-500/80 text-yellow-foreground';
    default:
      return 'bg-green-600/80 text-green-foreground';
  }
}

const materialEntrySchema = z.object({
  material: z.string().min(2, "Material name must be at least 2 characters."),
  classification: z.enum(['Asset', 'Consumable'], { required_error: 'Classification is required.' }),
  ownership: z.enum(['Own', 'Rent']).optional(),
  vendorName: z.string().optional(),
  unit: z.string().min(1, "Unit is required."),
  quantity: z.coerce.number().min(0, "Quantity must be a non-negative number."),
  remarks: z.string().optional(),
}).refine(data => {
    if (data.classification === 'Asset') {
        return !!data.ownership;
    }
    return true;
}, {
    message: 'Ownership type is required for assets.',
    path: ['ownership'],
}).refine(data => {
    if (data.classification === 'Asset' && data.ownership === 'Rent') {
        return data.vendorName && data.vendorName.length > 0;
    }
    return true;
}, {
    message: 'Vendor name is required for rented assets.',
    path: ['vendorName'],
});

const adjustmentSchema = z.object({
  site: z.string().min(1, "Site is required."),
  materials: z.array(materialEntrySchema).min(1, 'Please add at least one material.'),
});
type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

const excelUploadSchema = z.object({
  site: z.string().min(1, "Please select a site for this stock report."),
  excelFile: (typeof window !== 'undefined' ? z.instanceof(File) : z.any())
    .refine(file => file, 'Excel stock report is mandatory.'),
});
type ExcelUploadValues = z.infer<typeof excelUploadSchema>;


export default function InventoryPage() {
  const { inventory, setInventory, inventoryUploads, setInventoryUploads } = useMaterialContext();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter');

  const [siteFilter, setSiteFilter] = React.useState('All');
  const [statusFilter, setStatusFilter] = React.useState(initialFilter || 'All');
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [minQty, setMinQty] = React.useState(0);
  const [maxQty, setMaxQty] = React.useState(0);
  const { toast } = useToast();

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);

  const sites = ['All', ...Array.from(new Set(inventory.map(item => item.site)))];

  const adjustmentForm = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      site: '',
      materials: [{
        material: '',
        classification: 'Consumable',
        ownership: undefined,
        vendorName: '',
        unit: '',
        quantity: 0,
        remarks: ''
      }],
    },
  });

  const excelForm = useForm<ExcelUploadValues>({
    resolver: zodResolver(excelUploadSchema),
    defaultValues: {
      site: '',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: adjustmentForm.control,
    name: "materials"
  });


  const onAdjustmentSubmit = (values: AdjustmentFormValues) => {
    setInventory(prevInventory => {
        let newInventory = [...prevInventory];

        values.materials.forEach(material => {
            const itemIndex = newInventory.findIndex(i => i.site === values.site && i.material.toLowerCase() === material.material.toLowerCase());

            if (itemIndex > -1) {
                newInventory[itemIndex] = {
                    ...newInventory[itemIndex],
                    quantity: material.quantity,
                    classification: material.classification,
                    unit: material.unit,
                    ownership: material.ownership,
                    vendorName: material.vendorName,
                };
            } else {
                const newItem: InventoryItem = {
                    id: `inv-${Date.now()}-${Math.random()}`,
                    site: values.site,
                    material: material.material,
                    classification: material.classification,
                    ownership: material.ownership,
                    vendorName: material.vendorName,
                    quantity: material.quantity,
                    unit: material.unit,
                    minQty: 10,
                    maxQty: 100,
                };
                newInventory.push(newItem);
            }
        });
        return newInventory;
    });

    toast({
      title: 'Inventory Updated',
      description: `${values.materials.length} material entries have been recorded for ${values.site}.`,
    });
    setIsUpdateDialogOpen(false);
    adjustmentForm.reset();
  };

  const onExcelUploadSubmit = (values: ExcelUploadValues) => {
    // Simulate parsing Excel and updating inventory
    // In a real app, you'd use a library like 'xlsx' here
    
    const mockItemsProcessed = 5;
    
    const newUploadRecord: InventoryUploadRecord = {
      id: `up-${Date.now()}`,
      filename: values.excelFile.name,
      uploadedBy: user?.name || 'Authorized User',
      timestamp: new Date().toISOString(),
      site: values.site,
      itemsCount: mockItemsProcessed,
    };

    setInventoryUploads(prev => [newUploadRecord, ...prev]);
    
    // Simulate stock logic: Update a few items if they match or add new ones
    setInventory(prev => {
        const next = [...prev];
        // Mock logic: adding a generic "Bulk Upload" item for demo
        const newItem: InventoryItem = {
            id: `inv-xl-${Date.now()}`,
            site: values.site,
            material: `XLS-${values.excelFile.name.substring(0, 5)} Material`,
            classification: 'Consumable',
            quantity: 500,
            unit: 'units',
            minQty: 50,
            maxQty: 2000,
        };
        return [newItem, ...next];
    });

    toast({
      title: 'Excel Stock Sync Successful',
      description: `Stock report "${values.excelFile.name}" processed. ${mockItemsProcessed} items updated for ${values.site}.`,
    });
    
    setIsUpdateDialogOpen(false);
    excelForm.reset();
  };

  const filteredInventory = React.useMemo(() => {
    return inventory.filter(item => {
      const siteMatch = siteFilter === 'All' || item.site === siteFilter;
      const status = getStatus(item);
      const statusMatch = statusFilter === 'All' || (statusFilter === 'low-stock' && status === 'Low Stock');
      return siteMatch && statusMatch;
    });
  }, [inventory, siteFilter, statusFilter]);

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setMinQty(item.minQty);
    setMaxQty(item.maxQty);
  };

  const handleSaveChanges = () => {
    if (!editingItem) return;

    setInventory(prevInventory =>
      prevInventory.map(item =>
        item.id === editingItem.id ? { ...item, minQty, maxQty } : item
      )
    );

    toast({
      title: 'Limits Updated',
      description: `Min/Max limits for ${editingItem.material} at ${editingItem.site} have been saved.`,
    });
    setEditingItem(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-headline">Material Inventory</h1>
            <Button onClick={() => setIsUpdateDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Update Stock
            </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Live Stock Ledger</CardTitle>
            <CardDescription>Real-time view of material stock across all sites and stores. Updated automatically via reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by site..." />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site} value={site}>{site}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site Identifier</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead className="text-right">Available Qty</TableHead>
                    <TableHead className="text-center">Min/Max Limits</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map(item => {
                    const status = getStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.site}</TableCell>
                        <TableCell className="font-bold">{item.material}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">{item.classification}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-black text-primary">{item.quantity.toLocaleString()} {item.unit}</TableCell>
                        <TableCell className="text-center text-xs opacity-70">{item.minQty.toLocaleString()} / {item.maxQty.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-[9px] uppercase h-5", getStatusColor(status))}>
                            {status === 'Low Stock' && <AlertTriangle className="mr-1 h-3 w-3" />}
                            {status === 'Overstock' && <ArrowUp className="mr-1 h-3 w-3" />}
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)}>
                            <Settings className="h-4 w-4" />
                            <span className="sr-only">Set Limits</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {inventoryUploads.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary"/> Inventory Update History</CardTitle>
                    <CardDescription>Audit trail of automated stock synchronization from Excel reports.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="text-[10px] h-8 px-4">Filename</TableHead>
                                <TableHead className="text-[10px] h-8">SiteScope</TableHead>
                                <TableHead className="text-[10px] h-8">Uploaded By</TableHead>
                                <TableHead className="text-[10px] h-8 text-right">Items</TableHead>
                                <TableHead className="text-[10px] h-8 pr-4 text-right">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventoryUploads.map(log => (
                                <TableRow key={log.id} className="h-10">
                                    <TableCell className="text-xs font-medium px-4">{log.filename}</TableCell>
                                    <TableCell className="text-xs">{log.site}</TableCell>
                                    <TableCell className="text-xs font-bold">{log.uploadedBy}</TableCell>
                                    <TableCell className="text-xs text-right">{log.itemsCount}</TableCell>
                                    <TableCell className="text-[10px] text-muted-foreground pr-4 text-right">{format(new Date(log.timestamp), 'PP p')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
      </div>

      <Dialog open={!!editingItem} onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Min/Max Stock Limits</DialogTitle>
            <DialogDescription>
              For <span className="font-semibold">{editingItem?.material}</span> at <span className="font-semibold">{editingItem?.site}</span>.
              Current quantity is {editingItem?.quantity.toLocaleString()} {editingItem?.unit}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min-qty" className="text-right">Min Quantity</Label>
              <Input
                id="min-qty"
                type="number"
                value={minQty}
                onChange={(e) => setMinQty(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max-qty" className="text-right">Max Quantity</Label>
              <Input
                id="max-qty"
                type="number"
                value={maxQty}
                onChange={(e) => setMaxQty(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Inventory Stock Update</DialogTitle>
            <DialogDescription>
              Update site inventory manually or sync from an external Excel stock report.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="manual" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 grid grid-cols-2 bg-muted/50 p-1">
                <TabsTrigger value="manual" className="flex items-center gap-2 font-bold"><PlusCircle className="h-4 w-4"/> Manual Entry</TabsTrigger>
                <TabsTrigger value="excel" className="flex items-center gap-2 font-bold"><FileUp className="h-4 w-4"/> Excel Stock Sync</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="flex-1 overflow-y-auto p-6 pt-2">
                <Form {...adjustmentForm}>
                    <form onSubmit={adjustmentForm.handleSubmit(onAdjustmentSubmit)} className="space-y-6">
                    <FormField
                        control={adjustmentForm.control}
                        name="site"
                        render={({ field }) => (
                            <FormItem className="max-w-sm">
                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">Operating Site</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select site to update" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {sites.filter(s => s !== 'All').map(site => (
                                    <SelectItem key={site} value={site}>{site}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        <div className="rounded-xl border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-[10px]">Material</TableHead>
                                <TableHead className="text-[10px]">Type</TableHead>
                                <TableHead className="text-[10px]">Ownership</TableHead>
                                <TableHead className="text-[10px]">Vendor/Remark</TableHead>
                                <TableHead className="text-[10px]">Unit</TableHead>
                                <TableHead className="text-[10px]">Final Total Qty</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {fields.map((item, index) => (
                                <TableRow key={item.id} className="h-14">
                                <TableCell className="min-w-[150px]">
                                    <FormField control={adjustmentForm.control} name={`materials.${index}.material`} render={({ field }) => (
                                        <FormItem><FormControl><Input placeholder="Cement" {...field} className="h-8 text-xs font-bold"/></FormControl><FormMessage /></FormItem>
                                    )}
                                    />
                                </TableCell>
                                <TableCell className="min-w-[130px]">
                                    <FormField control={adjustmentForm.control} name={`materials.${index}.classification`} render={({ field }) => (
                                        <FormItem>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger className="h-8 text-[10px] uppercase font-bold"><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                            <SelectItem value="Consumable">Consumable</SelectItem>
                                            <SelectItem value="Asset">Asset</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                </TableCell>
                                <TableCell className="min-w-[120px]">
                                    {adjustmentForm.watch(`materials.${index}.classification`) === 'Asset' && (
                                        <FormField control={adjustmentForm.control} name={`materials.${index}.ownership`} render={({ field }) => (
                                            <FormItem>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger className="h-8 text-[10px] uppercase"><SelectValue placeholder="Ownership"/></SelectTrigger></FormControl>
                                                <SelectContent><SelectItem value="Own">Own</SelectItem><SelectItem value="Rent">Rent</SelectItem></SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    )}
                                </TableCell>
                                <TableCell className="min-w-[150px]">
                                    <FormField control={adjustmentForm.control} name={`materials.${index}.vendorName`} render={({ field }) => (
                                        <FormItem><FormControl><Input placeholder="Vendor/Details" {...field} value={field.value || ''} className="h-8 text-xs"/></FormControl><FormMessage /></FormItem>
                                    )} />
                                </TableCell>
                                <TableCell className="min-w-[100px]">
                                    <FormField control={adjustmentForm.control} name={`materials.${index}.unit`} render={({ field }) => (
                                        <FormItem><FormControl><Input placeholder="bags" {...field} className="h-8 text-xs"/></FormControl><FormMessage /></FormItem>
                                    )} />
                                </TableCell>
                                <TableCell className="min-w-[100px]">
                                    <FormField control={adjustmentForm.control} name={`materials.${index}.quantity`} render={({ field }) => (
                                        <FormItem><FormControl><Input type="number" {...field} className="h-8 text-xs font-black"/></FormControl><FormMessage /></FormItem>
                                    )} />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="h-8 w-8 text-destructive">
                                    <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </div>
                        <div className="flex justify-between items-center border-t pt-6">
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ material: '', classification: 'Consumable', unit: '', quantity: 0 })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Row
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="outline" type="button" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
                                <Button type="submit"><Save className="mr-2 h-4 w-4" /> Finalize Manual Ledger</Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </TabsContent>

            <TabsContent value="excel" className="flex-1 overflow-y-auto p-12">
                <Form {...excelForm}>
                    <form onSubmit={excelForm.handleSubmit(onExcelUploadSubmit)} className="max-w-xl mx-auto space-y-8">
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black font-headline">Automated Stock Sync</h3>
                            <p className="text-sm text-muted-foreground">Upload your weekly stock report to automatically update levels for a specific site. All roles can verify stock via Excel.</p>
                        </div>

                        <FormField
                            control={excelForm.control}
                            name="site"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-xs font-black uppercase text-primary">Target Site Scope</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="h-12"><SelectValue placeholder="Identify the site for this stock data" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {sites.filter(s => s !== 'All').map(site => (
                                        <SelectItem key={site} value={site}>{site}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={excelForm.control}
                            name="excelFile"
                            render={({ field: { onChange, value } }) => (
                                <FormItem className="border-2 border-dashed rounded-3xl p-12 bg-primary/5 hover:bg-primary/10 transition-colors text-center cursor-pointer relative group">
                                    <Input 
                                        type="file" 
                                        accept=".xlsx, .xls, .csv" 
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={(e) => onChange(e.target.files?.[0])}
                                    />
                                    <div className="space-y-4">
                                        <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                            <FileUp className="h-8 w-8 text-primary"/>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">Click or Drag Excel Stock Report</p>
                                            <p className="text-xs text-muted-foreground">Supported: .XLSX, .CSV (Max 10MB)</p>
                                        </div>
                                        {value && (
                                            <Badge className="bg-green-600 px-4 py-1">
                                                <History className="mr-2 h-3 w-3"/> Ready: {value.name}
                                            </Badge>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="pt-4 flex flex-col gap-4">
                            <Button type="submit" size="lg" className="w-full font-black uppercase tracking-widest py-8 text-lg" disabled={!excelForm.watch('excelFile')}>
                                <Save className="mr-2 h-6 w-6"/> Synchronize Inventory Database
                            </Button>
                            <Button variant="ghost" type="button" onClick={() => setIsUpdateDialogOpen(false)} className="uppercase text-[10px] font-black tracking-tighter">Cancel and Return to Ledger</Button>
                        </div>
                    </form>
                </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
