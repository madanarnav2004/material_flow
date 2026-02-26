'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
    initialIndents, 
    issuedMaterialsForReceipt as initialIssuedMaterials,
    liveInventory as initialInventory
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
  // Related to PO
  poDate?: string;
  vendorName?: string;
  vendorContact?: string;
  billNumber?: string;
  // Related to Issue
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

export type ReceiptStatus = 'Accepted' | 'Mismatch' | 'Completed';

export interface MaterialReceivedBill {
  // from FromSiteFormValues / FromShopFormValues
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
  // E-Way Bill details
  eWayBillNumber?: string;
  eWayBillDate?: string;
  vehicleNumber?: string;
  gstin?: string;
  // added properties
  receivedBillId: string;
  receiver: { name: string; } | null;
  status: ReceiptStatus;
  invoiceNumber?: string;
}

export interface WorkDoneReport {
  siteName: string;
  reportDate: string; // Storing as string for easier serialization
  itemOfWork: string;
  quantityOfWork: number;
  totalCost: number;
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
  materials: SiteIssueItem[];
}


// Helper function to get item from localStorage
function getFromLocalStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        // If the item doesn't exist, initialize it with the default value.
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

// Helper function to set item in localStorage
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
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

const STORAGE_KEY_VERSION = 'v5-verified-workflow';

export const MaterialProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<MaterialIndent[]>(() => getFromLocalStorage(`materialflow-requests-${STORAGE_KEY_VERSION}`, initialIndents));
  const [issuedMaterials, setIssuedMaterials] = useState<IssuedMaterial[]>(() => getFromLocalStorage(`materialflow-issued-${STORAGE_KEY_VERSION}`, initialIssuedMaterials));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getFromLocalStorage(`materialflow-inventory-${STORAGE_KEY_VERSION}`, initialInventory));
  const [receipts, setReceipts] = useState<MaterialReceivedBill[]>(() => getFromLocalStorage(`materialflow-receipts-${STORAGE_KEY_VERSION}`, []));
  const [workDoneReports, setWorkDoneReports] = useState<WorkDoneReport[]>(() => getFromLocalStorage(`materialflow-work-done-reports-${STORAGE_KEY_VERSION}`, []));
  const [siteIssues, setSiteIssues] = useState<SiteIssueVoucher[]>(() => getFromLocalStorage(`materialflow-site-issues-${STORAGE_KEY_VERSION}`, []));

  useEffect(() => { setInLocalStorage(`materialflow-requests-${STORAGE_KEY_VERSION}`, requests) }, [requests]);
  useEffect(() => { setInLocalStorage(`materialflow-issued-${STORAGE_KEY_VERSION}`, issuedMaterials) }, [issuedMaterials]);
  useEffect(() => { setInLocalStorage(`materialflow-inventory-${STORAGE_KEY_VERSION}`, inventory) }, [inventory]);
  useEffect(() => { setInLocalStorage(`materialflow-receipts-${STORAGE_KEY_VERSION}`, receipts) }, [receipts]);
  useEffect(() => { setInLocalStorage(`materialflow-work-done-reports-${STORAGE_KEY_VERSION}`, workDoneReports) }, [workDoneReports]);
  useEffect(() => { setInLocalStorage(`materialflow-site-issues-${STORAGE_KEY_VERSION}`, siteIssues) }, [siteIssues]);


  return (
    <MaterialContext.Provider value={{ requests, setRequests, issuedMaterials, setIssuedMaterials, inventory, setInventory, receipts, setReceipts, workDoneReports, setWorkDoneReports, siteIssues, setSiteIssues }}>
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