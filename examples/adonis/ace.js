process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.TZ = process.env.TZ || "UTC";

await import("./bin/console.js");
