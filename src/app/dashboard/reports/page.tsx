import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";

const reports = [
  {
    title: "Material Shifting Report",
    description: "Tracks material movement between sites and overall organizational shifts.",
    variants: ["Site-wise", "Organization-wise"],
  },
  {
    title: "Material Stock Report",
    description: "Current inventory levels across different locations.",
    variants: ["Site-wise", "Store-wise", "Organization-wise"],
  },
  {
    title: "BOQ Item-wise Material Issued",
    description: "Details on materials issued against Bill of Quantities items.",
    variants: [],
  },
  {
    title: "Site-wise BOQ Report",
    description: "Consumption and budget tracking per site based on BOQ.",
    variants: [],
  },
  {
    title: "Material Received Report",
    description: "Confirmation of materials received at various locations.",
    variants: ["Site-wise", "Organization-wise"],
  },
  {
    title: "Material Request Register",
    description: "A complete log of all material requests.",
    variants: [],
  },
  {
    title: "Request vs. Received Comparison",
    description: "Analysis of discrepancies between requested and received quantities.",
    variants: [],
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Generate Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Generate detailed reports for audit and analysis. Download in Excel format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {reports.map((report) => (
            <Card key={report.title} className="shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    {report.title}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {report.variants.length > 0 ? (
                  report.variants.map((variant) => (
                    <Button key={variant} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download {variant}
                    </Button>
                  ))
                ) : (
                  <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
