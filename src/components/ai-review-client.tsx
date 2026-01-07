"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { reviewBill, type ReviewBillOutput } from "@/ai/flows/bill-review-ai";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Loader, AlertTriangle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  billDetails: z.string().min(20, "Please provide detailed bill information."),
  ledgerEntries: z.string().min(20, "Please provide relevant ledger entries."),
});

export default function AIReviewClient() {
  const [result, setResult] = useState<ReviewBillOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billDetails: "Bill #INV-123\n- Cement: 50 bags @ $10/bag = $500\n- Steel Rebar: 100m @ $5/m = $500\nTotal: $1000",
      ledgerEntries: "Ledger:\n- PO-001: Request for 50 bags of cement.\n- GRN-001: Received 50 bags of cement.\n- PO-002: Request for 90m of steel rebar.\n- GRN-002: Received 90m of steel rebar.",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await reviewBill(values);
      setResult(response);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while reviewing the bill. Please try again.",
      });
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="billDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Bill Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste the material bill details here, including items, quantities, and costs..."
                      className="min-h-[200px] font-code"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ledgerEntries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Ledger Entries</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste related ledger entries here, such as material requests, receipts, and invoices..."
                      className="min-h-[200px] font-code"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Reviewing...
              </>
            ) : (
              "Review Bill"
            )}
          </Button>
        </form>
      </Form>

      {result && (
        <div className="space-y-6 rounded-lg border bg-card p-6 shadow-md">
          <h3 className="text-xl font-semibold font-headline">Review Result</h3>
          <div>
            <Alert 
              variant={result.isAccurate ? "default" : "destructive"} 
              className={result.isAccurate ? "border-[hsl(var(--chart-2)_/_0.5)] bg-[hsl(var(--chart-2)_/_0.1)] text-[hsl(var(--chart-2))] dark:border-[hsl(var(--chart-2))] dark:bg-[hsl(var(--chart-2)_/_0.2)]" : ""}
            >
                {result.isAccurate ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--chart-2))]" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle className="font-bold">{result.isAccurate ? "Bill is Accurate" : "Bill is Inaccurate"}</AlertTitle>
                <AlertDescription className={result.isAccurate ? "text-[hsl(var(--chart-2))] dark:text-[hsl(var(--chart-2))]" : ""}>
                {result.isAccurate ? "No discrepancies found between the bill and ledger entries." : "Discrepancies were found. See details below."}
                </AlertDescription>
            </Alert>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold">Summary</h4>
            <p className="text-muted-foreground">{result.summary}</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold">Discrepancies</h4>
            <p className="text-muted-foreground whitespace-pre-wrap font-code text-sm">{result.discrepancies || "None."}</p>
          </div>
        </div>
      )}
    </div>
  );
}
