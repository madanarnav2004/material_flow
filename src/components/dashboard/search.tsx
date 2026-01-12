
'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { UserRole } from '@/hooks/use-user';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { engineerUsage, boqUsage, recentActivities } from '@/lib/mock-data';


type SearchCategory = {
    value: string;
    label: string;
    placeholder: string;
    roles: UserRole[];
};

const searchCategories: SearchCategory[] = [
    // Site Manager
    { value: 'engineer-usage', label: 'Engineer-wise Usage', placeholder: 'Search by engineer name...', roles: ['site-manager', 'director', 'coordinator'] },
    { value: 'boq-usage-engineer', label: 'BOQ Item-wise Usage (by Engineer)', placeholder: 'Search by BOQ item or engineer...', roles: ['site-manager', 'director', 'coordinator'] },
    { value: 'building-usage', label: 'Building-wise Usage', placeholder: 'Search by building name...', roles: ['site-manager', 'director', 'coordinator'] },
    { value: 'month-usage-site', label: 'Month-wise Usage (Site)', placeholder: 'Search by month (e.g., July)...', roles: ['site-manager', 'director', 'coordinator'] },
    
    // Director
    { value: 'org-usage', label: 'Organization-wise Usage', placeholder: 'Search material...', roles: ['director'] },
    { value: 'all-stock', label: 'Material Stock (All)', placeholder: 'Search material...', roles: ['director'] },
    
    // Coordinator
    { value: 'coordinator-usage', label: 'Coordinator-wise Usage', placeholder: 'Search material...', roles: ['coordinator'] },
    
    // Store Manager
    { value: 'stock-search', label: 'Stock Search (Item/Site)', placeholder: 'Search material or site...', roles: ['store-manager', 'director'] },
    { value: 'request-search-material', label: 'Request Search (by Material)', placeholder: 'Search material name...', roles: ['store-manager', 'director', 'coordinator'] },
    { value: 'request-search-site', label: 'Request Search (by Site)', placeholder: 'Search site name...', roles: ['store-manager', 'director', 'coordinator'] },
];

const mockBuildingUsage = [
  { building: 'Tower A', material: 'Cement', quantity: '100 bags', engineer: 'John Smith'},
  { building: 'Tower A', material: 'Sand', quantity: '20 cu.m.', engineer: 'John Smith'},
  { building: 'Tower B', material: 'Steel Rebar', quantity: '5 tons', engineer: 'Maria Garcia'},
];

const mockMonthUsage = [
    { month: 'July', material: 'Cement', quantity: '300 bags', site: 'North Site'},
    { month: 'July', material: 'Steel Rebar', quantity: '15 tons', site: 'North Site'},
    { month: 'June', material: 'Bricks', quantity: '5000 pcs', site: 'West Site'},
];


export default function DashboardSearch({ role }: { role: UserRole }) {
    const { toast } = useToast();
    const [searchCategory, setSearchCategory] = React.useState<string>('');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    const [searchTitle, setSearchTitle] = React.useState('');

    const availableCategories = React.useMemo(() => {
        return searchCategories.filter(cat => cat.roles.includes(role));
    }, [role]);

    React.useEffect(() => {
        if (availableCategories.length > 0) {
            setSearchCategory(availableCategories[0].value);
        }
    }, [availableCategories]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchCategory || !searchTerm) {
            toast({
                variant: 'destructive',
                title: 'Search Error',
                description: 'Please select a category and enter a search term.',
            });
            return;
        }

        // Mock search logic
        let results = [];
        let title = '';
        switch(searchCategory) {
            case 'engineer-usage':
                results = engineerUsage.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
                title = `Engineer-wise Usage for "${searchTerm}"`;
                break;
            case 'boq-usage-engineer':
                results = boqUsage.filter(u => u.item.toLowerCase().includes(searchTerm.toLowerCase()));
                title = `BOQ Item-wise Usage for "${searchTerm}"`;
                break;
            case 'building-usage':
                 results = mockBuildingUsage.filter(u => u.building.toLowerCase().includes(searchTerm.toLowerCase()));
                title = `Building-wise Usage for "${searchTerm}"`;
                break;
            case 'month-usage-site':
                results = mockMonthUsage.filter(u => u.month.toLowerCase().includes(searchTerm.toLowerCase()));
                title = `Month-wise Usage for "${searchTerm}"`;
                break;
            default:
                toast({ title: 'Not Implemented', description: 'This search category is not yet implemented.' });
                setSearchResults([]);
                setSearchTitle('Not Implemented');
                setIsDialogOpen(true);
                return;
        }
        
        setSearchResults(results);
        setSearchTitle(title);
        setIsDialogOpen(true);
    };

    const currentPlaceholder = searchCategories.find(c => c.value === searchCategory)?.placeholder || 'Search...';

    const renderResults = () => {
        if (searchResults.length === 0) {
            return <p>No results found for your query.</p>;
        }

        switch(searchCategory) {
            case 'engineer-usage':
                return (
                    <Table>
                        <TableHeader><TableRow><TableHead>Engineer</TableHead><TableHead>Materials</TableHead><TableHead>Site</TableHead></TableRow></TableHeader>
                        <TableBody>{searchResults.map((r, i) => <TableRow key={i}><TableCell>{r.name}</TableCell><TableCell>{r.materials}</TableCell><TableCell>{r.site}</TableCell></TableRow>)}</TableBody>
                    </Table>
                );
            case 'boq-usage-engineer':
                 return (
                    <Table>
                        <TableHeader><TableRow><TableHead>BOQ Item</TableHead><TableHead>Consumed</TableHead><TableHead>Budget</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>{searchResults.map((r, i) => <TableRow key={i}><TableCell>{r.item}</TableCell><TableCell>{r.consumed}</TableCell><TableCell>{r.budget}</TableCell><TableCell>{r.status}</TableCell></TableRow>)}</TableBody>
                    </Table>
                );
             case 'building-usage':
                 return (
                    <Table>
                        <TableHeader><TableRow><TableHead>Building</TableHead><TableHead>Material</TableHead><TableHead>Quantity</TableHead><TableHead>Engineer</TableHead></TableRow></TableHeader>
                        <TableBody>{searchResults.map((r, i) => <TableRow key={i}><TableCell>{r.building}</TableCell><TableCell>{r.material}</TableCell><TableCell>{r.quantity}</TableCell><TableCell>{r.engineer}</TableCell></TableRow>)}</TableBody>
                    </Table>
                );
            case 'month-usage-site':
                return (
                    <Table>
                        <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Material</TableHead><TableHead>Quantity</TableHead><TableHead>Site</TableHead></TableRow></TableHeader>
                        <TableBody>{searchResults.map((r, i) => <TableRow key={i}><TableCell>{r.month}</TableCell><TableCell>{r.material}</TableCell><TableCell>{r.quantity}</TableCell><TableCell>{r.site}</TableCell></TableRow>)}</TableBody>
                    </Table>
                );
            default:
                return <p>This search category is not yet implemented.</p>;
        }
    };


    return (
        <>
            <form onSubmit={handleSearch} className="relative w-full max-w-lg lg:max-w-md">
                <div className="flex w-full items-center">
                    <Select value={searchCategory} onValueChange={setSearchCategory}>
                        <SelectTrigger className="h-10 rounded-r-none border-r-0 focus:ring-0 w-48">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableCategories.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={currentPlaceholder}
                            className="pl-9 h-10 rounded-l-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </form>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{searchTitle}</DialogTitle>
                        <DialogDescription>
                            Showing results for your search query.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {renderResults()}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
