import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import * as dotenv from 'dotenv';

// Configure dotenv before initializing Genkit plugins
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
