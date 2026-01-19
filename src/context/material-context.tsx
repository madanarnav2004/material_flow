
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
    materialReturnReminders as initialRequests, 
    pendingRequests as initialPendingRequests,
    issuedMaterialsForReceipt as initialIssuedMaterials,
    lowStockMaterials as initialLowStockMaterials
} from '@/lib/mock-data';

export type IndentStatus = 'Pending' | 'Approved' | 'Rejected' | 'Issued' | 'Completed' | 'Mismatch' | 'Extended' | 'Partially Issued';

export interface MaterialIndent {
  id: string;
  material: string;
  quantity: number;
  site: string;
  status: IndentStatus;
  returnDate: string;
  issuingSite?: string;
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


interface MaterialContextType {
  requests: MaterialIndent[];
  setRequests: React.Dispatch<React.SetStateAction<MaterialIndent[]>>;
  pendingRequests: PendingIndent[];
  setPendingRequests: React.Dispatch<React.SetStateAction<PendingIndent[]>>;
  issuedMaterials: IssuedMaterial[];
  setIssuedMaterials: React.Dispatch<React.SetStateAction<IssuedMaterial[]>>;
  lowStockMaterials: LowStockMaterial[];
  setLowStockMaterials: React.Dispatch<React.SetStateAction<LowStockMaterial[]>>;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

export const MaterialProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<MaterialIndent[]>(initialRequests);
  const [pendingRequests, setPendingRequests] = useState<PendingIndent[]>(
    initialPendingRequests.map(pr => ({...pr, status: 'Pending'}))
  );
  const [issuedMaterials, setIssuedMaterials] = useState<IssuedMaterial[]>(initialIssuedMaterials);
  const [lowStockMaterials, setLowStockMaterials] = useState<LowStockMaterial[]>(initialLowStockMaterials);


  return (
    <MaterialContext.Provider value={{ requests, setRequests, pendingRequests, setPendingRequests, issuedMaterials, setIssuedMaterials, lowStockMaterials, setLowStockMaterials }}>
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
