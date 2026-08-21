 -  Fixed `fedify init` so that the Astro, Next.js, Nuxt, SolidStart, and
    SvelteKit projects it generates for Deno install and start correctly.
    Packages that these frameworks' bundlers load, such as `@fedify/fedify`
    and `@logtape/logtape`, are now resolved through npm because Vite and
    Turbopack cannot resolve JSR imports, and `@std/dotenv` is no longer added
    to such projects.  The Astro and Next.js Deno tasks now run the installed
    framework, `nuxi` and `create-next-app` are invoked through `deno run`,
    SolidStart bundles `@solidjs/router` into its Deno server build and
    configures LogTape synchronously, and `npm` installs Nuxt projects with
    `--legacy-peer-deps` to work around an npm dependency resolver crash.
