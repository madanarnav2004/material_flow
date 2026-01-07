import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StoreManagerDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>MAPI Store Manager Dashboard</CardTitle>
        <CardDescription>Manage materials at the central store.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Overall inventory levels, site-wise quantities, and low stock alerts will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
