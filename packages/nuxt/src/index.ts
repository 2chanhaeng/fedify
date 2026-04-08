/**
 * Fedify with Nuxt
 * ================
 *
 * This package provides a [Nuxt] module to integrate with Fedify.
 *
 * [Nuxt]: https://nuxt.com/
 *
 * @module
 * @since 2.2.0
 */

import type { H3Event } from "h3";
import {
  addServerScanDir,
  addServerTemplate,
  createResolver,
  defineNuxtModule,
} from "nuxt/kit";

/**
 * A factory function that creates the context data that will be passed to the
 * `Federation` instance.
 *
 * @template TContextData The type of the context data that will be passed to
 *                        the `Federation` instance.
 * @param event The current h3 event.
 * @param request The Web API request derived from the current event.
 * @returns The context data that will be passed to the `Federation` instance.
 *          This can be a promise that resolves to the context data.
 * @since 2.2.0
 */
export type ContextDataFactory<TContextData> = (
  event: H3Event,
  request: Request,
) => Promise<TContextData> | TContextData;

interface NuxtFederationModuleOptions {
  /**
   * The module specifier of the file that default-exports the `Federation`
   * instance.
   */
  federation: string;
  /**
   * The optional module specifier of the file that default-exports the context
   * data factory.
   */
  contextDataFactory?: string;
}

/**
 * Nuxt module that registers Fedify as Nitro server middleware and wires the
 * application's `Federation` instance into the generated runtime files.
 *
 * @since 2.2.0
 */
const fedifyModule: ReturnType<
  typeof defineNuxtModule<NuxtFederationModuleOptions>
> = defineNuxtModule<NuxtFederationModuleOptions>({
  meta: {
    name: "@fedify/nuxt",
    configKey: "fedify",
    compatibility: {
      nuxt: "^3.0.0 || ^4.0.0",
    },
  },
  defaults: {
    federation: "~~/server/federation",
  },
  setup(options) {
    const resolver = createResolver(import.meta.url);

    addServerTemplate({
      filename: "#fedify/nuxt-config.mjs",
      getContents: () => renderNuxtConfigTemplate(options),
    });

    addServerScanDir(resolver.resolve("../src/runtime/server"));
  },
});

export default fedifyModule;

function renderNuxtConfigTemplate(
  options: NuxtFederationModuleOptions,
): string {
  const lines = [
    `import federation from ${JSON.stringify(options.federation)};`,
  ];
  if (options.contextDataFactory != null) {
    lines.push(
      `import createContextData from ${
        JSON.stringify(options.contextDataFactory)
      };`,
    );
  } else {
    lines.push("const createContextData = () => undefined;");
  }
  lines.push("export { createContextData, federation };");
  return lines.join("\n");
}
