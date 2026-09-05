import deps from "../json/deps.json" with { type: "json" };
import { PACKAGE_VERSION } from "../lib.ts";
import type { WebFrameworkInitializer } from "../types.ts";

export const defaultDevDependencies = {
  "@fedify/lint": PACKAGE_VERSION,
  "oxfmt": deps["npm:oxfmt"],
  "oxlint": deps["npm:oxlint"],
};

export const defaultDenoDependencies = {
  "@fedify/lint": PACKAGE_VERSION,
};

/**
 * TypeScript compiler options shared by the Node.js and Bun projects that run
 * TypeScript sources directly through the runtime's type stripping.
 */
export const nodeCompilerOptions = {
  "lib": ["ESNext", "DOM"],
  "target": "ESNext",
  "module": "NodeNext",
  "moduleResolution": "NodeNext",
  "allowImportingTsExtensions": true,
  "verbatimModuleSyntax": true,
  "noEmit": true,
  "strict": true,
} as const satisfies WebFrameworkInitializer["compilerOptions"];
