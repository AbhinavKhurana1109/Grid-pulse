'use server';
/**
 * @fileOverview This file implements a Genkit flow for analyzing numerical distribution in a grid
 * and generating a statistical trend summary.
 *
 * - summarizeGridTrends - A function that triggers the AI analysis of grid data.
 * - SummarizeGridTrendsInput - The input type for the summarizeGridTrends function.
 * - SummarizeGridTrendsOutput - The return type for the summarizeGridTrends function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeGridTrendsInputSchema = z.object({
  gridValues: z.array(z.number().describe('A numerical value from a grid cell.')).describe('An array of all numerical values from the 10x10 grid.'),
});
export type SummarizeGridTrendsInput = z.infer<typeof SummarizeGridTrendsInputSchema>;

const SummarizeGridTrendsOutputSchema = z.object({
  overallDistribution: z.string().describe('A summary of the overall numerical distribution (e.g., spread, concentrated, bimodal).'),
  minVal: z.number().describe('The minimum value found in the grid.'),
  maxVal: z.number().describe('The maximum value found in the grid.'),
  average: z.number().describe('The average (mean) of all values in the grid.'),
  median: z.number().describe('The median of all values in the grid.'),
  commonRanges: z.array(z.string()).describe('A list of common value ranges or clusters identified in the grid.'),
  patterns: z.array(z.string()).describe('A list of any discernible numerical patterns or trends (e.g., increasing values, specific groupings).'),
  outliers: z.array(z.number()).describe('A list of any significant outlier values that deviate from the general trend.'),
  summary: z.string().describe('A comprehensive statistical trend summary of the grid data, incorporating all identified insights.')
});
export type SummarizeGridTrendsOutput = z.infer<typeof SummarizeGridTrendsOutputSchema>;

export async function summarizeGridTrends(input: SummarizeGridTrendsInput): Promise<SummarizeGridTrendsOutput> {
  return summarizeGridTrendsFlow(input);
}

const summarizeGridTrendsPrompt = ai.definePrompt({
  name: 'summarizeGridTrendsPrompt',
  input: { schema: SummarizeGridTrendsInputSchema },
  output: { schema: SummarizeGridTrendsOutputSchema },
  prompt: `You are an expert data analyst specializing in numerical grid data. Your task is to analyze the provided array of numerical grid values, identify patterns, and generate a comprehensive statistical trend summary.\n\nAnalyze the 'gridValues' array to determine the following and populate the JSON output structure accordingly:\n- The overall distribution of numbers (e.g., are they clustered, evenly spread, skewed, bimodal, uniform, normal, etc.?).\n- The minimum and maximum values present.\n- The average (mean) of all values.\n- The median of all values.\n- Any common numerical ranges or clusters of values.\n- Any discernible patterns or trends across the values.\n- Any significant outlier values that deviate from the general trend.\n\nProvide a detailed comprehensive summary incorporating all identified insights.\n\nGrid Values: {{{gridValues}}}`
});

const summarizeGridTrendsFlow = ai.defineFlow(
  {
    name: 'summarizeGridTrendsFlow',
    inputSchema: SummarizeGridTrendsInputSchema,
    outputSchema: SummarizeGridTrendsOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeGridTrendsPrompt(input);
    return output!;
  }
);
