/**
 * Fedify with Nuxt
 * ================
 *
 * This package provides [Nuxt] server middleware to integrate with Fedify.
 * Since Nuxt uses [Nitro] and [h3] under the hood, this package leverages
 * h3's event system for request handling.
 *
 * [Nuxt]: https://nuxt.com/
 * [Nitro]: https://nitro.build/
 * [h3]: https://h3.unjs.io/
 *
 * @module
 * @since 2.2.0
 */

import type { Federation } from "@fedify/fedify";
import {
  defineEventHandler,
  type EventHandler,
  type EventHandlerRequest,
  type EventHandlerResponse,
  type H3Error,
  type H3Event,
  toWebRequest,
} from "h3";

// Internal key for storing 406 Not Acceptable responses in the event context.
// This must match the key used by @fedify/h3 for compatibility.
const FEDIFY_RESPONSE_KEY = "__fedify_response__";

/**
 * A factory function that creates the context data for the
 * {@link Federation} object.
 *
 * @template TContextData The type of the context data.
 * @param event The h3 {@link H3Event} for the current request.
 * @param request The Web API {@link Request} converted from the h3 event.
 * @returns The context data, or a promise resolving to the context data.
 * @since 2.2.0
 */
export type ContextDataFactory<TContextData> = (
  event: H3Event<EventHandlerRequest>,
  request: Request,
) => TContextData | Promise<TContextData>;

/**
 * Create a Nuxt server middleware to integrate with the {@link Federation}
 * object.
 *
 * @example server/middleware/federation.ts
 * ``` typescript
 * import { fedifyMiddleware } from "@fedify/nuxt";
 * import federation from "../utils/federation";
 *
 * export default fedifyMiddleware(federation, (event, request) => undefined);
 * ```
 *
 * @template TContextData A type of the context data for the
 *                         {@link Federation} object.
 * @param federation A {@link Federation} object to integrate with Nuxt.
 * @param contextDataFactory A function to create context data for the
 *                           {@link Federation} object.
 * @returns A Nuxt server middleware (h3 event handler).
 * @since 2.2.0
 */
export function fedifyMiddleware<TContextData>(
  federation: Federation<TContextData>,
  contextDataFactory: ContextDataFactory<TContextData> = () =>
    undefined as TContextData,
): EventHandler<EventHandlerRequest, EventHandlerResponse> {
  return defineEventHandler({
    async handler(event) {
      const request = toWebRequest(event);
      const response = await federation.fetch(request, {
        contextData: await contextDataFactory(event, request),
      });
      // If the response is 404 Not Found, then we delegate the handling to
      // the next handler in the chain.  This is because the handler might
      // have an endpoint that Fedify does not have, and we want to give the
      // handler a chance to respond to the request:
      if (response.status === 404) return;
      // Store the 406 response in the event context so that the error
      // handler can use it later:
      if (response.status === 406) {
        event.context[FEDIFY_RESPONSE_KEY] = response;
        return;
      }
      await event.respondWith(response);
    },
  });
}

/**
 * An error handler for Nuxt's Nitro configuration that responds with a
 * 406 Not Acceptable when Fedify's content negotiation fails and no other
 * handler can serve the request.
 *
 * Configure this in your `nuxt.config.ts`:
 *
 * @example nuxt.config.ts
 * ``` typescript
 * export default defineNuxtConfig({
 *   nitro: {
 *     errorHandler: "~/server/error",
 *   },
 * });
 * ```
 *
 * @example server/error.ts
 * ``` typescript
 * import { onError } from "@fedify/nuxt";
 *
 * export default onError;
 * ```
 *
 * @param error The error that occurred.
 * @param event The h3 event that triggered the error.
 * @since 2.2.0
 */
export async function onError(
  error: H3Error<unknown>,
  event: H3Event<EventHandlerResponse>,
): Promise<void> {
  // If Fedify responded with a 406 Not Acceptable and later on the actual
  // handler responded with a 404 Not Found, then we consider it failed
  // to negotiate a response.  For example, if Fedify has an endpoint /foo
  // that supports only application/activity+json and the handler has no
  // endpoint /foo at all, then when a client requests /foo with
  // Accept: text/html, it should respond with 406 Not Acceptable:
  if (
    FEDIFY_RESPONSE_KEY in event.context &&
    event.context[FEDIFY_RESPONSE_KEY].status === 406 &&
    error.statusCode === 404
  ) {
    await event.respondWith(event.context[FEDIFY_RESPONSE_KEY]);
  }
}
