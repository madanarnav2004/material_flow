'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { VehicleBillValues } from '@/app/dashboard/vehicle-entry/page';
import { cn } from '@/lib/utils';

interface BillComparisonProps {
  bill: VehicleBillValues;
}

// Dummy rate for calculation
const MOCK_RATES = {
  generalRate: 60,
  otRate: 90,
};

export default function BillComparison({ bill }: BillComparisonProps) {
  if (!bill) return null;

  const calculatedBaseAmount = (bill.dailyWorkingHours * MOCK_RATES.generalRate) + ((bill.otHours || 0) * MOCK_RATES.otRate);
  const calculatedGst = calculatedBaseAmount * ((bill.gstPercentage || 0) / 100);
  const calculatedTotal = calculatedBaseAmount + calculatedGst;

  const vendorTotal = bill.totalInvoiceAmount || 0;
  const discrepancy = calculatedTotal - vendorTotal;

  const discrepancyStatus = Math.abs(discrepancy) < 0.01 ? 'match' : discrepancy > 0 ? 'over-billed' : 'under-billed';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill Comparison</CardTitle>
        <CardDescription>Compare the site-generated bill with the vendor's invoice.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Site Generated Bill */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Site-Generated Bill</h3>
            <div className="p-4 border rounded-lg space-y-2">
                <p><strong>Bill ID:</strong> {bill.billId}</p>
                <p><strong>Total Hours:</strong> {bill.totalWorkingHours} hrs ({bill.dailyWorkingHours} gen + {bill.otHours || 0} OT)</p>
                <Separator />
                <div className="flex justify-between">
                    <span>Calculated Total:</span>
                    <span className="font-bold text-xl">${calculatedTotal.toFixed(2)}</span>
                </div>
            </div>
          </div>
          {/* Vendor Invoice */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Vendor Invoice</h3>
            <div className="p-4 border rounded-lg space-y-2">
                <p><strong>Invoice #:</strong> {bill.invoiceNumber || 'N/A'}</p>
                <p><strong>Total Hours:</strong> {bill.totalWorkingHoursRent || 'N/A'} hrs</p>
                <Separator />
                <div className="flex justify-between">
                    <span>Invoice Total:</span>
                    <span className="font-bold text-xl">${vendorTotal.toFixed(2)}</span>
                </div>
            </div>
          </div>
        </div>

        <Separator />

        <div>
            <h3 className="font-semibold text-lg mb-2">Verification Summary</h3>
            <div className={cn(
                "p-4 rounded-lg flex items-start gap-4",
                discrepancyStatus === 'match' && 'bg-green-100/80 dark:bg-green-900/50 border border-green-500/50',
                discrepancyStatus !== 'match' && 'bg-red-100/80 dark:bg-red-900/50 border border-destructive/50'
            )}>
                {discrepancyStatus === 'match' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
                ) : (
                    <AlertTriangle className="h-6 w-6 text-destructive mt-1" />
                )}
                <div>
                    <h4 className={cn(
                        "font-bold text-lg",
                        discrepancyStatus === 'match' && 'text-green-800 dark:text-green-300',
                        discrepancyStatus !== 'match' && 'text-destructive'
                    )}>
                        {discrepancyStatus === 'match' ? 'Amounts Match' : 'Discrepancy Found'}
                    </h4>
                    <p className="text-muted-foreground">
                        {discrepancyStatus === 'match' 
                            ? "The calculated bill amount matches the vendor's invoice amount."
                            : `There is a difference of $${Math.abs(discrepancy).toFixed(2)}. The site bill is ${discrepancy > 0 ? 'higher' : 'lower'} than the vendor invoice.`}
                    </p>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
