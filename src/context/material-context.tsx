'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
    initialIndents, 
    issuedMaterialsForReceipt as initialIssuedMaterials,
    liveInventory as initialInventory,
    initialMaterialsRate,
    initialEquipmentRate,
    initialWorkersRate,
    initialHelpersRate
} from '@/lib/mock-data';

export type IndentStatus = 
  | 'Pending Director Approval' 
  | 'Director Approved' 
  | 'Director Rejected' 
  | 'Issued' 
  | 'Purchase Rejected'
  | 'PO Generated'
  | 'Completed' 
  | 'Mismatch' 
  | 'Extended' 
  | 'Partially Issued';

export interface MaterialItem {
    materialName: string;
    unit: string;
    quantity: number;
    remarks?: string;
    rate?: number;
}
  
export interface MaterialIndent {
  id: string;
  requesterName: string;
  requestingSite: string;
  materials: MaterialItem[];
  requiredPeriod: {
    from: string;
    to: string;
  };
  remarks?: string;
  status: IndentStatus;
  requestDate: string;
  poDate?: string;
  vendorName?: string;
  vendorContact?: string;
  billNumber?: string;
  issuingSite?: string;
  issuedId?: string;
}

export interface IssuedMaterial {
    requestId: string;
    issuedId: string;
    materialName: string;
    issuedQuantity: number;
    issuingSite: string;
    receivingSite: string;
    unit: string;
    rate: number;
    vehicleNumber?: string;
    dispatchDetails?: string;
    driverName?: string;
}

export interface MasterRateItem {
  id: string;
  name: string;
  unit: string;
  rate: number;
}

export interface BOQItem {
  id: string;
  categoryNo: string;
  itemNo: string;
  itemOfWork: string;
  subItemOfWork: string;
  boqQty: number;
  unit: string;
  boqRate: number;
  materialTypes?: string;
  equipment?: string;
  source?: string;
  workforce?: string;
  skillsAndRates?: string;
  site?: string;
}

export interface InventoryItem {
  id: string;
  site: string;
  material: string;
  classification: 'Asset' | 'Consumable';
  ownership?: 'Own' | 'Rent';
  vendorName?: string;
  quantity: number;
  unit: string;
  minQty: number;
  maxQty: number;
}

export interface InventoryUploadRecord {
  id: string;
  filename: string;
  uploadedBy: string;
  timestamp: string;
  site: string;
  itemsCount: number;
}

export type ReceiptStatus = 'Accepted' | 'Mismatch' | 'Completed';

export interface MaterialReceivedBill {
  issuedId: string;
  receiverName: string;
  requestId: string;
  issuingSite: string;
  receivingSite: string;
  materialName: string;
  issuedQuantity: number;
  receivedQuantity: number;
  isDamaged: boolean;
  damageDescription?: string;
  remarks?: string;
  receivedDate: string;
  rate?: number;
  eWayBillNumber?: string;
  eWayBillDate?: string;
  vehicleNumber?: string;
  gstin?: string;
  receivedBillId: string;
  receiver: { name: string; } | null;
  status: ReceiptStatus;
  invoiceNumber?: string;
}

export interface WorkDoneEntry {
  id: string;
  descriptionOfWork: string;
  categoryNo: string;
  itemNo: string;
  itemOfWork: string;
  subItemOfWork: string;
  quantityOfWork: number;
  unit: string;
  materialName?: string;
  materialQty?: number;
  equipmentSource?: 'Owned' | 'Rented';
  equipmentName?: string;
  equipmentUsage?: number;
  workerType?: string;
  workerCount?: number;
  workerHours?: number;
  workerOT?: number;
  helperCount?: number;
  helperHours?: number;
  helperOT?: number;
  totalCost: number;
}

export interface WorkDoneReport {
  id: string;
  siteName: string;
  reportDate: string;
  entries: WorkDoneEntry[];
  totalReportCost: number;
}

export interface SiteIssueItem {
  materialName: string;
  quantity: number;
  unit: string;
  returnable: boolean;
  remarks?: string;
}

export interface SiteIssueVoucher {
  voucherId: string;
  siteName: string;
  issueDate: string;
  issuedTo: string;
  buildingName: string;
  issueType: 'Local' | 'Shifting';
  receivingSite?: string;
  materials: SiteIssueItem[];
}

export type MISStatus = 'Generated' | 'Issued';

export interface MaterialIssueSlip {
  slipNumber: string;
  siteName: string;
  date: string;
  materialName: string;
  quantity: number;
  unit: string;
  isReturnable: boolean;
  requestedBy: string;
  issuedBy: string;
  remarks?: string;
  status: MISStatus;
}

function getFromLocalStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        if (item === null) {
            setInLocalStorage(key, defaultValue);
            return defaultValue;
        }
        return JSON.parse(item);
    } catch (error) {
        console.error(`Error reading from localStorage for key "${key}":`, error);
        return defaultValue;
    }
}

function setInLocalStorage<T>(key: string, value: T) {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage for key "${key}":`, error);
    }
}

interface MaterialContextType {
  requests: MaterialIndent[];
  setRequests: React.Dispatch<React.SetStateAction<MaterialIndent[]>>;
  issuedMaterials: IssuedMaterial[];
  setIssuedMaterials: React.Dispatch<React.SetStateAction<IssuedMaterial[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  receipts: MaterialReceivedBill[];
  setReceipts: React.Dispatch<React.SetStateAction<MaterialReceivedBill[]>>;
  workDoneReports: WorkDoneReport[];
  setWorkDoneReports: React.Dispatch<React.SetStateAction<WorkDoneReport[]>>;
  siteIssues: SiteIssueVoucher[];
  setSiteIssues: React.Dispatch<React.SetStateAction<SiteIssueVoucher[]>>;
  issueSlips: MaterialIssueSlip[];
  setIssueSlips: React.Dispatch<React.SetStateAction<MaterialIssueSlip[]>>;
  inventoryUploads: InventoryUploadRecord[];
  setInventoryUploads: React.Dispatch<React.SetStateAction<InventoryUploadRecord[]>>;
  materialsRate: MasterRateItem[];
  setMaterialsRate: React.Dispatch<React.SetStateAction<MasterRateItem[]>>;
  equipmentRate: MasterRateItem[];
  setEquipmentRate: React.Dispatch<React.SetStateAction<MasterRateItem[]>>;
  workersRate: MasterRateItem[];
  setWorkersRate: React.Dispatch<React.SetStateAction<MasterRateItem[]>>;
  helpersRate: MasterRateItem[];
  setHelpersRate: React.Dispatch<React.SetStateAction<MasterRateItem[]>>;
  boqItems: BOQItem[];
  setBoqItems: React.Dispatch<React.SetStateAction<BOQItem[]>>;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

const STORAGE_KEY_VERSION = 'v16-work-report-workflow-audit';

export const MaterialProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<MaterialIndent[]>(() => getFromLocalStorage(`mf-requests-${STORAGE_KEY_VERSION}`, initialIndents));
  const [issuedMaterials, setIssuedMaterials] = useState<IssuedMaterial[]>(() => getFromLocalStorage(`mf-issued-${STORAGE_KEY_VERSION}`, initialIssuedMaterials));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getFromLocalStorage(`mf-inventory-${STORAGE_KEY_VERSION}`, initialInventory));
  const [receipts, setReceipts] = useState<MaterialReceivedBill[]>(() => getFromLocalStorage(`mf-receipts-${STORAGE_KEY_VERSION}`, []));
  const [workDoneReports, setWorkDoneReports] = useState<WorkDoneReport[]>(() => getFromLocalStorage(`mf-work-done-reports-${STORAGE_KEY_VERSION}`, []));
  const [siteIssues, setSiteIssues] = useState<SiteIssueVoucher[]>(() => getFromLocalStorage(`mf-site-issues-${STORAGE_KEY_VERSION}`, []));
  const [issueSlips, setIssueSlips] = useState<MaterialIssueSlip[]>(() => getFromLocalStorage(`mf-issue-slips-${STORAGE_KEY_VERSION}`, []));
  const [inventoryUploads, setInventoryUploads] = useState<InventoryUploadRecord[]>(() => getFromLocalStorage(`mf-inv-uploads-${STORAGE_KEY_VERSION}`, []));
  const [materialsRate, setMaterialsRate] = useState<MasterRateItem[]>(() => getFromLocalStorage(`mf-mat-rates-${STORAGE_KEY_VERSION}`, initialMaterialsRate));
  const [equipmentRate, setEquipmentRate] = useState<MasterRateItem[]>(() => getFromLocalStorage(`mf-eq-rates-${STORAGE_KEY_VERSION}`, initialEquipmentRate));
  const [workersRate, setWorkersRate] = useState<MasterRateItem[]>(() => getFromLocalStorage(`mf-worker-rates-${STORAGE_KEY_VERSION}`, initialWorkersRate));
  const [helpersRate, setHelpersRate] = useState<MasterRateItem[]>(() => getFromLocalStorage(`mf-helper-rates-${STORAGE_KEY_VERSION}`, initialHelpersRate));
  const [boqItems, setBoqItems] = useState<BOQItem[]>(() => getFromLocalStorage(`mf-boq-items-${STORAGE_KEY_VERSION}`, []));

  useEffect(() => { setInLocalStorage(`mf-requests-${STORAGE_KEY_VERSION}`, requests) }, [requests]);
  useEffect(() => { setInLocalStorage(`mf-issued-${STORAGE_KEY_VERSION}`, issuedMaterials) }, [issuedMaterials]);
  useEffect(() => { setInLocalStorage(`mf-inventory-${STORAGE_KEY_VERSION}`, inventory) }, [inventory]);
  useEffect(() => { setInLocalStorage(`mf-receipts-${STORAGE_KEY_VERSION}`, receipts) }, [receipts]);
  useEffect(() => { setInLocalStorage(`mf-work-done-reports-${STORAGE_KEY_VERSION}`, workDoneReports) }, [workDoneReports]);
  useEffect(() => { setInLocalStorage(`mf-site-issues-${STORAGE_KEY_VERSION}`, siteIssues) }, [siteIssues]);
  useEffect(() => { setInLocalStorage(`mf-issue-slips-${STORAGE_KEY_VERSION}`, issueSlips) }, [issueSlips]);
  useEffect(() => { setInLocalStorage(`mf-inv-uploads-${STORAGE_KEY_VERSION}`, inventoryUploads) }, [inventoryUploads]);
  useEffect(() => { setInLocalStorage(`mf-mat-rates-${STORAGE_KEY_VERSION}`, materialsRate) }, [materialsRate]);
  useEffect(() => { setInLocalStorage(`mf-eq-rates-${STORAGE_KEY_VERSION}`, equipmentRate) }, [equipmentRate]);
  useEffect(() => { setInLocalStorage(`mf-worker-rates-${STORAGE_KEY_VERSION}`, workersRate) }, [workersRate]);
  useEffect(() => { setInLocalStorage(`mf-helper-rates-${STORAGE_KEY_VERSION}`, helpersRate) }, [helpersRate]);
  useEffect(() => { setInLocalStorage(`mf-boq-items-${STORAGE_KEY_VERSION}`, boqItems) }, [boqItems]);

  return (
    <MaterialContext.Provider value={{ 
      requests, setRequests, 
      issuedMaterials, setIssuedMaterials, 
      inventory, setInventory, 
      receipts, setReceipts, 
      workDoneReports, setWorkDoneReports, 
      siteIssues, setSiteIssues, 
      issueSlips, setIssueSlips, 
      inventoryUploads, setInventoryUploads,
      materialsRate, setMaterialsRate,
      equipmentRate, setEquipmentRate,
      workersRate, setWorkersRate,
      helpersRate, setHelpersRate,
      boqItems, setBoqItems
    }}>
      {children}
    </MaterialContext.Provider>
  );
};

export const useMaterialContext = () => {
  const context = useContext(MaterialContext);
  if (context === undefined) {
    throw new Error('useMaterialContext must be used within a MaterialProvider');
  }
  return context;
};
