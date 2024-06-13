import 'dotenv/config'
import { generate } from '@genkit-ai/ai'
import { action } from '@genkit-ai/core'
import { defineFlow, runFlow } from '@genkit-ai/flow'
import { geminiPro } from '@genkit-ai/googleai'
import { z } from 'zod'
import { standardConfig } from './modelConfig'
import { homeActor } from './state'

// Primary level flow for setting the room's temperature.
export const setThermostatFlow = defineFlow(
  {
    name: 'setThermostatFlow',
    inputSchema: z.object({
      command: z.string().describe('The user\'s request for a room temperature change.')
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const llmResponse = await generate({
      prompt: `Please respond to this command to set the temperature of the room : ${input.command}`,
      model: geminiPro,
      tools: [extractTemperature, setThermostatTemperature],
      config: standardConfig,
    });
    return llmResponse.text();
  }
);

// Determines which temperature (if any?) a user is referring to
export const extractTemperatureFlow = defineFlow({
  name: 'extractTemperatureFlow',
  inputSchema: z.object({
    temperatureContext: z.string().describe('Text that refers to a number temperature, any object that has a known temperature, or an adjustment to an existing temperature.')
  }),
  outputSchema: z.object({
    temperature: z.number().min(0).max(100)
  }),
},
  async (input) => {
    const currentState = homeActor.getSnapshot().context
    const llmResponse = await generate({
      prompt: `The current temperature is ${currentState.temp}. The following text may refer to a discrete temperature or an adjustment to the current temperature. What temperature is the following text referring to? : ${input.temperatureContext}`,
      model: geminiPro,
      config: standardConfig,
    });
    return { temperature: parseFloat(llmResponse.text()) }
  }
);

// Provides the extractTemperatureFlow as a tool
const extractTemperature = action(
  {
    name: 'extractTemperature',
    description: 'Extracts what temperature number the user wants. Uses the context of the conversation and any objects mentioned to pick a temperature for the thermostat. Has access to the current temperature and can make adjustments to it.',
    inputSchema: z.object({
      temperatureContext: z.string().describe('Text that refers to a number temperature or any object that has a temperature.')
    }),
    outputSchema: z.object({ temperature: z.number().min(0).max(100) }),
  },
  async (input) => {
    const response = await runFlow(extractTemperatureFlow, input);
    return response
  }
);

// Provides the setThermostatFlow as a tool
export const setThermostat = action(
  {
    name: 'setThermostat',
    description: 'Sets the temperature of the room\'s thermostat.',
    inputSchema: z.object({
      command: z.string().describe('The user\'s request for a room temperature change.')
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await runFlow(setThermostatFlow, input);
    return response
  }
)

// Low level tool that sets the color of the room's lights
export const setThermostatTemperature = action(
  {
    name: 'setThermostatTemperature',
    description: 'Sets the temperature of the room\'s thermostat by sending commands to the fixture\'s bluetooth API.',
    inputSchema: z.object({ temperature: z.number().min(0).max(100) }),
    outputSchema: z.boolean().describe('True if the temperature is successfully set.'),
  },
  async (input) => {
    homeActor.send({ type: 'SETTEMP', value: input.temperature })
    console.log('~~ I set the temperature of the thermostat to ' + input.temperature)
    return true
  }
);