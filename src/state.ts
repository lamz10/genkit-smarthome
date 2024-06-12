import { createMachine, assign, createActor, setup } from 'xstate';

export const homeMachine = setup({
  types: {} as {
    context: {
      temp: number,
      color: string
    }
  }
}).createMachine({
  context: {
    temp: 67,
    color: 'FF0000'
  },
  on: {
    SETCOLOR: {
      actions: assign({
        color: ({ event }) => event.value,
      }),
    },
    SETTEMP: {
      actions: assign({
        temp: ({ event }) => event.value,
      }),
    },
  },
});

export const homeActor = createActor(homeMachine).start();

homeActor.subscribe((state) => {
  console.log(`~~ home state : ${state.context.temp} degrees with a ${state.context.color} light color.`);
});
