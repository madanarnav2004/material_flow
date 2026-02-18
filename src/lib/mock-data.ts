import { MaterialIndent } from "@/context/material-context";

export const monthlyConsumption = [
  { month: 'Jan', consumption: 186 },
  { month: 'Feb', consumption: 305 },
  { month: 'Mar', consumption: 237 },
  { month: 'Apr', consumption: 273 },
  { month: 'May', consumption: 209 },
  { month: 'Jun', consumption: 412 },
];

export const materialStock: any[] = [];

export const recentTransfers: any[] = [];

export const allMaterials = [
    { id: 'mat-1', name: 'Cement', unit: 'bag', description: 'Portland cement, 50kg bag', rate: 10 },
    { id: 'mat-2', name: 'Steel Rebar', unit: 'ton', description: '12mm diameter steel reinforcement bars', rate: 800 },
    { id: 'mat-3', name: 'Sand', unit: 'cubic meter', description: 'Fine aggregate for concrete', rate: 25 },
    { id: 'mat-4', name: 'Bricks', unit: 'pcs', description: 'Standard clay bricks', rate: 0.5 },
    { id: 'mat-5', name: 'Gravel', unit: 'liter', description: 'Coarse aggregate for concrete', rate: 30 },
    { id: 'mat-6', name: 'Paint', unit: 'liter', description: 'White emulsion paint', rate: 5 },
    { id: 'mat-7', name: 'Specialized Adhesive', unit: 'kg', description: 'High-strength construction adhesive', rate: 15 },
];

export const lowStockMaterials: any[] = [];

export const initialIndents: MaterialIndent[] = [];

export const issuedMaterialsForReceipt: any[] = [];

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

export const detailedStock: any[] = [];

export const stockUpdates: any[] = [];

export const boqUsage: any[] = [];

export const engineerUsage: any[] = [];

export const siteStock: any[] = [];

export const recentSiteActivity: any[] = [];

export const pendingSiteRequests: any[] = [];

export const lowStockSite: any[] = [];


export const storeInventory: any[] = [];

export const recentStoreActivity: any[] = [];

export const detailedMaterialValue: any[] = [];

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
  materials: allMaterials.map(m => ({type: m.name, unit: m.unit, rate: m.rate})),
  equipment: [
      { source: 'Owned', name: 'JCB', unit: 'hours', rate: 50 },
      { source: 'Hired', name: 'Crane', unit: 'hours', rate: 150 },
  ],
  workforce: [
      { skill: 'Mason', designation: 'Skilled', rate: 30 },
      { skill: 'Helper', designation: 'Unskilled', rate: 15 },
  ]
};

export const detailedBoqAnalysis: any[] = [];


export const liveInventory: any[] = [];
