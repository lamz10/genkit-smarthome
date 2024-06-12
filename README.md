# genkit-smarthome

Demo project that explores the use of Genkit.

## Getting started

First - create a .env file with your Google AI Studio API Key:

```
GOOGLE_GENAI_API_KEY=YourKeyHere
```

To debug flows with [Genkit UI](https://firebase.google.com/docs/genkit/get-started)

```
npm i -g genkit
genkit start
```

To run the web application

```
npm install
npm run server
```

## TODO

Send current state (temp and light color context) to model so that commands like "make it 5 degrees warmer" can work.
