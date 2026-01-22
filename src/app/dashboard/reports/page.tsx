
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, ChevronDown } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const reports = [
  {
    title: "Material Shifting Report",
    description: "Tracks material movement between sites and overall organizational shifts.",
    variants: ["Site-wise", "Organization-wise"],
  },
  {
    title: "Returnable Material Report",
    description: "Details on materials that are returnable to the godown or another site.",
    variants: ["Site-wise", "Organization-wise", "Godown-wise"],
  },
  {
    title: "Material Stock Report",
    description: "Current inventory levels across different locations.",
    variants: ["Site-wise", "Store-wise", "Organization-wise"],
  },
  {
    title: "BOQ Item-wise Material Issued",
    description: "Details on materials issued against Bill of Quantities items, including cost.",
    variants: [],
    hasSiteDropdown: true,
  },
  {
    title: "Site-wise BOQ Report",
    description: "Consumption and budget tracking per site based on BOQ (includes quantity, rate, amount).",
    variants: [],
    hasSiteDropdown: true,
  },
  {
    title: "Goods Received Note (GRN) Report",
    description: "Confirmation of materials received at various locations.",
    variants: ["Site-wise", "Organization-wise"],
  },
  {
    title: "Material Indent Register",
    description: "A complete log of all material indents.",
    variants: ["Site-wise", "Organization-wise"],
  },
  {
    title: "Indent vs. GRN Comparison",
    description: "Analysis of discrepancies between requested and received quantities.",
    variants: [],
  },
];

const sitesList = ["North Site", "South Site", "West Site", "East Site", "MAPI Godown"];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Generate Reports</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Standard Reports</CardTitle>
          <CardDescription>Generate detailed reports for audit and analysis. Download in Excel format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {reports.map((report: any) => (
            <Card key={report.title} className="shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    {report.title}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {report.hasSiteDropdown ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Download Site-wise Report
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Select a Site</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {sitesList.map((site) => (
                        <DropdownMenuItem key={site}>
                          Download for {site}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : report.variants.length > 0 ? (
                  report.variants.map((variant: string) => {
                    if (variant === 'Site-wise') {
                      return (
                        <DropdownMenu key={variant}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                              <Download className="mr-2 h-4 w-4" />
                              Download {variant}
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Select a Site</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {sitesList.map((site) => (
                              <DropdownMenuItem key={site}>
                                Download for {site}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    }
                    return (
                      <Button key={variant} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download {variant}
                      </Button>
                    );
                  })
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
