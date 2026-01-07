import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReceiptsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Receipts</CardTitle>
        <CardDescription>Accept material deliveries and verify quantities.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>A form for logging new receipts and a table of past receipts will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
