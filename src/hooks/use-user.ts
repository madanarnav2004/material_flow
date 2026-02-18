"use client";

import { useState, useEffect } from 'react';

export type UserRole = 'director' | 'site-manager' | 'coordinator' | 'godown-manager' | 'purchase-department' | 'tender-department' | null;

export interface User {
  key: string;
  name: string;
  email: string;
  role: UserRole;
  site: string;
  profilePicture?: string;
  contactNumber?: string;
  siteLocation?: string;
}

const MOCK_USERS: Record<string, Omit<User, 'key'>> = {
  director: { name: 'Dr. Evelyn Reed', email: 'e.reed@materialflow.com', role: 'director', site: 'Global' },
  coordinator: { name: 'Aria Chen', email: 'a.chen@materialflow.com', role: 'coordinator', site: 'Global' },
  'purchase-department': { name: 'Samira Khan', email: 's.khan@materialflow.com', role: 'purchase-department', site: 'Global' },
  'godown-manager': { name: 'Leo Gomez', email: 'l.gomez@materialflow.com', role: 'godown-manager', site: 'MAPI Godown' },
  'tender-department': { name: 'Tender Department', email: 'tender@materialflow.com', role: 'tender-department', site: 'Global' },
  'site-manager-north': { name: 'North Site Manager', email: 'manager.north@materialflow.com', role: 'site-manager', site: 'North Site' },
  'site-manager-south': { name: 'South Site Manager', email: 'manager.south@materialflow.com', role: 'site-manager', site: 'South Site' },
  'site-manager-east': { name: 'East Site Manager', email: 'manager.east@materialflow.com', role: 'site-manager', site: 'East Site' },
  'site-manager-west': { name: 'West Site Manager', email: 'manager.west@materialflow.com', role: 'site-manager', site: 'West Site' },
};

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUser = (updatedUserData: User) => {
    setUser(updatedUserData);
    if (typeof window !== 'undefined') {
        localStorage.setItem(`user-${updatedUserData.key}`, JSON.stringify(updatedUserData));
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userKey = localStorage.getItem('userKey');
      
      if (userKey) {
        // Try to get updated user data from localStorage
        const storedUser = localStorage.getItem(`user-${userKey}`);
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Fallback to mock data if no updated data is found
          const mockUserData = MOCK_USERS[userKey];
          if (mockUserData) {
            const initialUser = { key: userKey, ...mockUserData };
            setUser(initialUser);
            // Also save this initial user data to storage
            localStorage.setItem(`user-${userKey}`, JSON.stringify(initialUser));
          }
        }
      } else {
        // Fallback for when no role is set, maybe direct to login later
        const defaultUserKey = 'director';
        const defaultUser = { key: defaultUserKey, ...MOCK_USERS[defaultUserKey] };
        setUser(defaultUser);
        localStorage.setItem('userKey', defaultUserKey);
        localStorage.setItem(`user-${defaultUserKey}`, JSON.stringify(defaultUser));
      }
      setIsLoading(false);
    }
  }, []);

  return { 
    user, 
    role: user?.role ?? null,
    site: user?.site ?? null,
    isLoading,
    updateUser 
  };
}
