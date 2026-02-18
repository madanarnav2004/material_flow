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

export interface MaterialIndent {
  id: string;
  material: string;
  quantity: number;
  site: string;
  status: IndentStatus;
  returnDate: string;
  issuingSite?: string;
  poDate?: string;
  vendorName?: string;
  vendorContact?: string;
  billNumber?: string;
}

interface IssuedMaterial {
    requestId: string;
    issuedId: string;
    materialName: string;
    issuedQuantity: number;
    issuingSite: string;
    receivingSite: string;
    unit: string;
    rate: number;
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
  // from FromSiteFormValues
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
  receivedDate: Date;
  rate?: number;
  // added properties
  receivedBillId: string;
  receiver: { name: string; } | null;
  status: ReceiptStatus;
}

export interface WorkDoneReport {
  siteName: string;
  reportDate: string; // Storing as string for easier serialization
  itemOfWork: string;
  quantityOfWork: number;
  totalCost: number;
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
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

export const MaterialProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<MaterialIndent[]>(() => getFromLocalStorage('materialflow-requests', initialIndents));
  const [issuedMaterials, setIssuedMaterials] = useState<IssuedMaterial[]>(() => getFromLocalStorage('materialflow-issued', initialIssuedMaterials));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getFromLocalStorage('materialflow-inventory', initialInventory));
  const [receipts, setReceipts] = useState<MaterialReceivedBill[]>(() => getFromLocalStorage('materialflow-receipts', []));
  const [workDoneReports, setWorkDoneReports] = useState<WorkDoneReport[]>(() => getFromLocalStorage('materialflow-work-done-reports', []));

  useEffect(() => { setInLocalStorage('materialflow-requests', requests) }, [requests]);
  useEffect(() => { setInLocalStorage('materialflow-issued', issuedMaterials) }, [issuedMaterials]);
  useEffect(() => { setInLocalStorage('materialflow-inventory', inventory) }, [inventory]);
  useEffect(() => { setInLocalStorage('materialflow-receipts', receipts) }, [receipts]);
  useEffect(() => { setInLocalStorage('materialflow-work-done-reports', workDoneReports) }, [workDoneReports]);


  return (
    <MaterialContext.Provider value={{ requests, setRequests, issuedMaterials, setIssuedMaterials, inventory, setInventory, receipts, setReceipts, workDoneReports, setWorkDoneReports }}>
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
