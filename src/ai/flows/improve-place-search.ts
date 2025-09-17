'use server';

/**
 * @fileOverview A Genkit flow to improve place search using AI. It takes a user's search query and attempts
 * to extract structured location information (city, state, country) to enhance the search results.
 *
 * - improvePlaceSearch - A function that enhances place search queries using AI.
 * - ImprovePlaceSearchInput - The input type for the improvePlaceSearch function.
 * - ImprovePlaceSearchOutput - The return type for the improvePlaceSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImprovePlaceSearchInputSchema = z.object({
  query: z.string().describe('The user\u2019s search query for a place.'),
});
export type ImprovePlaceSearchInput = z.infer<typeof ImprovePlaceSearchInputSchema>;

const ImprovePlaceSearchOutputSchema = z.object({
  structuredQuery: z
    .string()
    .describe(
      'A refined search query that includes structured location information (city, state, country) for improved search accuracy.'
    ),
});
export type ImprovePlaceSearchOutput = z.infer<typeof ImprovePlaceSearchOutputSchema>;

export async function improvePlaceSearch(input: ImprovePlaceSearchInput): Promise<ImprovePlaceSearchOutput> {
  return improvePlaceSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improvePlaceSearchPrompt',
  input: {schema: ImprovePlaceSearchInputSchema},
  output: {schema: ImprovePlaceSearchOutputSchema},
  prompt: `You are an AI assistant designed to improve the accuracy of place searches.

  The user will provide a search query, and you should attempt to extract structured location
  information (city, state, country) from the query, if present. If the query is vague or misspelled,
  use your knowledge to infer the most likely intended location.

  Return a refined search query that includes the structured location information.

  For example:

  User Query: "coffee in paris"
  Refined Query: "coffee in Paris, France"

  User Query: "pizza nyc"
  Refined Query: "pizza New York, NY, USA"

  User Query: "londn eye"
  Refined Query: "London Eye, London, UK"

  User Query: "{{{query}}}"`,
});

const improvePlaceSearchFlow = ai.defineFlow(
  {
    name: 'improvePlaceSearchFlow',
    inputSchema: ImprovePlaceSearchInputSchema,
    outputSchema: ImprovePlaceSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
