import 'dotenv/config'
import express, { NextFunction, type Request, type Response } from 'express'
import { ZodError, z } from 'zod'
import { homeActor } from './state'
import { smartHomeFlow } from './smartHome'
import { runFlow } from '@genkit-ai/flow'
import { configureGenkit } from '@genkit-ai/core'
import { googleAI } from '@genkit-ai/googleai'
import swaggerAutogen from 'swagger-autogen'
import swaggerUI from 'swagger-ui-express'

const doc = {
  info: {
    title: 'Genkit Smarthome API',
    description: 'Use Genkit to manage the state of your smarthome.'
  },
  host: 'localhost:3000',
  definitions: {
    State: {
      temp: 67,
      color: '00FF00'
    }
  }
};

const outputFile = './swagger-output.json';

configureGenkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

const app = express()
app.use(express.json())

app.get('/', async (req: Request, res: Response) => {
  // #swagger.ignore = true
  res.sendFile(__dirname + '/index.html')
})

app.get('/state', async (req: Request, res: Response) => {
  /*  #swagger.tags = ['State']
      #swagger.produces = ["application/json"]
      #swagger.responses[200] = {
        schema:{
          $ref: "#/definitions/State"
        },
        description: "The current state of the home."
      }   
  */
  res.json(homeActor.getSnapshot().context)
})

export const stateUpdateSchema = z.object({
  color: z.string().length(6).optional(),
  temp: z.number().min(0).max(100).optional()
})
app.post('/state', async (req: Request, res: Response) => {
  /*  #swagger.description = 'Updates the current state of the home.'
      #swagger.tags = ['State']
      #swagger.consumes = ["application/json"]
      #swagger.produces = ["application/json"]
      #swagger.parameters['body'] = {
        in: 'body',
        description: '',
        schema: {
          $color: '00FF00',
          $temp: 77
        }
      }
  */
  const update = stateUpdateSchema.parse(req.body)
  if (update.color) {
    homeActor.send({ type: 'SETCOLOR', value: update.color })
  }
  if (update.temp) {
    homeActor.send({ type: 'SETTEMP', value: update.temp })
  }
  res.json(homeActor.getSnapshot().context)
})

export const commandSchema = z.object({
  command: z.string(),
})
app.post('/command', async (req: Request, res: Response) => {
  /*  #swagger.description = 'Processes a natural language input to update the current state of the home.'
      #swagger.tags = ['State']
      #swagger.consumes = ["application/json"]
      #swagger.produces = ["application/json"]
      #swagger.parameters['body'] = {
        in: 'body',
        description: '',
        schema: {
          $command: 'Change the lights to green please.',
        }
      }
  */
  const input = commandSchema.parse(req.body)
  const response = await runFlow(smartHomeFlow, input.command)
  res.json({ response, ...homeActor.getSnapshot().context })
})

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  if (err instanceof ZodError) {
    const messages : Array<string> = []
    for (const issue of err.issues) {
      messages.push(issue.path.join(",") + ' - ' + issue.message)
    }
    res.status(500).json({ message: messages.join(', ') })
  } else {
    res.status(500).json({ message: err.toString() })
  }
})

swaggerAutogen()(outputFile, ['./server.ts'], doc).then(() => {
  const swaggerFile = require('./swagger-output.json')
  app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerFile))
})

const port = parseInt(process.env.PORT || '3000')
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
