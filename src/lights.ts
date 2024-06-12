import 'dotenv/config'
import { generate } from '@genkit-ai/ai'
import { action } from '@genkit-ai/core'
import { defineFlow, runFlow } from '@genkit-ai/flow'
import { geminiPro } from '@genkit-ai/googleai'
import { z } from 'zod'
import { standardConfig } from './modelConfig'
import { homeActor } from './state'
// import { MessageData } from '@genkit-ai/ai/model';

// Primary level flow for setting the room's lighting.
export const setLightsFlow = defineFlow(
  {
    name: 'setLightsFlow',
    inputSchema: z.object({
      command: z.string().describe('The user\'s request for a lighting color change.')
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // DO NOT USE history with gemini - it just responds with "Understood" and ruins the chain of commands.
    // let history: MessageData[] = [
    //   { role: 'system', content: [{ text: 'You are an assistant who manages the color of lights in a room. It is your job to use the provided tools to set the color that the user is referring to.' }] },
    // ];
    const llmResponse = await generate({
      prompt: `Please respond to this command to set the color of lights in the room : ${input.command}`,
      model: geminiPro,
      tools: [extractColor, convertColorToHex, setLEDColor],
      config: standardConfig,
      // history
    });
    return llmResponse.text();
  }
);

// Provides the setLightsFlow as a tool
export const setLights = action(
  {
    name: 'setLights',
    description: 'Sets the color of the lights in the room. This command can determine which color to use even if a specific color is not mentioned.',
    inputSchema: z.object({
      command: z.string().describe('The user\'s request for a lighting color change.')
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await runFlow(setLightsFlow, input);
    return response
  }
)

// Low level tool that sets the color of the room's lights
export const setLEDColor = action(
  {
    name: 'setLEDColor',
    description: 'Sets the color of the room\'s lighting by sending commands to the fixture\'s bluetooth API.',
    inputSchema: z.object({ hexColorCode: z.string().length(6) }),
    outputSchema: z.boolean().describe('True if the color is successfully set.'),
  },
  async (input) => {
    homeActor.send({ type: 'SETCOLOR', value: input.hexColorCode })
    console.log('~~ I set the color of the lights to ' + input.hexColorCode)
    return true
  }
);

// Flow that converts colors to hex codes
export const convertColorToHexFlow = defineFlow({
  name: 'convertColorToHexFlow',
  inputSchema: z.object({
    color: z.string()
  }),
  outputSchema: z.object({
    hexColorCode: z.string().length(6)
  }),
},
  async (input) => {
    const llmResponse = await generate({
      prompt: `Please convert this color to a hex code : ${input.color}`,
      model: geminiPro,
      config: standardConfig,
    });
    return { hexColorCode: llmResponse.text().replace('#', '') }
  }
);

// Provides the convertColorToHexFlow as a tool
export const convertColorToHex = action(
  {
    name: 'convertColorToHex',
    description: 'Converts a color string to hex. For example, an input of "blue" outputs "0000FF"',
    inputSchema: z.object({ colorString: z.string() }),
    outputSchema: z.object({ hexColorCode: z.string().length(6) }),
  },
  async (input) => {
    console.log('~~ hex convert got input', input)
    // return { hexColorCode: 'FF00FF' }

    const response = await runFlow(convertColorToHexFlow, {
      color: input.colorString
    });
    return response
  }
);

// Determines which color (if any?) a user is referring to
export const extractColorFlow = defineFlow({
  name: 'extractColorFlow',
  // Always use objects for inputSchema, otherwise we get empty inputs from "toolRequests"
  inputSchema: z.object({
    colorContext: z.string().describe('Text that refers to a color or any object that has a color.')
  }),
  outputSchema: z.object({
    color: z.string()
  }),
},
  async (input) => {
    const llmResponse = await generate({
      prompt: `What color is this text referring to? : ${input.colorContext}`,
      model: geminiPro,
      config: standardConfig,
    });
    return { color: llmResponse.text() }
  }
);

// Provides the extractColorFlow as a tool
export const extractColor = action(
  {
    name: 'extractColor',
    description: 'Extracts what color the user wants. Uses the context of the conversation and any objects mentioned to pick a color.',
    inputSchema: z.object({
      colorContext: z.string().describe('Text that refers to a color or any object that has a color.')
    }),
    outputSchema: z.object({ color: z.string() }),
  },
  async (input) => {
    const response = await runFlow(extractColorFlow, input);
    return response
  }
);