/**
 * Fedify with Nuxt
 * ================
 *
 * This package provides a [Nuxt] server middleware to integrate with Fedify.
 *
 * [Nuxt]: https://nuxt.com/
 *
 * @module
 * @since 2.2.0
 */

import type { Federation } from "@fedify/fedify/federation";
import {
  defineEventHandler,
  type EventHandler,
  type EventHandlerRequest,
  type EventHandlerResponse,
  type H3Error,
  type H3Event,
  toWebRequest,
} from "h3";

/**
 * A factory function that creates the context data for the
 * {@link Federation} object.
 *
 * @template TContextData The type of the context data that will be passed to
 *                         the `Federation` instance.
 * @param event The H3 event for the current request.
 * @returns The context data, or a promise resolving to the context data.
 * @since 2.2.0
 */
export type ContextDataFactory<TContextData> = (
  event: H3Event,
) => TContextData | Promise<TContextData>;

/**
 * Creates a Nuxt server middleware that integrates with the
 * {@link Federation} object.
 *
 * Put the returned handler in your *server/middleware/federation.ts* file.
 *
 * > [!NOTE]
 * > You also need to configure the Nitro error handler to properly handle
 * > content negotiation.  Export {@link onError} as the default export from
 * > *server/error.ts*, and configure `nitro.errorHandler` in your
 * > *nuxt.config.ts*.
 *
 * @example server/middleware/federation.ts
 * ``` typescript
 * import { fedifyMiddleware } from "@fedify/nuxt";
 * import { federation } from "~/server/federation";
 *
 * export default fedifyMiddleware(federation, (event) => undefined);
 * ```
 *
 * @template TContextData The type of the context data for the
 *                         {@link Federation} object.
 * @param federation The {@link Federation} object to integrate with Nuxt.
 * @param createContextData A function to create context data for the
 *                          {@link Federation} object.  Defaults to a function
 *                          that returns `undefined`.
 * @returns An H3 event handler to use as Nuxt server middleware.
 * @since 2.2.0
 */
export function fedifyMiddleware<TContextData>(
  federation: Federation<TContextData>,
  createContextData: ContextDataFactory<TContextData> = () =>
    undefined as TContextData,
): EventHandler<EventHandlerRequest, EventHandlerResponse> {
  return defineEventHandler({
    async handler(event) {
      const request = toWebRequest(event);
      const response = await federation.fetch(request, {
        contextData: await createContextData(event),
      });
      // If Fedify does not handle this route, let Nuxt handle it:
      if (response.status === 404) return;
      // If content negotiation failed (client does not want JSON-LD),
      // store the 406 response and let Nuxt try to serve HTML.
      // If Nuxt also cannot handle it, onError() will return the 406:
      if (response.status === 406) {
        event.context["__fedify_response__"] = response;
        return;
      }
      // Fedify handled the request successfully:
      await event.respondWith(response);
    },
  });
}

/**
 * A Nitro error handler that responds with 406 Not Acceptable if Fedify
 * responded with 406 and the subsequent Nuxt route handler responds with
 * 404 Not Found.
 *
 * This handler should be exported as the default export from
 * *server/error.ts*, and you must configure `nitro.errorHandler` in
 * *nuxt.config.ts* to point to that file.
 *
 * @example server/error.ts
 * ``` typescript
 * export { onError as default } from "@fedify/nuxt";
 * ```
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
 * @since 2.2.0
 */
export async function onError(
  error: H3Error<unknown>,
  event: H3Event<EventHandlerResponse>,
): Promise<void> {
  // If Fedify responded with a 406 Not Acceptable and later on the Nuxt
  // route handler responded with a 404 Not Found, then we consider it
  // failed to negotiate a response.  For example, if Fedify has an
  // endpoint /foo that supports only application/activity+json and Nuxt
  // has no page for /foo, then when a client requests /foo with
  // Accept: text/html, it should respond with 406 Not Acceptable:
  if (
    "__fedify_response__" in event.context &&
    event.context["__fedify_response__"].status === 406 &&
    error.statusCode === 404
  ) {
    await event.respondWith(event.context["__fedify_response__"]);
  }
}
