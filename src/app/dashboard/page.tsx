"use client";

import { useUser } from "@/hooks/use-user";
import DirectorDashboard from "@/components/dashboards/director-dashboard";
import SiteManagerDashboard from "@/components/dashboards/site-manager-dashboard";
import CoordinatorDashboard from "@/components/dashboards/coordinator-dashboard";
import GodownManagerDashboard from "@/components/dashboards/godown-manager-dashboard";
import PurchaseDepartmentDashboard from "@/components/dashboards/purchase-department-dashboard";

export default function DashboardPage() {
  const { role } = useUser();

  const renderDashboard = () => {
    switch (role) {
      case 'director':
        return <DirectorDashboard />;
      case 'site-manager':
        return <SiteManagerDashboard />;
      case 'coordinator':
        return <CoordinatorDashboard />;
      case 'godown-manager':
        return <GodownManagerDashboard />;
      case 'purchase-department':
        return <PurchaseDepartmentDashboard />;
      default:
        return <div>Loading dashboard...</div>;
    }
  };

  return <div className="space-y-6">{renderDashboard()}</div>;
}
