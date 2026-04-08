import type { Federation } from "@fedify/fedify";
import { type ContextDataFactory, integrateFederation } from "@fedify/h3";
import type { EventHandler } from "h3";

export type { ContextDataFactory };

/**
 * Creates an event handler for Nuxt (which is built on top of H3) to handle
 * federation requests.
 * @param federation The federation instance.
 * @param contextDataFactory A factory that creates the context data for the federation.
 * @returns An H3 event handler.
 */
export function fedifyHandler<TContextData>(
  federation: Federation<TContextData>,
  contextDataFactory: ContextDataFactory<TContextData>,
): EventHandler {
  return integrateFederation(federation, contextDataFactory);
}
