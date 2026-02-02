'use client';

import { Layers, FilePlus, Download, BarChart as BarChartIcon } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function TenderDepartmentDashboard() {
    const router = useRouter();

    return (
        <>
            <h1 className="text-3xl font-bold font-headline">Tender Department Dashboard</h1>
            <div className="grid gap-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="AutoCAD & BOQ Tools"
                        value="Open Tools"
                        icon={Layers}
                        description="2D/3D Conversion, Measurements & BOQ"
                        className="border-primary/50"
                        onClick={() => router.push('/dashboard/tender-tools')}
                    />
                    <StatCard
                        title="Active Tenders"
                        value="12"
                        icon={FilePlus}
                        description="Currently under evaluation"
                    />
                    <StatCard
                        title="Submitted Bids"
                        value="5"
                        icon={BarChartIcon}
                        description="In the last quarter"
                    />
                    <StatCard
                        title="Archived Drawings"
                        value="152"
                        icon={Download}
                        description="Total drawings in archive"
                    />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to the Tender Department Dashboard</CardTitle>
                        <CardDescription>
                            Use this dashboard to access specialized tools for tender preparation, including AutoCAD drawing analysis, BOQ generation, and estimation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Click on the "Open Tools" card above or the "Tender Tools" link in the sidebar to get started.</p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
