import { MaterialIndent, InventoryItem } from "@/context/material-context";

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

export const mockBoqData = {
  descriptions: [],
  items: [],
  materials: [],
  equipment: [],
  workforce: [],
};

export const detailedBoqAnalysis: any[] = [];

export const liveInventory: InventoryItem[] = [];
