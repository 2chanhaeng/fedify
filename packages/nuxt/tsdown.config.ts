import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/mod.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
});
