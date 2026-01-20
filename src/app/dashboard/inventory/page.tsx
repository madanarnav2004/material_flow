'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMaterialContext, InventoryItem } from '@/context/material-context';
import { cn } from '@/lib/utils';
import { Settings, Save, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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

  const sites = ['All', ...Array.from(new Set(inventory.map(item => item.site)))];

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
    </>
  );
}
