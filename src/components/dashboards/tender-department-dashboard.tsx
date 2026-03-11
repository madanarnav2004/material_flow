'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  FilePlus,
  Download,
  BarChart as BarChartIcon,
  Ruler,
  FileText,
  Settings,
  PlusCircle,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function TenderDepartmentDashboard() {
  const router = useRouter();
  const { toast } = useToast();

  const handleDownloadReport = (type: string) => {
    toast({
      title: 'Exporting Data',
      description: `Generating your ${type} report...`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline">Tender Department Hub</h1>
        <p className="text-muted-foreground">AutoCAD Drawing Analysis & BOQ Generation</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tender Tools"
          value="Open Suite"
          icon={Layers}
          description="2D/3D Conversion & Takeoff"
          className="border-primary/50"
          onClick={() => router.push('/dashboard/tender-tools')}
        />
        <StatCard
          title="Active Tenders"
          value="12"
          icon={FilePlus}
          description="Under evaluation"
        />
        <StatCard
          title="Quantity Takeoff"
          value="Auto Extract"
          icon={Ruler}
          description="From AutoCAD drawings"
          onClick={() => router.push('/dashboard/tender-tools')}
        />
        <StatCard
          title="BOQ Architect"
          value="Generate"
          icon={FileText}
          description="Create structured BOQs"
          onClick={() => router.push('/dashboard/tender-tools')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tender Preparation Suite</CardTitle>
            <CardDescription>Specialized estimation modules</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/tender-tools')}>
              <Layers className="h-6 w-6 text-primary" />
              <span>AutoCAD 2D to 3D</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" onClick={() => router.push('/dashboard/tender-tools')}>
              <PlusCircle className="h-6 w-6 text-primary" />
              <span>BOQ Generator</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" disabled>
              <BarChartIcon className="h-6 w-6 text-muted-foreground" />
              <span>Bid Comparison (Coming Soon)</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-2" disabled>
              <Settings className="h-6 w-6 text-muted-foreground" />
              <span>Tender Settings</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Estimation Exports
            </CardTitle>
            <CardDescription>Download bid documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('BOQ')}>
              Current BOQ Export <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Measurement')}>
              Quantity Takeoff Sheet <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleDownloadReport('Historical')}>
              Archived Drawings Log <Download className="h-4 w-4" />
            </Button>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center gap-3">
              <BarChartIcon className="h-5 w-5" />
              <span className="text-sm font-bold">152 Archived drawing entries</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
