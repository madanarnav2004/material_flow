import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>Generate detailed reports for audit and analysis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Select parameters and generate reports on material consumption, costs, and more.</p>
        <Button>
            <Download className="mr-2 h-4 w-4" />
            Download Excel Report
        </Button>
      </CardContent>
    </Card>
  );
}
