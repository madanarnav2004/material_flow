import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SiteManagerDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Manager Dashboard</CardTitle>
        <CardDescription>Manage materials for your project site.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Site-specific stats, material levels, and actions will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
