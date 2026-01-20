'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
    materialReturnReminders as initialRequests, 
    pendingRequests as initialPendingRequests,
    issuedMaterialsForReceipt as initialIssuedMaterials,
    lowStockMaterials as initialLowStockMaterials,
    liveInventory as initialInventory,
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
}

interface PendingIndent {
  id: string;
  material: string;
  quantity: string | number;
  site: string;
  status?: IndentStatus;
}


interface IssuedMaterial {
    requestId: string;
    issuedId: string;
    materialName: string;
    issuedQuantity: number;
    issuingSite: string;
    receivingSite: string;
}

interface LowStockMaterial {
    id: string;
    material: string;
    site: string;
    quantity: number;
    unit: string;
    threshold: number;
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


interface MaterialContextType {
  requests: MaterialIndent[];
  setRequests: React.Dispatch<React.SetStateAction<MaterialIndent[]>>;
  pendingRequests: PendingIndent[];
  setPendingRequests: React.Dispatch<React.SetStateAction<PendingIndent[]>>;
  issuedMaterials: IssuedMaterial[];
  setIssuedMaterials: React.Dispatch<React.SetStateAction<IssuedMaterial[]>>;
  lowStockMaterials: LowStockMaterial[];
  setLowStockMaterials: React.Dispatch<React.SetStateAction<LowStockMaterial[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

export const MaterialProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<MaterialIndent[]>(initialRequests);
  const [pendingRequests, setPendingRequests] = useState<PendingIndent[]>(
    initialPendingRequests.map(pr => ({...pr, status: 'Pending Director Approval'}))
  );
  const [issuedMaterials, setIssuedMaterials] = useState<IssuedMaterial[]>(initialIssuedMaterials);
  const [lowStockMaterials, setLowStockMaterials] = useState<LowStockMaterial[]>(initialLowStockMaterials);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);


  return (
    <MaterialContext.Provider value={{ requests, setRequests, pendingRequests, setPendingRequests, issuedMaterials, setIssuedMaterials, lowStockMaterials, setLowStockMaterials, inventory, setInventory }}>
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
