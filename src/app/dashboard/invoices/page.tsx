import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvoicesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>Upload and manage material invoices.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>An invoice upload form and a list of previously uploaded invoices will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
