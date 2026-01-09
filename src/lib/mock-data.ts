
export const monthlyConsumption = [
  { month: 'Jan', consumption: 0 },
  { month: 'Feb', consumption: 0 },
  { month: 'Mar', consumption: 0 },
  { month: 'Apr', consumption: 0 },
  { month: 'May', consumption: 0 },
  { month: 'Jun', consumption: 0 },
];

export const materialStock: {name: string, value: number}[] = [];

export const recentActivities: {id: string, type: string, site: string, status: string, date: string, details: string}[] = [];

export const allMaterials = [
    { id: 'mat-1', name: 'Cement', unit: 'bag', description: 'Portland cement, 50kg bag' },
    { id: 'mat-2', name: 'Steel Rebar', unit: 'ton', description: '12mm diameter steel reinforcement bars' },
    { id: 'mat-3', name: 'Sand', unit: 'cubic meter', description: 'Fine aggregate for concrete' },
    { id: 'mat-4', name: 'Bricks', unit: 'pcs', description: 'Standard clay bricks' },
    { id: 'mat-5', name: 'Gravel', unit: 'cubic meter', description: 'Coarse aggregate for concrete' },
    { id: 'mat-6', name: 'Paint', unit: 'liter', description: 'White emulsion paint' },
];

export const lowStockMaterials: {id: string, material: string, site: string, quantity: number, unit: string, threshold: number}[] = [];

export const pendingRequests: {id: string, material: string, quantity: string, site: string, status: 'Pending' | 'Partially Issued'}[] = [];

export const materialReturnReminders: {id: string, material: string, quantity: number, site: string, status: 'Pending' | 'Approved' | 'Issued' | 'Completed' | 'Extended', returnDate: string}[] = [];

export const issuedMaterialsForReceipt: {requestId: string, issuedId: string, materialName: string, issuedQuantity: number, issuingSite: string, receivingSite: string}[] = [];

const generateSiteConsumption = (materials: {name: string, unit: string}[], sites: string[]) => {
    return sites.map(site => ({
        site,
        materials: materials.map(mat => ({
            name: mat.name,
            quantity: 0,
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

export const detailedStock: {id: string, material: string, site: string, quantity: number, type: string, mismatch: boolean, expected?: number}[] = [];

export const stockUpdates: {id: string, material: string, site: string, change: string, date: string}[] = [];
