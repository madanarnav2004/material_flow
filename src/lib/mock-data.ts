export const monthlyConsumption = [
  { month: 'Jan', consumption: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Feb', consumption: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Mar', consumption: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Apr', consumption: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'May', consumption: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Jun', consumption: Math.floor(Math.random() * 5000) + 1000 },
];

export const materialStock = [
    { name: 'Cement', value: 400 },
    { name: 'Steel', value: 300 },
    { name: 'Sand', value: 300 },
    { name: 'Bricks', value: 200 },
    { name: 'Gravel', value: 278 },
    { name: 'Paint', value: 189 },
];

export const recentActivities = [
    { id: 'REQ-001', type: 'Request', site: 'North Site', status: 'Pending', date: '2 days ago', details: '50 bags Cement' },
    { id: 'REC-001', type: 'Receipt', site: 'MAPI Store', status: 'Completed', date: '3 days ago', details: '10 tons Steel' },
    { id: 'REQ-002', type: 'Request', site: 'South Site', status: 'Approved', date: '4 days ago', details: '2000 pcs Bricks' },
    { id: 'INV-001', type: 'Invoice', site: 'West Site', status: 'Uploaded', date: '5 days ago', details: 'INV-2024-001' },
    { id: 'SHIFT-001', type: 'Shift', site: 'North to South', status: 'In Transit', date: '6 days ago', details: '10 bags Cement' },
];

export const allMaterials = [
    { id: 'mat-1', name: 'Cement', unit: 'bag', description: 'Portland cement, 50kg bag' },
    { id: 'mat-2', name: 'Steel Rebar', unit: 'ton', description: '12mm diameter steel reinforcement bars' },
    { id: 'mat-3', name: 'Sand', unit: 'cubic meter', description: 'Fine aggregate for concrete' },
    { id: 'mat-4', name: 'Bricks', unit: 'pcs', description: 'Standard clay bricks' },
    { id: 'mat-5', name: 'Gravel', unit: 'cubic meter', description: 'Coarse aggregate for concrete' },
    { id: 'mat-6', name: 'Paint', unit: 'liter', description: 'White emulsion paint' },
];

export const lowStockMaterials = [
    { id: 'ls-1', material: 'Steel Rebar', site: 'North Site', quantity: 5, unit: 'tons', threshold: 10 },
    { id: 'ls-2', material: 'Paint', site: 'West Site', quantity: 20, unit: 'liters', threshold: 50 },
    { id: 'ls-3', material: 'Cement', site: 'MAPI Store', quantity: 45, unit: 'bags', threshold: 100 },
];

export const pendingRequests = [
    { id: 'pr-1', material: 'Cement', quantity: '100 bags', site: 'North Site', status: 'Pending' },
    { id: 'pr-2', material: 'Bricks', quantity: '5000 pcs', site: 'South Site', status: 'Partially Issued' },
    { id: 'pr-3', material: 'Sand', quantity: '20 m³', site: 'West Site', status: 'Pending' },
];

export const materialReturnReminders = [
    { id: 'REQ-005', material: 'Cement', quantity: 50, site: 'North Site', status: 'Pending', returnDate: '2024-08-15' },
    { id: 'REQ-004', material: 'Steel Rebar', quantity: 10, site: 'South Site', status: 'Approved', returnDate: '2024-08-10' },
    { id: 'REQ-003', material: 'Bricks', quantity: 2000, site: 'West Site', status: 'Issued', returnDate: '2024-08-05' },
    { id: 'REQ-002', material: 'Sand', quantity: 15, site: 'North Site', status: 'Completed', returnDate: '2024-07-25' },
    { id: 'REQ-001', material: 'Gravel', quantity: 5, site: 'South Site', status: 'Extended', returnDate: '2024-07-20 (Ext. 07-27)' },
];

export const issuedMaterialsForReceipt = [
    { 
        requestId: 'REQ-NORT-20240810-004',
        issuedId: 'ISS-NORT-20240810-004',
        materialName: 'Steel Rebar', 
        issuedQuantity: 10, 
        issuingSite: 'South Site',
        receivingSite: 'North Site',
    },
    {
        requestId: 'REQ-NORT-20240801-001',
        issuedId: 'ISS-NORT-20240801-001',
        materialName: 'Cement', 
        issuedQuantity: 50, 
        issuingSite: 'MAPI Store',
        receivingSite: 'North Site',
    },
    {
        requestId: 'REQ-WEST-20240803-002',
        issuedId: 'ISS-WEST-20240803-002',
        materialName: 'Bricks', 
        issuedQuantity: 2000, 
        issuingSite: 'MAPI Store',
        receivingSite: 'West Site',
    }
];

const generateSiteConsumption = (materials: {name: string, unit: string}[], sites: string[]) => {
    return sites.map(site => ({
        site,
        materials: materials.map(mat => ({
            name: mat.name,
            quantity: Math.floor(Math.random() * 200) + 10,
            unit: mat.unit,
        })).filter(() => Math.random() > 0.3) // Randomly include materials
    }));
};

const aggregateOrganizationConsumption = (siteWiseData: {site: string; materials: {name: string; quantity: number; unit: string}[]}[]) => {
    const orgMap = new Map<string, { quantity: number; unit: string }>();
    siteWiseData.forEach(site => {
        site.materials.forEach(mat => {
            if (orgMap.has(mat.name)) {
                const existing = orgMap.get(mat.name)!;
                existing.quantity += mat.quantity;
            } else {
                orgMap.set(mat.name, { quantity: mat.quantity, unit: mat.unit });
            }
        });
    });
    return Array.from(orgMap.entries()).map(([name, data]) => ({ name, ...data }));
};

const sites = ['North Site', 'South Site', 'West Site', 'East Site'];
const materialTypes = allMaterials.map(m => ({name: m.name, unit: m.unit}));

const generateMonthlyDetailedData = (months: string[]) => {
    const data: Record<string, any> = {};
    months.forEach(month => {
        const siteWise = generateSiteConsumption(materialTypes, sites);
        const organizationWise = aggregateOrganizationConsumption(siteWise);
        data[month] = { organizationWise, siteWise };
    });
    return data;
};

export const detailedMonthlyConsumption = generateMonthlyDetailedData(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']);

export const detailedStock = [
  { id: 'ds1', material: 'Cement', site: 'North Site', quantity: 100, type: 'Received', mismatch: false },
  { id: 'ds2', material: 'Cement', site: 'South Site', quantity: 50, type: 'Transferred', mismatch: false },
  { id: 'ds3', material: 'Steel Rebar', site: 'North Site', quantity: 20, type: 'Received', mismatch: true, expected: 25 },
  { id: 'ds4', material: 'Bricks', site: 'West Site', quantity: 4800, type: 'Received', mismatch: true, expected: 5000 },
  { id: 'ds5', material: 'Sand', site: 'MAPI Store', quantity: 200, type: 'Received', mismatch: false },
  { id: 'ds6', material: 'Sand', site: 'North Site', quantity: 30, type: 'Transferred', mismatch: false },
];

export const stockUpdates = [
    { id: 'su1', material: 'Cement', site: 'North Site', change: '+100 bags', date: '1 day ago' },
    { id: 'su2', material: 'Steel Rebar', site: 'North Site', change: '-5 tons', date: '1 day ago' },
    { id: 'su3', material: 'Bricks', site: 'West Site', change: '+5000 pcs', date: '2 days ago' },
    { id: 'su4', material: 'Sand', site: 'MAPI Store', change: '+200 m³', date: '3 days ago' },
    { id: 'su5', material: 'Cement', site: 'South Site', change: '-50 bags', date: '4 days ago' },
];
