'use server';

/**
 * @fileOverview An AI-powered tool that cross-checks material bills by cross-examining all related entries in the ledger.
 *
 * - reviewBill - A function that handles the bill review process.
 * - ReviewBillInput - The input type for the reviewBill function.
 * - ReviewBillOutput - The return type for the reviewBill function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReviewBillInputSchema = z.object({
  billDetails: z.string().describe('Details of the material bill including items, quantities, and costs.'),
  ledgerEntries: z.string().describe('Related entries from the ledger, including material requests, receipts, and invoices.'),
});
export type ReviewBillInput = z.infer<typeof ReviewBillInputSchema>;

const ReviewBillOutputSchema = z.object({
  isAccurate: z.boolean().describe('Whether the bill is accurate based on the ledger entries.'),
  discrepancies: z.string().describe('Detailed description of any discrepancies found between the bill and the ledger entries.'),
  summary: z.string().describe('A summary of the bill review, including total cost and any potential issues.'),
});
export type ReviewBillOutput = z.infer<typeof ReviewBillOutputSchema>;

export async function reviewBill(input: ReviewBillInput): Promise<ReviewBillOutput> {
  return reviewBillFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviewBillPrompt',
  input: {schema: ReviewBillInputSchema},
  output: {schema: ReviewBillOutputSchema},
  prompt: `You are an expert auditor specializing in material bills.

You will cross-examine the provided material bill against the related ledger entries to ensure accuracy and identify any discrepancies.

Bill Details: {{{billDetails}}}
Ledger Entries: {{{ledgerEntries}}}

Determine if the bill is accurate based on the ledger entries and provide a detailed description of any discrepancies found. Also, provide a summary of the bill review, including the total cost and any potential issues.

Ensure that the output format matches the ReviewBillOutputSchema, including a boolean value for 'isAccurate', detailed discrepancies in the 'discrepancies' field, and a summary in the 'summary' field.`,
});

const reviewBillFlow = ai.defineFlow(
  {
    name: 'reviewBillFlow',
    inputSchema: ReviewBillInputSchema,
    outputSchema: ReviewBillOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
