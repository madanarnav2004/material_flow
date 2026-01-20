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
import { useMaterialContext, InventoryItem } from '@/context/material-context';
import { cn } from '@/lib/utils';
import { Settings, Save, AlertTriangle, ArrowUp, PlusCircle, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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
                // Update existing item
                newInventory[itemIndex] = {
                    ...newInventory[itemIndex],
                    quantity: material.quantity,
                    classification: material.classification,
                    unit: material.unit,
                    ownership: material.ownership,
                    vendorName: material.vendorName,
                };
            } else {
                // Add new item
                const newItem: InventoryItem = {
                    id: `inv-${Date.now()}-${Math.random()}`,
                    site: values.site,
                    material: material.material,
                    classification: material.classification,
                    ownership: material.ownership,
                    vendorName: material.vendorName,
                    quantity: material.quantity,
                    unit: material.unit,
                    minQty: 10, // Default min/max, can be changed later
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
    setIsAdjustmentDialogOpen(false);
    adjustmentForm.reset({
      site: values.site,
      materials: [{ material: '', classification: 'Consumable', unit: '', quantity: 0, remarks: '' }],
    });
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
                Manual Stock Entry
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Ownership</TableHead>
                    <TableHead>Vendor</TableHead>
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
                        <TableCell>{item.classification === 'Asset' ? item.ownership : 'N/A'}</TableCell>
                        <TableCell>{item.ownership === 'Rent' ? item.vendorName : 'N/A'}</TableCell>
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
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Manual Stock Entry</DialogTitle>
            <DialogDescription>
              Add one or more new materials to a site's inventory or adjust the quantity of existing items.
            </DialogDescription>
          </DialogHeader>
          <Form {...adjustmentForm}>
            <form onSubmit={adjustmentForm.handleSubmit(onAdjustmentSubmit)} className="space-y-6 pt-4">
               <FormField
                  control={adjustmentForm.control}
                  name="site"
                  render={({ field }) => (
                    <FormItem className="max-w-sm">
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

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Ownership</TableHead>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>New Total Qty</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="min-w-[150px]">
                            <FormField control={adjustmentForm.control} name={`materials.${index}.material`} render={({ field }) => (
                                <FormItem><FormControl><Input placeholder="e.g., Cement" {...field} /></FormControl><FormMessage /></FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="min-w-[150px]">
                            <FormField control={adjustmentForm.control} name={`materials.${index}.classification`} render={({ field }) => (
                                <FormItem>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl>
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
                          <TableCell className="min-w-[150px]">
                            {adjustmentForm.watch(`materials.${index}.classification`) === 'Asset' && (
                                <FormField control={adjustmentForm.control} name={`materials.${index}.ownership`} render={({ field }) => (
                                    <FormItem>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select ownership" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                          <SelectItem value="Own">Own</SelectItem>
                                          <SelectItem value="Rent">Rent</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                            )}
                          </TableCell>
                           <TableCell className="min-w-[150px]">
                            {adjustmentForm.watch(`materials.${index}.classification`) === 'Asset' &&
                             adjustmentForm.watch(`materials.${index}.ownership`) === 'Rent' && (
                                <FormField control={adjustmentForm.control} name={`materials.${index}.vendorName`} render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="Vendor Name" {...field} /></FormControl><FormMessage /></FormItem>
                                  )}
                                />
                            )}
                           </TableCell>
                           <TableCell className="min-w-[120px]">
                             <FormField control={adjustmentForm.control} name={`materials.${index}.unit`} render={({ field }) => (
                                <FormItem><FormControl><Input placeholder="e.g., bags" {...field} /></FormControl><FormMessage /></FormItem>
                              )}
                            />
                           </TableCell>
                           <TableCell className="min-w-[120px]">
                            <FormField control={adjustmentForm.control} name={`materials.${index}.quantity`} render={({ field }) => (
                                <FormItem><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>
                              )}
                            />
                           </TableCell>
                           <TableCell className="min-w-[150px]">
                             <FormField control={adjustmentForm.control} name={`materials.${index}.remarks`} render={({ field }) => (
                                <FormItem><FormControl><Input placeholder="Initial stock count" {...field} /></FormControl><FormMessage /></FormItem>
                              )}
                            />
                           </TableCell>
                           <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                              <Trash className="h-4 w-4" />
                            </Button>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ material: '', classification: 'Consumable', unit: '', quantity: 0, remarks: '' })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Another Material
                </Button>


              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>Cancel</Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Save Entries
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
