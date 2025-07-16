import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
  // Set the platform to 'nextjs' for production environments like Netlify.
  // When running 'genkit start', it defaults to 'firebase', so this ensures
  // compatibility with serverless deployments.
  platform: process.env.GENKIT_ENV === 'dev' ? 'firebase' : 'nextjs',
});
