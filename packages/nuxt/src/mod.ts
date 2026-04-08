/**
 * Fedify with Nuxt
 * ================
 *
 * This package provides a [Nuxt] module and server middleware to integrate
 * with the Fedify.
 *
 * [Nuxt]: https://nuxt.com/
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

/**
 * A factory function that creates the context data that will be passed to the
 * `Federation` instance.
 * @template TContextData The type of the context data that will be passed to
 *                         the `Federation` instance.
 * @param event The H3 event that triggered the handler.
 * @param request The Web API request that triggered the handler.
 * @returns The context data that will be passed to the `Federation` instance.
 *          This can be a promise that resolves to the context data.
 * @since 2.2.0
 */
export type ContextDataFactory<TContextData> = (
  event: H3Event<EventHandlerRequest>,
  request: Request,
) => Promise<TContextData> | TContextData;

/**
 * A Nuxt module that configures Vite SSR settings for Fedify compatibility.
 *
 * This module adds `@fedify/fedify` and `@fedify/vocab` to Vite's
 * `ssr.noExternal` list, which is necessary because these packages contain
 * dependencies that Vite must bundle for SSR.
 *
 * @example nuxt.config.ts
 * ``` typescript
 * import fedifyModule from "@fedify/nuxt";
 *
 * export default defineNuxtConfig({
 *   modules: [fedifyModule],
 *   nitro: {
 *     errorHandler: "~~/server/error",
 *   },
 * });
 * ```
 *
 * @since 2.2.0
 */
// deno-lint-ignore no-explicit-any
const fedifyModule: ((...args: any[]) => void) & { meta: { name: string } } =
  function (_moduleOptions, nuxt) {
    const vite = (nuxt.options.vite ??= {});
    const ssr = (vite.ssr ??= {});
    const noExternal = ssr.noExternal;
    if (Array.isArray(noExternal)) {
      noExternal.push("@fedify/fedify", "@fedify/vocab");
    } else if (noExternal !== true) {
      ssr.noExternal = ["@fedify/fedify", "@fedify/vocab"];
    }
  };
fedifyModule.meta = { name: "@fedify/nuxt" };

export default fedifyModule;

/**
 * Create a Nuxt server middleware to integrate with the {@link Federation}
 * object.
 *
 * @example server/middleware/federation.ts
 * ``` typescript
 * import { fedifyMiddleware } from "@fedify/nuxt";
 * import federation from "../federation";
 *
 * export default fedifyMiddleware(
 *   federation,
 *   (event, request) => undefined,
 * );
 * ```
 *
 * @template TContextData A type of the context data for the
 *                        {@link Federation} object.
 * @param federation A {@link Federation} object to integrate with Nuxt.
 * @param contextDataFactory A function to create the context data for the
 *                           {@link Federation} object.
 * @returns An H3 event handler for use as Nuxt server middleware.
 * @since 2.2.0
 */
export function fedifyMiddleware<TContextData>(
  federation: Federation<TContextData>,
  contextDataFactory: ContextDataFactory<TContextData>,
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
      // If the response is 406 Not Acceptable, we store it in the event
      // context so the error handler can return it when the actual handler
      // responds with a 404 Not Found:
      if (response.status === 406) {
        event.context["__fedify_response__"] = response;
        return;
      }
      await event.respondWith(response);
    },
  });
}

/**
 * An error handler that responds with a 406 Not Acceptable if Fedify
 * responded with a 406 Not Acceptable and the actual handler responded with
 * a 404 Not Found.
 *
 * If Fedify responded with a 406 Not Acceptable and later on the actual
 * handler responded with a 404 Not Found, then we consider it failed
 * to negotiate a response.  For example, if Fedify has an endpoint `/foo`
 * that supports only `application/activity+json` and the handler has no
 * endpoint `/foo` at all, then when a client requests `/foo` with
 * `Accept: text/html`, it should respond with 406 Not Acceptable.
 *
 * @example server/error.ts
 * ``` typescript
 * import { onError } from "@fedify/nuxt";
 *
 * export default onError;
 * ```
 *
 * @param error The error that occurred.
 * @param event The event that triggered the handler.
 * @since 2.2.0
 */
export async function onError(
  error: H3Error<unknown>,
  event: H3Event<EventHandlerResponse>,
): Promise<void> {
  if (
    "__fedify_response__" in event.context &&
    event.context["__fedify_response__"].status === 406 &&
    error.statusCode === 404
  ) {
    await event.respondWith(event.context["__fedify_response__"]);
  }
}
