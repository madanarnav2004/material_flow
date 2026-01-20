'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMaterialContext, InventoryItem } from '@/context/material-context';
import { cn } from '@/lib/utils';
import { Settings, Save, AlertTriangle, ArrowUp, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

const adjustmentSchema = z.object({
  site: z.string().min(1, "Site is required."),
  material: z.string().min(2, "Material name must be at least 2 characters."),
  classification: z.enum(['Asset', 'Consumable'], { required_error: 'Classification is required.' }),
  unit: z.string().min(1, "Unit is required."),
  quantity: z.coerce.number().min(0, "Quantity must be a non-negative number."),
  remarks: z.string().optional(),
});
type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;


export default function InventoryPage() {
  const { inventory, setInventory } = useMaterialContext();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter');

  const [siteFilter, setSiteFilter] = React.useState('All');
  const [statusFilter, setStatusFilter] = React.useState(initialFilter || 'All');
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [minQty, setMinQty] = React.useState(0);
  const [maxQty, setMaxQty] = React.useState(0);
  const { toast } = useToast();

  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = React.useState(false);
  const [currentStock, setCurrentStock] = React.useState<{ quantity: number; unit: string } | null>(null);

  const sites = ['All', ...Array.from(new Set(inventory.map(item => item.site)))];

  const adjustmentForm = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      site: '',
      material: '',
      unit: '',
      quantity: 0,
      remarks: '',
    },
  });

  const watchedSite = adjustmentForm.watch('site');
  const watchedMaterial = adjustmentForm.watch('material');

  React.useEffect(() => {
    if (watchedSite && watchedMaterial) {
      const item = inventory.find(i => i.site === watchedSite && i.material.toLowerCase() === watchedMaterial.toLowerCase());
      if (item) {
        setCurrentStock({ quantity: item.quantity, unit: item.unit });
        adjustmentForm.setValue('unit', item.unit);
        adjustmentForm.setValue('classification', item.classification);
      } else {
        setCurrentStock(null);
      }
    } else {
      setCurrentStock(null);
    }
  }, [watchedSite, watchedMaterial, inventory, adjustmentForm]);

  const onAdjustmentSubmit = (values: AdjustmentFormValues) => {
    setInventory(prevInventory => {
        const itemIndex = prevInventory.findIndex(i => i.site === values.site && i.material.toLowerCase() === values.material.toLowerCase());

        if (itemIndex > -1) {
            // Update existing item
            const newInventory = [...prevInventory];
            newInventory[itemIndex] = {
                ...newInventory[itemIndex],
                quantity: values.quantity,
                classification: values.classification,
                unit: values.unit,
            };
            return newInventory;
        } else {
            // Add new item
            const newItem: InventoryItem = {
                id: `inv-${Date.now()}`,
                site: values.site,
                material: values.material,
                classification: values.classification,
                quantity: values.quantity,
                unit: values.unit,
                minQty: 10, // Default min/max, can be changed later
                maxQty: 100,
            };
            return [...prevInventory, newItem];
        }
    });

    toast({
      title: 'Inventory Updated',
      description: `${values.quantity} units of ${values.material} have been recorded for ${values.site}.`,
    });
    setIsAdjustmentDialogOpen(false);
    adjustmentForm.reset();
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
        <Card>
          <CardHeader>
            <CardTitle>Material Inventory</CardTitle>
            <CardDescription>Real-time view of material stock across all sites and stores.</CardDescription>
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
              <Button onClick={() => setIsAdjustmentDialogOpen(true)} className="ml-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Old Material Entry
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
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
                        <TableCell>{item.material}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.classification}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{item.quantity.toLocaleString()} {item.unit}</TableCell>
                        <TableCell className="text-center">{item.minQty.toLocaleString()} / {item.maxQty.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(getStatusColor(status))}>
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
      
      <Dialog open={isAdjustmentDialogOpen} onOpenChange={(isOpen) => {if (!isOpen) { setIsAdjustmentDialogOpen(false); adjustmentForm.reset();}}}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Old Material Entry</DialogTitle>
            <DialogDescription>
              Add new materials or adjust quantities for existing stock.
            </DialogDescription>
          </DialogHeader>
          <Form {...adjustmentForm}>
            <form onSubmit={adjustmentForm.handleSubmit(onAdjustmentSubmit)} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={adjustmentForm.control}
                  name="site"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a site" /></SelectTrigger>
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
                  control={adjustmentForm.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Cement" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {currentStock && (
                  <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/30 border-blue-500/50">
                    <AlertDescription>
                      Existing Stock: <span className="font-bold">{currentStock.quantity.toLocaleString()} {currentStock.unit}</span>
                    </AlertDescription>
                  </Alert>
              )}
              
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={adjustmentForm.control}
                  name="classification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Consumable">Consumable</SelectItem>
                          <SelectItem value="Asset">Asset</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={adjustmentForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., bags, tons" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               </div>
               <FormField
                  control={adjustmentForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Total Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter the final quantity" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={adjustmentForm.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Initial stock count" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>Cancel</Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Save Entry
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
