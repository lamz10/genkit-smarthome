import 'dotenv/config'
import { configureGenkit } from '@genkit-ai/core'
import { startFlowsServer } from '@genkit-ai/flow'
import { googleAI } from '@genkit-ai/googleai'
import { smartHomeFlow } from './smartHome';

configureGenkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

startFlowsServer({
  flows: [
    smartHomeFlow
  ]
});
