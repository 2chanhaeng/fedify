/**
 * Fedify with Nuxt
 * ================
 *
 * This package provides a [Nuxt] module and server middleware helpers
 * to integrate with Fedify.
 *
 * Because Nuxt builds on top of [Nitro] and [h3], the actual middleware
 * is implemented by re-exporting `integrateFederation()` and `onError()`
 * from `@fedify/h3`.  In addition, this package ships a Nuxt module that
 * automatically configures Nitro and Vite for Fedify compatibility.
 *
 * [Nuxt]: https://nuxt.com/
 * [Nitro]: https://nitro.build/
 * [h3]: https://h3.dev/
 *
 * @module
 * @since 2.2.0
 */

export type { ContextDataFactory } from "@fedify/h3";
export { integrateFederation, onError } from "@fedify/h3";

/**
 * The minimal shape of the Nuxt instance that {@link fedifyModule} reads
 * from and writes to.  Defined locally so that this package does not need
 * a hard dependency on `@nuxt/kit`/`@nuxt/schema`.
 */
interface NuxtLike {
  options: {
    nitro?: {
      esbuild?: {
        options?: {
          target?: string | string[];
        };
      };
    };
    vite?: {
      ssr?: {
        noExternal?: true | string | RegExp | (string | RegExp)[];
      };
    };
  };
}

const FEDIFY_NO_EXTERNAL: readonly string[] = [
  "@fedify/fedify",
  "@fedify/vocab",
];

/**
 * A [Nuxt module] that prepares a Nuxt application for Fedify integration.
 *
 * Add it to the `modules` array in your `nuxt.config.ts`:
 *
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
 * The module performs two adjustments:
 *
 * 1.  Sets `nitro.esbuild.options.target` to `"esnext"` so that modern
 *     JavaScript syntax used by `@fedify/fedify` (such as
 *     `using` declarations) is preserved during the Nitro build.
 * 2.  Adds `@fedify/fedify` and `@fedify/vocab` to
 *     `vite.ssr.noExternal` so that Vite bundles them for SSR rather
 *     than treating them as external CommonJS modules.
 *
 * Existing user configuration is respected: arrays are appended to,
 * `true` (which already includes everything) is left alone, and any
 * single-string or RegExp value is preserved alongside the Fedify entries.
 *
 * Server middleware and the error handler are still added by the user
 * (`server/middleware/federation.ts` and `server/error.ts`) using
 * {@link integrateFederation} and {@link onError}.
 *
 * [Nuxt module]: https://nuxt.com/docs/guide/going-further/modules
 *
 * @since 2.2.0
 */
const fedifyModule = function fedifyModule(
  _inlineOptions: unknown,
  nuxt: NuxtLike,
): void {
  const nitro = (nuxt.options.nitro ??= {});
  const esbuild = (nitro.esbuild ??= {});
  const esbuildOptions = (esbuild.options ??= {});
  esbuildOptions.target = "esnext";

  const vite = (nuxt.options.vite ??= {});
  const ssr = (vite.ssr ??= {});
  const noExternal = ssr.noExternal;
  if (noExternal === true) return;
  if (Array.isArray(noExternal)) {
    for (const pkg of FEDIFY_NO_EXTERNAL) {
      if (!noExternal.includes(pkg)) noExternal.push(pkg);
    }
  } else if (noExternal == null) {
    ssr.noExternal = [...FEDIFY_NO_EXTERNAL];
  } else {
    ssr.noExternal = [noExternal, ...FEDIFY_NO_EXTERNAL];
  }
};

// Tell Nuxt's module installer about this module.  Nuxt looks for
// `__nuxt_module_meta__` (or a `meta` property) on function modules to
// deduplicate them and surface a friendly name in build output.
(fedifyModule as unknown as {
  __nuxt_module_meta__: { name: string; configKey: string };
}).__nuxt_module_meta__ = {
  name: "@fedify/nuxt",
  configKey: "fedify",
};

export { fedifyModule };
export default fedifyModule;
