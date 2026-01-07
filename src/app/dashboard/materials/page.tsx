import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaterialsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Materials</CardTitle>
        <CardDescription>Track material availability across all sites and MAPI store.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>A searchable and filterable table of all materials will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
