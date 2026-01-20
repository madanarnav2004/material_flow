"use client";

import { useState, useEffect } from 'react';

export type UserRole = 'director' | 'site-manager' | 'coordinator' | 'godown-manager' | 'purchase-department' | null;

const MOCK_USERS = {
  director: { name: 'Dr. Evelyn Reed', email: 'e.reed@materialflow.com' },
  'site-manager': { name: 'Site Manager', email: 'manager@materialflow.com' }, // Generic
  coordinator: { name: 'Aria Chen', email: 'a.chen@materialflow.com' },
  'godown-manager': { name: 'Leo Gomez', email: 'l.gomez@materialflow.com' },
  'purchase-department': { name: 'Samira Khan', email: 's.khan@materialflow.com' },
};

export function useUser() {
  const [role, setRole] = useState<UserRole>(null);
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [site, setSite] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as UserRole;
    const storedSite = localStorage.getItem('userSite');
    
    setSite(storedSite);
    if (storedRole && MOCK_USERS[storedRole]) {
      setRole(storedRole);
      let currentUser = MOCK_USERS[storedRole];
      if (storedRole === 'site-manager' && storedSite && storedSite !== 'Global') {
        // Create a site-specific user object
        currentUser = {
          name: `${storedSite} Manager`,
          email: `${storedSite.toLowerCase().replace(/\s/g,'.')}@materialflow.com`,
        };
      }
      setUser(currentUser);
    } else {
      // Fallback for when no role is set, maybe direct to login
      const defaultRole = 'director';
      setRole(defaultRole);
      setUser(MOCK_USERS[defaultRole]);
      localStorage.setItem('userRole', defaultRole);
    }
    setIsLoading(false);
  }, []);

  return { role, user, site, isLoading };
}
