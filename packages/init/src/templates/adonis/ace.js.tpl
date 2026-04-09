/*
|--------------------------------------------------------------------------
| Ace entry point
|--------------------------------------------------------------------------
|
| The "ace.js" file is the entrypoint for running ace commands.
| This file must not be renamed or moved.
|
*/

process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.TZ = process.env.TZ || "UTC";

await import("./bin/console.js");
