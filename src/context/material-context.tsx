
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
    materialReturnReminders as initialRequests, 
    issuedMaterialsForReceipt as initialIssuedMaterials,
    liveInventory as initialInventory,
    pendingRequests as initialPendingRequests
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


// Helper function to get item from localStorage
function getFromLocalStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
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
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

export const MaterialProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<MaterialIndent[]>(() => getFromLocalStorage('materialflow-requests', initialRequests));
  const [issuedMaterials, setIssuedMaterials] = useState<IssuedMaterial[]>(() => getFromLocalStorage('materialflow-issued', initialIssuedMaterials));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getFromLocalStorage('materialflow-inventory', initialInventory));
  const [receipts, setReceipts] = useState<MaterialReceivedBill[]>(() => getFromLocalStorage('materialflow-receipts', []));

  useEffect(() => { setInLocalStorage('materialflow-requests', requests) }, [requests]);
  useEffect(() => { setInLocalStorage('materialflow-issued', issuedMaterials) }, [issuedMaterials]);
  useEffect(() => { setInLocalStorage('materialflow-inventory', inventory) }, [inventory]);
  useEffect(() => { setInLocalStorage('materialflow-receipts', receipts) }, [receipts]);

  // This is a one-time setup to merge initial pending requests into the main requests list if it hasn't been done.
  useEffect(() => {
    const isSetupDone = getFromLocalStorage('materialflow-setup-done', false);
    if (!isSetupDone) {
      
      setRequests(currentRequests => {
        const existingIds = new Set(currentRequests.map(r => r.id));
        const newRequests = (initialPendingRequests as any[])
          .filter(pr => !existingIds.has(pr.id))
          .map(pr => ({
            ...pr,
            status: 'Pending Director Approval' as const,
            returnDate: '2024-09-30', // Mock return date
            quantity: Number(pr.quantity) || 0,
          }));
        const combined = [...currentRequests, ...newRequests];
        setInLocalStorage('materialflow-requests', combined); // Make sure it's saved
        return combined;
      });

      setInLocalStorage('materialflow-setup-done', true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MaterialContext.Provider value={{ requests, setRequests, issuedMaterials, setIssuedMaterials, inventory, setInventory, receipts, setReceipts }}>
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
