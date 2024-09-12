/**
 * Portkey AI Gateway
 *
 * @module index
 */

import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
// import { env } from 'hono/adapter' // Have to set this up for multi-environment deployment

import { completeHandler } from './handlers/completeHandler';
import { chatCompleteHandler } from './handlers/chatCompleteHandler';
import { embedHandler } from './handlers/embedHandler';
import { proxyHandler } from './handlers/proxyHandler';
import { proxyGetHandler } from './handlers/proxyGetHandler';
import { chatCompletionsHandler } from './handlers/chatCompletionsHandler';
import { completionsHandler } from './handlers/completionsHandler';
import { embeddingsHandler } from './handlers/embeddingsHandler';
import { requestValidator } from './middlewares/requestValidator';
import { hooks } from './middlewares/hooks';
import { compress } from 'hono/compress';
import { getRuntimeKey } from 'hono/adapter';
import { imageGenerationsHandler } from './handlers/imageGenerationsHandler';
import { memoryCache } from './middlewares/cache';
import { createSpeechHandler } from './handlers/createSpeechHandler';
import conf from '../conf.json';
import { createTranscriptionHandler } from './handlers/createTranscriptionHandler';
import { createTranslationHandler } from './handlers/createTranslationHandler';

// Create a new Hono server instance
const app = new Hono();

/**
 * Middleware that conditionally applies compression middleware based on the runtime.
 * Compression is automatically handled for lagon and workerd runtimes
 * This check if its not any of the 2 and then applies the compress middleware to avoid double compression.
 */

app.use('*', (c, next) => {
  const runtime = getRuntimeKey();
  if (runtime !== 'lagon' && runtime !== 'workerd' && runtime !== 'node') {
    return compress()(c, next);
  }
  return next();
});

/**
 * GET route for the root path.
 * Returns a greeting message.
 */
app.get('/', (c) => c.text('AI Gateway says hey!'));

// Use prettyJSON middleware for all routes
app.use('*', prettyJSON());

// Use hooks middleware for all routes
app.use('*', hooks);

if (conf.cache === true) {
  app.use('*', memoryCache());
}

/**
 * Default route when no other route matches.
 * Returns a JSON response with a message and status code 404.
 */
app.notFound((c) => c.json({ message: 'Not Found', ok: false }, 404));

/**
 * Global error handler.
 * If error is instance of HTTPException, returns the custom response.
 * Otherwise, logs the error and returns a JSON response with status code 500.
 */
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  c.status(500);
  return c.json({ status: 'failure', message: err.message });
});

/**
 * @deprecated
 * POST route for '/v1/complete'.
 * Handles requests by passing them to the completeHandler.
 */
app.post('/v1/complete', completeHandler);

/**
 * @deprecated
 * POST route for '/v1/chatComplete'.
 * Handles requests by passing them to the chatCompleteHandler.
 */
app.post('/v1/chatComplete', chatCompleteHandler);

/**
 * @deprecated
 * POST route for '/v1/embed'.
 * Handles requests by passing them to the embedHandler.
 */
app.post('/v1/embed', embedHandler);

/**
 * POST route for '/v1/chat/completions'.
 * Handles requests by passing them to the chatCompletionsHandler.
 */
app.post('/v1/chat/completions', requestValidator, chatCompletionsHandler);

/**
 * POST route for '/v1/completions'.
 * Handles requests by passing them to the completionsHandler.
 */
app.post('/v1/completions', requestValidator, completionsHandler);

/**
 * POST route for '/v1/embeddings'.
 * Handles requests by passing them to the embeddingsHandler.
 */
app.post('/v1/embeddings', requestValidator, embeddingsHandler);

/**
 * POST route for '/v1/images/generations'.
 * Handles requests by passing them to the imageGenerations handler.
 */
app.post('/v1/images/generations', requestValidator, imageGenerationsHandler);

/**
 * POST route for '/v1/audio/speech'.
 * Handles requests by passing them to the createSpeechHandler.
 */
app.post('/v1/audio/speech', requestValidator, createSpeechHandler);

/**
 * POST route for '/v1/audio/transcriptions'.
 * Handles requests by passing them to the createTranscriptionHandler.
 */
app.post(
  '/v1/audio/transcriptions',
  requestValidator,
  createTranscriptionHandler
);

/**
 * POST route for '/v1/audio/translations'.
 * Handles requests by passing them to the createTranslationHandler.
 */
app.post('/v1/audio/translations', requestValidator, createTranslationHandler);

/**
 * POST route for '/v1/prompts/:id/completions'.
 * Handles portkey prompt completions route
 */
app.post('/v1/prompts/*', requestValidator, (c) => {
  if (c.req.url.endsWith('/v1/chat/completions')) {
    return chatCompletionsHandler(c);
  } else if (c.req.url.endsWith('/v1/completions')) {
    return completionsHandler(c);
  }
  c.status(500);
  return c.json({
    status: 'failure',
    message: 'prompt completions error: Something went wrong',
  });
});

/**
 * @deprecated
 * Support the /v1 proxy endpoint
 */
app.post('/v1/proxy/*', proxyHandler);

// Support the /v1 proxy endpoint after all defined endpoints so this does not interfere.
app.post('/v1/*', requestValidator, proxyHandler);

// Support the /v1 proxy endpoint after all defined endpoints so this does not interfere.
app.get('/v1/*', requestValidator, proxyGetHandler);

app.delete('/v1/*', requestValidator, proxyGetHandler);

// Export the app
export default app;
