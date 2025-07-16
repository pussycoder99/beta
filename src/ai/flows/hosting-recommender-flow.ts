
'use server';
/**
 * @fileOverview An AI flow to recommend a hosting product based on user needs.
 * 
 * - recommendHosting - A function that suggests a hosting product.
 * - HostingRecommenderInput - The input type for the recommendHosting function.
 * - HostingRecommenderOutput - The return type for the recommendHosting function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ProductInfoSchema = z.object({
    pid: z.string().describe("The unique product ID."),
    name: z.string().describe("The name of the product."),
    description: z.string().describe("The HTML description of the product."),
});

const HostingRecommenderInputSchema = z.object({
  projectDescription: z.string().describe("The user's description of their website or project needs."),
  availableProducts: z.array(ProductInfoSchema).describe("A list of available hosting products."),
});
export type HostingRecommenderInput = z.infer<typeof HostingRecommenderInputSchema>;

const HostingRecommenderOutputSchema = z.object({
  recommendedProductId: z.string().describe("The product ID (pid) of the hosting plan that is the best fit for the user."),
  justification: z.string().describe("A friendly, single-paragraph explanation of why this product was recommended, tailored to the user's project description."),
});
export type HostingRecommenderOutput = z.infer<typeof HostingRecommenderOutputSchema>;

export async function recommendHosting(input: HostingRecommenderInput): Promise<HostingRecommenderOutput> {
  return hostingRecommenderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'hostingRecommenderPrompt',
  input: { schema: HostingRecommenderInputSchema },
  output: { schema: HostingRecommenderOutputSchema },
  prompt: `You are an expert hosting advisor for a web hosting company. Your goal is to help a potential customer choose the best hosting plan for their needs.

Analyze the user's project description and the list of available products with their names and descriptions.

**User's Project Description:**
"{{{projectDescription}}}"

**Available Hosting Products:**
{{#each availableProducts}}
---
Product ID (pid): {{this.pid}}
Product Name: {{this.name}}
Description:
{{{this.description}}}
---
{{/each}}

**Your Task:**
1.  Read the user's description carefully to understand their needs (e.g., e-commerce, portfolio, blog, traffic expectations, technical skill).
2.  Review all available products. Match the user's needs to the product that is the best fit. Consider keywords like "startup", "business", "e-commerce", "high traffic", "WordPress", etc., in the product names and descriptions.
3.  Select exactly one product to recommend.
4.  Provide the chosen product's ID in the 'recommendedProductId' field.
5.  Write a friendly, single-paragraph justification for your choice. Explain in simple terms *why* that specific plan is a good match for their project. For example: "Based on your plan to launch an e-commerce store, our 'Business Hosting' plan is the perfect fit. It offers the extra resources and security you'll need to handle transactions and a growing number of visitors."

Provide your response in the requested JSON format.`,
});

const hostingRecommenderFlow = ai.defineFlow(
  {
    name: 'hostingRecommenderFlow',
    inputSchema: HostingRecommenderInputSchema,
    outputSchema: HostingRecommenderOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
