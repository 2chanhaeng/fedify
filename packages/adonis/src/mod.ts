/**
 * Fedify with AdonisJS
 * ====================
 *
 * This package provides an [AdonisJS] middleware to integrate with the Fedify.
 *
 * [AdonisJS]: https://adonisjs.com/
 *
 * @module
 */
import type {
  Federation,
  FederationFetchOptions,
} from "@fedify/fedify/federation";
import { Buffer } from "node:buffer";
import type { IncomingHttpHeaders, IncomingMessage } from "node:http";
import { Readable } from "node:stream";

/**
 * Minimal interface for AdonisJS's {@link HttpContext}.
 *
 * Defined locally to avoid a hard dependency on `@adonisjs/core`.
 */
interface AdonisHttpContext {
  request: {
    request: IncomingMessage;
    protocol(): string;
    hostname(): string | null;
    url(includeQueryString?: boolean): string;
    method(): string;
    headers(): IncomingHttpHeaders;
  };
  response: {
    response: import("node:http").ServerResponse;
    getStatus(): number;
  };
  route?: unknown;
}

/**
 * A factory function to create a context data for the {@link Federation}
 * object.
 *
 * @template TContextData A type of the context data for the {@link Federation}
 *                         object.
 * @param ctx An AdonisJS HTTP context.
 * @returns A context data for the {@link Federation} object.
 */
export type ContextDataFactory<TContextData> = (
  ctx: AdonisHttpContext,
) => TContextData | Promise<TContextData>;

/**
 * Create an AdonisJS middleware class to integrate with the {@link Federation}
 * object.
 *
 * AdonisJS server middleware must be a class with a `handle` method.  This
 * function returns such a class, which can be exported as the default export
 * from a middleware file.
 *
 * @example
 * ~~~~typescript
 * // app/middleware/fedify_middleware.ts
 * import { fedifyMiddleware } from "@fedify/adonis";
 * import federation from "#start/federation";
 *
 * export default fedifyMiddleware(federation, () => undefined);
 * ~~~~
 *
 * @template TContextData A type of the context data for the
 *                         {@link Federation} object.
 * @param federation A {@link Federation} object to integrate with AdonisJS.
 * @param contextDataFactory A factory function to create context data for the
 *                           {@link Federation} object.  Defaults to returning
 *                           `undefined`.
 * @returns An AdonisJS middleware class with a `handle` method.
 */
export function fedifyMiddleware<TContextData>(
  federation: Federation<TContextData>,
  contextDataFactory: ContextDataFactory<TContextData> =
    (() => undefined as TContextData),
): {
  new (): {
    handle(
      ctx: AdonisHttpContext,
      next: () => Promise<unknown>,
    ): Promise<void>;
  };
} {
  return class FedifyMiddleware {
    async handle(
      ctx: AdonisHttpContext,
      next: () => Promise<unknown>,
    ): Promise<void> {
      const request = fromAdonisRequest(ctx);
      let contextData = contextDataFactory(ctx);
      if (contextData instanceof Promise) contextData = await contextData;
      const response = await federation.fetch(request, {
        contextData,
        ...integrateFetchOptions(ctx, next),
      });
      if (response.ok || response.redirected) {
        await sendWebResponse(ctx, response);
      }
    }
  };
}

export default fedifyMiddleware;

function integrateFetchOptions(
  ctx: AdonisHttpContext,
  next: () => Promise<unknown>,
): Omit<FederationFetchOptions<void>, "contextData"> {
  return {
    // If the `federation` object finds a request not responsible for it
    // (i.e., not a federation-related request), it will call the `next`
    // provided by the AdonisJS framework to continue the request handling
    // by AdonisJS:
    async onNotFound(): Promise<Response> {
      await next();
      return new Response("Not found", { status: 404 });
    },

    // Similar to `onNotFound`, but slightly more tricky one.
    // When the `federation` object finds a request not acceptable type-wise
    // (i.e., a user-agent doesn't want JSON-LD), it will call the `next`
    // provided by the AdonisJS framework so that it renders HTML if there's
    // some page.  Otherwise, it will simply return a 406 Not Acceptable
    // response.  This kind of trick enables Fedify and AdonisJS to share the
    // same routes and they do content negotiation depending on `Accept`
    // header:
    async onNotAcceptable(): Promise<Response> {
      await next();
      if (ctx.response.getStatus() === 404) {
        return new Response("Not acceptable", {
          status: 406,
          headers: {
            "Content-Type": "text/plain",
            Vary: "Accept",
          },
        });
      }
      return new Response("", { status: ctx.response.getStatus() });
    },
  };
}

function fromAdonisRequest(ctx: AdonisHttpContext): Request {
  const req = ctx.request;
  const protocol = req.protocol();
  const hostname = req.hostname() ?? "localhost";
  const url = `${protocol}://${hostname}${req.url(true)}`;
  const headers = new Headers();
  const rawHeaders = req.headers();
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (typeof value === "string") {
      headers.append(key, value);
    }
  }
  const method = req.method();
  return new Request(url, {
    method,
    headers,
    // @ts-ignore: duplex is not supported in Deno, but it is in Node.js
    duplex: "half",
    body: method === "GET" || method === "HEAD"
      ? undefined
      : Readable.toWeb(req.request) as ReadableStream,
  });
}

async function sendWebResponse(
  ctx: AdonisHttpContext,
  response: Response,
): Promise<void> {
  const nodeResponse = ctx.response.response;
  nodeResponse.statusCode = response.status;
  for (const [key, value] of response.headers) {
    nodeResponse.setHeader(key, value);
  }
  if (response.body == null) {
    nodeResponse.end();
    return;
  }
  const reader = response.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      nodeResponse.write(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  nodeResponse.end();
}
