
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  PackageSearch, 
  Package, 
  PackageCheck, 
  FileText, 
  AreaChart, 
  BrainCircuit,
  Settings,
  Warehouse,
  Archive,
  Truck,
  Car,
  ShoppingCart,
  ClipboardCheck,
  FileUp,
  Layers,
  FileSpreadsheet,
  Upload,
  DollarSign,
} from 'lucide-react';

import { 
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator
} from '@/components/ui/sidebar';
import type { UserRole } from '@/hooks/use-user';

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: UserRole[];
};

const navItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', roles: ['director', 'site-manager', 'coordinator', 'godown-manager', 'purchase-department'] },
  { href: '/dashboard/inventory', icon: Archive, label: 'Inventory', roles: ['director', 'site-manager', 'coordinator', 'godown-manager', 'purchase-department'] },
  { href: '/dashboard/requests', icon: Package, label: 'Material Indents', roles: ['director', 'site-manager', 'coordinator', 'godown-manager', 'purchase-department'] },
  { href: '/dashboard/materials-issued', icon: Truck, label: 'Materials Issued', roles: ['director', 'site-manager', 'coordinator', 'godown-manager'] },
  { href: '/dashboard/receipts', icon: PackageCheck, label: 'Goods Received Note', roles: ['director', 'site-manager', 'godown-manager', 'coordinator', 'purchase-department'] },
  { href: '/dashboard/godown-actions', icon: Upload, label: 'Godown Actions', roles: ['godown-manager'] },
  { href: '/dashboard/vehicle-entry', icon: Car, label: 'Vehicle Entry', roles: ['site-manager'] },
  { href: '/dashboard/work-done-report', icon: ClipboardCheck, label: 'Work Done Report', roles: ['site-manager', 'coordinator', 'director'] },
  { href: '/dashboard/boq-management', icon: FileUp, label: 'BOQ Management', roles: ['coordinator', 'director'] },
  { href: '/dashboard/rate-fixing', icon: DollarSign, label: 'Rate Fixing', roles: ['director', 'coordinator', 'purchase-department'] },
  { href: '/dashboard/boq-analysis', icon: FileSpreadsheet, label: 'BOQ Analysis', roles: ['coordinator', 'director'] },
  { href: '/dashboard/reports', icon: AreaChart, label: 'Reports', roles: ['director', 'site-manager', 'coordinator', 'purchase-department'] },
  { href: '/dashboard/ai-review', icon: BrainCircuit, label: 'AI Bill Review', roles: ['director', 'coordinator', 'site-manager', 'godown-manager', 'purchase-department'] },
];

export default function DashboardNav({ role }: { role: UserRole }) {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Warehouse className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg font-headline">MaterialFlow</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.filter(item => item.roles.includes(role!)).map(item => (
            <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/settings'} tooltip="Settings">
              <Link href="/dashboard/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
