import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RequestsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Requests</CardTitle>
        <CardDescription>Submit new material requests and track existing ones.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>A form for new requests and a table of current requests will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
