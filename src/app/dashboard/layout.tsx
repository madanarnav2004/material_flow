"use client";

import React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import DashboardNav from '@/components/dashboard/nav';
import DashboardHeader from '@/components/dashboard/header';
import { useUser } from '@/hooks/use-user';
import { MaterialProvider } from '@/context/material-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <MaterialProvider>
      <SidebarProvider>
        <Sidebar>
          <DashboardNav role={role} />
        </Sidebar>
        <SidebarInset>
          <DashboardHeader user={user} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </MaterialProvider>
  );
}
