/**
 * Fedify with AdonisJS
 * ====================
 *
 * This package provides an [AdonisJS] server middleware factory to integrate
 * with Fedify.
 *
 * [AdonisJS]: https://adonisjs.com/
 *
 * @module
 */
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import type { Federation } from "@fedify/fedify";
import { Readable } from "node:stream";

/**
 * A factory function that creates context data for the Federation instance.
 */
export type ContextDataFactory<TContextData> = (
  ctx: HttpContext,
) => TContextData | Promise<TContextData>;

type MiddlewareClass = new () => {
  handle(ctx: HttpContext, next: NextFn): Promise<void>;
};

const delegatedResponse = new Response("", { status: 404 });

/**
 * Creates an AdonisJS server middleware class that integrates Fedify.
 *
 * The returned class can be exported as the default export from an AdonisJS
 * middleware module and registered using `server.use()`.
 */
export function fedifyMiddleware<TContextData>(
  federation: Federation<TContextData>,
  contextDataFactory: ContextDataFactory<TContextData>,
): MiddlewareClass {
  return class FedifyMiddleware {
    async handle(ctx: HttpContext, next: NextFn): Promise<void> {
      const contextData = await contextDataFactory(ctx);

      const response = await federation.fetch(toRequest(ctx), {
        contextData,
        onNotFound: async () => {
          await next();
          return delegatedResponse;
        },
        onNotAcceptable: async () => {
          await next();
          if (ctx.response.getStatus() !== 404) return delegatedResponse;
          return new Response("Not acceptable", {
            status: 406,
            headers: {
              "Content-Type": "text/plain",
              Vary: "Accept",
            },
          });
        },
      });

      if (response === delegatedResponse) return;
      setResponse(ctx, response);
    }
  };
}

function toRequest(ctx: HttpContext): Request {
  const headers = new Headers();
  for (const [key, value] of Object.entries(ctx.request.headers())) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (typeof value === "string") {
      headers.append(key, value);
    }
  }

  return new Request(ctx.request.completeUrl(true), {
    method: ctx.request.method(),
    headers,
    // Required by Node.js when using a request body stream.
    // @ts-expect-error Node.js RequestInit supports duplex, but DOM typings do not.
    duplex: "half",
    body: ctx.request.method() === "GET" || ctx.request.method() === "HEAD"
      ? undefined
      : Readable.toWeb(ctx.request.request) as ReadableStream,
  });
}

function setResponse(ctx: HttpContext, response: Response): void {
  clearResponse(ctx);
  ctx.response.status(response.status);

  const headers = response.headers;
  const setCookie = (
    headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie?.() ?? [];

  for (const [key, value] of headers.entries()) {
    if (key === "set-cookie") continue;
    ctx.response.header(key, value);
  }
  for (const value of setCookie) {
    ctx.response.append("set-cookie", value);
  }

  if (response.body == null) {
    ctx.response.finish();
    return;
  }

  ctx.response.stream(
    Readable.fromWeb(response.body as ReadableStream<Uint8Array>),
  );
}

function clearResponse(ctx: HttpContext): void {
  for (const name of Object.keys(ctx.response.getHeaders())) {
    ctx.response.removeHeader(name);
  }
}
