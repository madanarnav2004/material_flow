"use client";

import { useState, useEffect } from 'react';

export type UserRole = 'director' | 'site-manager' | 'coordinator' | 'store-manager' | null;

const MOCK_USERS = {
  director: { name: 'Dr. Evelyn Reed', email: 'e.reed@materialflow.com' },
  'site-manager': { name: 'Marcus Kane', email: 'm.kane@materialflow.com' },
  coordinator: { name: 'Aria Chen', email: 'a.chen@materialflow.com' },
  'store-manager': { name: 'Leo Gomez', email: 'l.gomez@materialflow.com' },
};

export function useUser() {
  const [role, setRole] = useState<UserRole>(null);
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as UserRole;
    if (storedRole && MOCK_USERS[storedRole]) {
      setRole(storedRole);
      setUser(MOCK_USERS[storedRole]);
    } else {
      // Fallback for when no role is set, maybe direct to login
      const defaultRole = 'director';
      setRole(defaultRole);
      setUser(MOCK_USERS[defaultRole]);
      localStorage.setItem('userRole', defaultRole);
    }
    setIsLoading(false);
  }, []);

  return { role, user, isLoading };
}
