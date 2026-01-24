

export const monthlyConsumption = [
  { month: 'Jan', consumption: 186 },
  { month: 'Feb', consumption: 305 },
  { month: 'Mar', consumption: 237 },
  { month: 'Apr', consumption: 273 },
  { month: 'May', consumption: 209 },
  { month: 'Jun', consumption: 412 },
];

export const materialStock = [
    { name: 'Cement', value: 400, unit: 'bags' },
    { name: 'Steel', value: 300, unit: 'tons' },
    { name: 'Sand', value: 500, unit: 'cu.m.' },
    { name: 'Bricks', value: 200, unit: 'pcs' },
    { name: 'Gravel', value: 100, unit: 'cu.m.' },
];

export const recentActivities = [
    { id: '1', type: 'Indent', site: 'North Site', status: 'Approved', date: '2024-07-20', details: '500 Bags of Cement' },
    { id: '2', type: 'Issue', site: 'MAPI Godown', status: 'In Transit', date: '2024-07-20', details: '500 Bags of Cement to North Site' },
    { id: '3', type: 'GRN', site: 'North Site', status: 'Completed', date: '2024-07-19', details: '10 tons of Steel' },
    { id: '4', type: 'Invoice', site: 'Purchase Dept', status: 'Uploaded', date: '2024-07-18', details: 'Invoice for 10 tons of Steel' },
    { id: '5', type: 'Indent', site: 'West Site', status: 'Pending', date: '2024-07-17', details: '2000 Bricks' },
];

export const allMaterials = [
    { id: 'mat-1', name: 'Cement', unit: 'bag', description: 'Portland cement, 50kg bag', rate: 10 },
    { id: 'mat-2', name: 'Steel Rebar', unit: 'ton', description: '12mm diameter steel reinforcement bars', rate: 800 },
    { id: 'mat-3', name: 'Sand', unit: 'cubic meter', description: 'Fine aggregate for concrete', rate: 25 },
    { id: 'mat-4', name: 'Bricks', unit: 'pcs', description: 'Standard clay bricks', rate: 0.5 },
    { id: 'mat-5', name: 'Gravel', unit: 'cubic meter', description: 'Coarse aggregate for concrete', rate: 30 },
    { id: 'mat-6', name: 'Paint', unit: 'liter', description: 'White emulsion paint', rate: 5 },
];

export const lowStockMaterials = [
    { id: 'ls-1', material: 'Gravel', site: 'North Site', quantity: 5, unit: 'cu.m.', threshold: 10 },
    { id: 'ls-2', material: 'Paint', site: 'MAPI Godown', quantity: 20, unit: 'liters', threshold: 50 },
    { id: 'ls-3', material: 'Bricks', site: 'West Site', quantity: 900, unit: 'pcs', threshold: 1000 },
];

export const pendingRequests = [
    { id: 'REQ-WEST-20240721-004', material: 'Bricks', quantity: 2000, site: 'West Site' },
    { id: 'REQ-SOUTH-20240720-003', material: 'Sand', quantity: 50, site: 'South Site' },
];

export const materialReturnReminders = [
    { id: 'REQ-NORTH-20240720-001', material: 'Cement', quantity: 500, site: 'North Site', status: 'Issued' as const, returnDate: '2024-08-15', issuingSite: 'MAPI Godown' },
    { id: 'REQ-EAST-20240718-002', material: 'Steel Rebar', quantity: 10, site: 'East Site', status: 'Completed' as const, returnDate: '2024-08-10', issuingSite: 'MAPI Godown' },
    { id: 'REQ-WEST-20240721-004', material: 'Bricks', quantity: 2000, site: 'West Site', status: 'Pending Director Approval' as const, returnDate: '2024-08-20' },
    { id: 'REQ-SOUTH-20240720-003', material: 'Sand', quantity: 50, site: 'South Site', status: 'Director Approved' as const, returnDate: '2024-08-18' },
    { id: 'REQ-NORTH-20240722-005', material: 'Specialized Adhesive', quantity: 25, site: 'North Site', status: 'Director Approved' as const, returnDate: '2024-08-25' },
];

export const issuedMaterialsForReceipt = [
    { requestId: 'REQ-NORTH-20240720-001', issuedId: 'ISS-NORTH-20240720-001', materialName: 'Cement', issuedQuantity: 500, issuingSite: 'MAPI Godown', receivingSite: 'North Site', unit: 'bags', rate: 10 },
    { requestId: 'REQ-EAST-20240718-002', issuedId: 'ISS-EAST-20240718-002', materialName: 'Steel Rebar', issuedQuantity: 10, issuingSite: 'MAPI Godown', receivingSite: 'East Site', unit: 'tons', rate: 800 },
];

const generateSiteConsumption = (materials: {name: string, unit: string}[], sites: string[]) => {
    return sites.map(site => ({
        site,
        materials: materials.map(mat => ({
            name: mat.name,
            quantity: Math.floor(Math.random() * 500),
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
    { id: 'ds-1', material: 'Cement', site: 'North Site', quantity: 480, type: 'Site Stock', mismatch: false },
    { id: 'ds-2', material: 'Cement', site: 'MAPI Godown', quantity: 1500, type: 'Central Godown', mismatch: false },
    { id: 'ds-3', material: 'Steel Rebar', site: 'North Site', quantity: 9, type: 'Site Stock', mismatch: true, expected: 10 },
    { id: 'ds-4', material: 'Gravel', site: 'North Site', quantity: 5, type: 'Site Stock', mismatch: false },
    { id: 'ds-5', material: 'Bricks', site: 'West Site', quantity: 5000, type: 'Site Stock', mismatch: false },
    { id: 'ds-6', material: 'Bricks', site: 'MAPI Godown', quantity: 10000, type: 'Central Godown', mismatch: false },
    { id: 'ds-7', material: 'Sand', site: 'South Site', quantity: 120, type: 'Site Stock', mismatch: false },
];

export const stockUpdates = [
    { id: 'su-1', material: 'Cement', site: 'North Site', change: '+500 bags', date: '2024-07-20' },
    { id: 'su-2', material: 'Cement', site: 'North Site', change: '-20 bags', date: '2024-07-21' },
    { id: 'su-3', material: 'Steel Rebar', site: 'MAPI Godown', change: '-10 tons', date: '2024-07-18' },
    { id: 'su-4', material: 'Steel Rebar', site: 'East Site', change: '+10 tons', date: '2024-07-19' },
    { id: 'su-5', material: 'Bricks', site: 'Purchase', change: '+5000 pcs', date: '2024-07-17' },
];

export const boqUsage = [
    { item: 'Concrete Works', consumed: 450, budget: 1000, status: 'Within Budget' },
    { item: 'Excavation', consumed: 120, budget: 100, status: 'Over Budget' },
    { item: 'Brickwork', consumed: 800, budget: 2000, status: 'Within Budget' },
    { item: 'Finishing', consumed: 50, budget: 500, status: 'Within Budget' },
];

export const engineerUsage = [
    { name: 'John Smith', materials: 'Cement, Sand', site: 'North Site' },
    { name: 'Maria Garcia', materials: 'Steel Rebar', site: 'East Site' },
    { name: 'Chen Wei', materials: 'Bricks, Gravel', site: 'West Site' },
];

export const siteStock = [
  { id: 'ss-1', name: 'Cement', quantity: '480 bags', status: 'In Stock' },
  { id: 'ss-2', name: 'Steel Rebar', quantity: '9 tons', status: 'In Stock' },
  { id: 'ss-3', name: 'Gravel', quantity: '5 cu.m.', status: 'Low Stock' },
];

export const recentSiteActivity = [
    { id: 'sa-1', type: 'GRN', details: '500 Bags of Cement', from: 'MAPI Godown', site: 'North Site', status: 'Completed', date: '2024-07-20' },
    { id: 'sa-2', type: 'Indent', details: '100 cu.m. Sand', to: 'MAPI Godown', site: 'North Site', status: 'Pending', date: '2024-07-21' },
    { id: 'sa-3', type: 'Internal Issue', details: '20 bags Cement', to: 'Block A', site: 'North Site', status: 'Completed', date: '2024-07-21' },
];

export const pendingSiteRequests = [
    { id: 'psr-1', material: 'Sand', quantity: '100 cu.m.', requestedFrom: 'MAPI Godown', site: 'North Site'},
];

export const lowStockSite = [
    { id: 'lss-1', material: 'Gravel', quantity: 5, unit: 'cu.m.', threshold: 10 },
];


export const storeInventory = [
    { id: 'si-1', name: 'Cement', quantity: '1500 bags', siteDistribution: 'North, South' },
    { id: 'si-2', name: 'Steel Rebar', quantity: '80 tons', siteDistribution: 'East, West' },
    { id: 'si-3', name: 'Sand', quantity: '300 cu.m.', siteDistribution: 'North, West' },
    { id: 'si-4', name: 'Paint', quantity: '20 liters', siteDistribution: 'South' },
];

export const recentStoreActivity = [
    { id: 'rsa-1', type: 'Issue', details: '500 Bags Cement', site: 'North Site', status: 'Completed', date: '2024-07-20' },
    { id: 'rsa-2', type: 'GRN', details: '100 tons Steel', site: 'Vendor A', status: 'Accepted', date: '2024-07-19' },
    { id: 'rsa-3', type: 'Indent', details: '2000 Bricks', site: 'West Site', status: 'Pending', date: '2024-07-21' },
    { id: 'rsa-4', type: 'Transfer In', details: '10 cu.m. Gravel', site: 'West Site', status: 'Completed', date: '2024-07-18' },
];

export const detailedMaterialValue = [
    { id: 'dmv-1', name: 'Cement', site: 'North Site', quantity: 480, unit: 'bags', rate: 10 },
    { id: 'dmv-2', name: 'Cement', site: 'MAPI Godown', quantity: 1500, unit: 'bags', rate: 9.5 },
    { id: 'dmv-3', name: 'Steel Rebar', site: 'East Site', quantity: 10, unit: 'tons', rate: 800 },
    { id: 'dmv-4', name: 'Steel Rebar', site: 'MAPI Godown', quantity: 80, unit: 'tons', rate: 790 },
    { id: 'dmv-5', name: 'Sand', site: 'MAPI Godown', quantity: 300, unit: 'cu.m.', rate: 20 },
    { id: 'dmv-6', name: 'Gravel', site: 'North Site', quantity: 5, unit: 'cu.m.', rate: 22 },
];

// Mock Data for Work Done Report BOQ
export const mockBoqData = {
  descriptions: [
    { description: 'Excavation', categoryNumber: 'CAT-01' },
    { description: 'Concrete Work', categoryNumber: 'CAT-02' },
    { description: 'Brickwork', categoryNumber: 'CAT-03' },
  ],
  items: [
    { description: 'Excavation', item: 'Foundation', itemNumber: 'ITM-001' },
    { description: 'Concrete Work', item: 'Columns', itemNumber: 'ITM-002' },
    { description: 'Concrete Work', item: 'Slab', itemNumber: 'ITM-003' },
    { description: 'Brickwork', item: 'Internal Walls', itemNumber: 'ITM-004' },
  ],
  materials: [
      { type: 'Cement', unit: 'bags', rate: 10 },
      { type: 'Sand', unit: 'cu.m.', rate: 25 },
      { type: 'Steel Rebar', unit: 'tons', rate: 800 },
      { type: 'Bricks', unit: 'pcs', rate: 0.5 },
  ],
  equipment: [
      { source: 'Owned', name: 'JCB', unit: 'hours', rate: 50 },
      { source: 'Hired', name: 'Crane', unit: 'hours', rate: 150 },
  ],
  workforce: [
      { skill: 'Mason', designation: 'Skilled', rate: 30 },
      { skill: 'Helper', designation: 'Unskilled', rate: 15 },
  ]
};

export const detailedBoqAnalysis = [
  {
    site: 'North Site',
    item: 'Concrete Works',
    boqQty: 1000,
    boqRate: 150,
    actualMaterialQty: 950,
    actualMaterialRate: 155,
    actualManpower: [
      { designation: 'Masons', count: 12 },
      { designation: 'Helpers', count: 8 }
    ],
    actualManpowerHours: 160,
    actualManpowerOtHours: 20,
    actualManpowerCost: 5200,
    actualEquipmentName: 'Concrete Mixer',
    actualEquipmentHours: 16,
    actualEquipmentOtHours: 2,
    actualEquipmentCost: 800,
  },
  {
    site: 'North Site',
    item: 'Excavation',
    boqQty: 100,
    boqRate: 50,
    actualMaterialQty: 120,
    actualMaterialRate: 52,
    actualManpower: [
      { designation: 'Operators', count: 2 },
      { designation: 'Laborers', count: 3 }
    ],
    actualManpowerHours: 40,
    actualManpowerOtHours: 10,
    actualManpowerCost: 1500,
    actualEquipmentName: 'JCB',
    actualEquipmentHours: 40,
    actualEquipmentOtHours: 5,
    actualEquipmentCost: 2000,
  },
  {
    site: 'South Site',
    item: 'Brickwork',
    boqQty: 2000,
    boqRate: 20,
    actualMaterialQty: 1800,
    actualMaterialRate: 18,
    actualManpower: [
      { designation: 'Masons', count: 8 },
      { designation: 'Helpers', count: 7 }
    ],
    actualManpowerHours: 120,
    actualManpowerOtHours: 0,
    actualManpowerCost: 3600,
    actualEquipmentName: 'Scaffolding',
    actualEquipmentHours: 120,
    actualEquipmentOtHours: 0,
    actualEquipmentCost: 600,
  },
  {
    site: 'South Site',
    item: 'Finishing',
    boqQty: 500,
    boqRate: 100,
    actualMaterialQty: 500,
    actualMaterialRate: 95,
    actualManpower: [
      { designation: 'Painters', count: 4 },
      { designation: 'Assistants', count: 6 }
    ],
    actualManpowerHours: 80,
    actualManpowerOtHours: 15,
    actualManpowerCost: 4000,
    actualEquipmentName: 'Paint Sprayer',
    actualEquipmentHours: 30,
    actualEquipmentOtHours: 4,
    actualEquipmentCost: 300,
  },
   {
    site: 'West Site',
    item: 'Concrete Works',
    boqQty: 1200,
    boqRate: 140,
    actualMaterialQty: 1300,
    actualMaterialRate: 145,
    actualManpower: [
      { designation: 'Masons', count: 15 },
      { designation: 'Helpers', count: 10 }
    ],
    actualManpowerHours: 200,
    actualManpowerOtHours: 40,
    actualManpowerCost: 8000,
    actualEquipmentName: 'Concrete Mixer',
    actualEquipmentHours: 20,
    actualEquipmentOtHours: 5,
    actualEquipmentCost: 1000,
  },
  {
    site: 'East Site',
    item: 'Brickwork',
    boqQty: 2500,
    boqRate: 22,
    actualMaterialQty: 2400,
    actualMaterialRate: 22,
    actualManpower: [
      { designation: 'Masons', count: 12 },
      { designation: 'Helpers', count: 8 }
    ],
    actualManpowerHours: 160,
    actualManpowerOtHours: 10,
    actualManpowerCost: 4800,
    actualEquipmentName: 'Scaffolding',
    actualEquipmentHours: 160,
    actualEquipmentOtHours: 0,
    actualEquipmentCost: 800,
  },
];


export const liveInventory = [
  { id: 'inv-1', site: 'North Site', material: 'Cement', classification: 'Consumable' as const, quantity: 480, unit: 'bags', minQty: 100, maxQty: 1000 },
  { id: 'inv-2', site: 'North Site', material: 'Steel Rebar', classification: 'Asset' as const, ownership: 'Own' as const, quantity: 9, unit: 'tons', minQty: 5, maxQty: 20 },
  { id: 'inv-3', site: 'North Site', material: 'Gravel', classification: 'Consumable' as const, quantity: 5, unit: 'cu.m.', minQty: 10, maxQty: 50 },
  { id: 'inv-4', site: 'West Site', material: 'Bricks', classification: 'Consumable' as const, quantity: 5000, unit: 'pcs', minQty: 2000, maxQty: 10000 },
  { id: 'inv-5', site: 'South Site', material: 'Sand', classification: 'Consumable' as const, quantity: 120, unit: 'cu.m.', minQty: 50, maxQty: 200 },
  { id: 'inv-6', site: 'MAPI Godown', material: 'Cement', classification: 'Consumable' as const, quantity: 1500, unit: 'bags', minQty: 500, maxQty: 3000 },
  { id: 'inv-7', site: 'MAPI Godown', material: 'Bricks', classification: 'Consumable' as const, quantity: 10000, unit: 'pcs', minQty: 5000, maxQty: 20000 },
  { id: 'inv-8', site: 'MAPI Godown', material: 'Paint', classification: 'Consumable' as const, quantity: 20, unit: 'liters', minQty: 50, maxQty: 200 },
  { id: 'inv-9', site: 'MAPI Godown', material: 'Steel Rebar', classification: 'Asset' as const, ownership: 'Own' as const, quantity: 80, unit: 'tons', minQty: 20, maxQty: 100 },
  { id: 'inv-10', site: 'North Site', material: 'JCB', classification: 'Asset' as const, ownership: 'Rent' as const, vendorName: 'Reliable Rentals Co.', quantity: 1, unit: 'unit', minQty: 1, maxQty: 1 },
];
