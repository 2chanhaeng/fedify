 -  Changed the Node.js projects scaffolded by `fedify init` to run TypeScript
    through Node.js's built-in type stripping and to load *.env* with
    `node --env-file` instead of depending on `tsx` and `@dotenvx/dotenvx`.
    The generated `dev`, `prod`, and `test` tasks no longer pull in either
    package, so `fedify init` now requires Node.js 22.18.0 or later.  Astro
    and SvelteKit projects read environment variables through
    `import.meta.env` and `$env/dynamic/private`, which their dev servers
    populate from *.env*, and Hono projects now scaffold *src/app.ts* instead
    of *src/app.tsx*.
