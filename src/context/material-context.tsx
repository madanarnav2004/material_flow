
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
    materialReturnReminders as initialRequests, 
    pendingRequests as initialPendingRequests,
    issuedMaterialsForReceipt as initialIssuedMaterials,
    lowStockMaterials as initialLowStockMaterials
} from '@/lib/mock-data';

type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Issued' | 'Completed' | 'Mismatch' | 'Extended' | 'Partially Issued';

interface MaterialRequest {
  id: string;
  material: string;
  quantity: number;
  site: string;
  status: RequestStatus;
  returnDate: string;
}

interface PendingRequest {
  id: string;
  material: string;
  quantity: string | number;
  site: string;
  status?: RequestStatus;
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
  requests: MaterialRequest[];
  setRequests: React.Dispatch<React.SetStateAction<MaterialRequest[]>>;
  pendingRequests: PendingRequest[];
  setPendingRequests: React.Dispatch<React.SetStateAction<PendingRequest[]>>;
  issuedMaterials: IssuedMaterial[];
  setIssuedMaterials: React.Dispatch<React.SetStateAction<IssuedMaterial[]>>;
  lowStockMaterials: LowStockMaterial[];
  setLowStockMaterials: React.Dispatch<React.SetStateAction<LowStockMaterial[]>>;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

export const MaterialProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<MaterialRequest[]>(initialRequests);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(
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
