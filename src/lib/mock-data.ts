import { MaterialIndent, InventoryItem, MasterRateItem } from "@/context/material-context";

export const monthlyConsumption: any[] = [];

export const materialStock: any[] = [];

export const recentTransfers: any[] = [];

export const allMaterials: { id: string; name: string; unit: string; description: string; rate: number; }[] = [];

export const lowStockMaterials: any[] = [];

export const initialIndents: MaterialIndent[] = [];

export const issuedMaterialsForReceipt: any[] = [];

export const detailedMonthlyConsumption: any = {};

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

export const initialMaterialsRate: MasterRateItem[] = [
  { id: 'm1', name: 'Cement', unit: 'bags', rate: 10 },
  { id: 'm2', name: 'Steel Rebar', unit: 'tons', rate: 800 },
  { id: 'm3', name: 'Sand', unit: 'cu.m.', rate: 25 },
  { id: 'm4', name: 'Bricks', unit: 'pcs', rate: 0.5 },
];

export const initialEquipmentRate: MasterRateItem[] = [
  { id: 'e1', name: 'JCB Excavator', unit: 'hrs', rate: 60 },
  { id: 'e2', name: 'Concrete Mixer', unit: 'hrs', rate: 45 },
  { id: 'e3', name: 'Dumper Truck', unit: 'hrs', rate: 55 },
];

export const initialWorkersRate: MasterRateItem[] = [
  { id: 'w1', name: 'Mason', unit: 'day', rate: 30 },
  { id: 'w2', name: 'Electrician', unit: 'day', rate: 35 },
  { id: 'w3', name: 'Plumber', unit: 'day', rate: 35 },
];

export const initialHelpersRate: MasterRateItem[] = [
  { id: 'h1', name: 'General Helper', unit: 'day', rate: 20 },
];

export const mockBoqData = {
  descriptions: [
    { id: 1, name: 'Earthwork' },
    { id: 2, name: 'Concrete Work' },
    { id: 3, name: 'Brickwork' },
  ],
  items: [
    { id: 1, name: 'Excavation in soft soil' },
    { id: 2, name: 'PCC 1:4:8' },
    { id: 3, name: 'RCC M25' },
  ],
  materials: initialMaterialsRate,
  equipment: initialEquipmentRate,
  workforce: [...initialWorkersRate, ...initialHelpersRate],
};

export const detailedBoqAnalysis: any[] = [
  { site: 'North Site', item: 'Excavation', boqQty: 1000, boqRate: 15 },
  { site: 'North Site', item: 'Concrete', boqQty: 500, boqRate: 120 },
  { site: 'South Site', item: 'Excavation', boqQty: 1200, boqRate: 15 },
  { site: 'West Site', item: 'Plastering', boqQty: 2000, boqRate: 8 },
  { site: 'East Site', item: 'Flooring', boqQty: 1500, boqRate: 25 },
];

export const liveInventory: InventoryItem[] = [
  { id: '1', site: 'North Site', material: 'Cement', classification: 'Consumable', quantity: 450, unit: 'bags', minQty: 100, maxQty: 1000 },
  { id: '2', site: 'South Site', material: 'Steel Rebar', classification: 'Asset', ownership: 'Own', quantity: 15, unit: 'tons', minQty: 5, maxQty: 50 },
  { id: '3', site: 'MAPI Godown', material: 'Cement', classification: 'Consumable', quantity: 2000, unit: 'bags', minQty: 500, maxQty: 10000 },
  { id: '4', site: 'MAPI Godown', material: 'Generator 50kVA', classification: 'Asset', ownership: 'Own', quantity: 2, unit: 'units', minQty: 1, maxQty: 5 },
];
