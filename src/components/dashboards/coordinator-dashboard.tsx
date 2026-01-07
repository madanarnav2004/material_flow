import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CoordinatorDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coordinator Dashboard</CardTitle>
        <CardDescription>Monitor material usage and BOQ items across sites.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Cross-site material usage, BOQ tracking, and reports will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
