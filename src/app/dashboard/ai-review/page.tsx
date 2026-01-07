import AIReviewClient from "@/components/ai-review-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AIReviewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">AI Bill Review</h1>
      <Card>
        <CardHeader>
          <CardTitle>Automated Bill Verification</CardTitle>
          <CardDescription>
            Cross-check material bills against ledger entries to ensure accuracy and identify discrepancies using AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIReviewClient />
        </CardContent>
      </Card>
    </div>
  );
}
