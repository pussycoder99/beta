
'use server';
/**
 * @fileOverview An AI flow to summarize a client's services and suggest upsells.
 *
 * - summarizeClient - A function that handles the client summary and upsell process.
 * - SummarizeClientInput - The input type for the summarizeClient function.
 * - SummarizeClientOutput - The return type for the summarizeClient function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SummarizeClientInputSchema = z.object({
  clientServices: z.array(z.string()).describe("A list of the services the client currently owns."),
  allProducts: z.array(z.string()).describe("A list of all products available for purchase."),
});
export type SummarizeClientInput = z.infer<typeof SummarizeClientInputSchema>;

const SummarizeClientOutputSchema = z.object({
  summary: z.string().describe("A brief, friendly, one-sentence summary of the client's current services."),
  upsellSuggestion: z.string().describe("A friendly, single-sentence suggestion for a service the client might be interested in, based on the services they don't have. If they have all services, provide a thankful message instead."),
});
export type SummarizeClientOutput = z.infer<typeof SummarizeClientOutputSchema>;

export async function summarizeClient(input: SummarizeClientInput): Promise<SummarizeClientOutput> {
  return summarizeClientFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeClientPrompt',
  input: {schema: SummarizeClientInputSchema},
  output: {schema: SummarizeClientOutputSchema},
  prompt: `You are a helpful AI account manager for a hosting company.
Your goal is to provide a quick, personalized summary for a returning client based on their services.

Analyze the list of services the client currently has and the list of all available products.

Client's current services:
{{#each clientServices}}
- {{this}}
{{/each}}

All available products:
{{#each allProducts}}
- {{this}}
{{/each}}

Based on this information, do the following:
1.  **Summary**: Write a single, brief, friendly sentence summarizing what the client has. For example, "It looks like you're set up with web hosting and a domain." or "We see you have an active hosting service with us."
2.  **Upsell Suggestion**: Identify a key service from the "all products" list that the client does NOT currently have. Formulate a single, friendly sentence suggesting they might be interested in it. For example, "Have you considered registering a unique domain name for your project?" or "To keep your site safe, you might want to look into our backup services." If the client already has every single service listed in "all products", provide a thankful message instead, like "Thank you for being a loyal customer and utilizing all of our services!"

Provide your response in the requested JSON format.`,
});

const summarizeClientFlow = ai.defineFlow(
  {
    name: 'summarizeClientFlow',
    inputSchema: SummarizeClientInputSchema,
    outputSchema: SummarizeClientOutputSchema,
  },
  async (input) => {
    // If the user has no services, return a default message.
    if (input.clientServices.length === 0) {
        return {
            summary: "Welcome! It looks like you're ready to start your next project with us.",
            upsellSuggestion: "You can start by ordering a new service or registering a domain."
        };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
