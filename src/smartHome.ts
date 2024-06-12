import 'dotenv/config'
import { generate } from '@genkit-ai/ai'
import { defineFlow } from '@genkit-ai/flow'
import { geminiPro } from '@genkit-ai/googleai'
import { z } from 'zod'
import { setLights } from './lights'
import { setThermostat } from './thermostat'
import { standardConfig } from './modelConfig'

// Our smart home agent
export const smartHomeFlow = defineFlow(
  {
    name: 'smartHomeFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (input) => {
    const llmResponse = await generate({
      prompt: `${input}`,
      model: geminiPro,
      tools: [setLights, setThermostat],
      config: standardConfig,
    });

    return llmResponse.text();
  }
);