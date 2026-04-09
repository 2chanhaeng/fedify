import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { PackageManager, WebFrameworkDescription } from "../types.ts";
import { getInstruction } from "./utils.ts";

const PACKAGE_MANAGERS = ["pnpm", "bun", "yarn", "npm"] as const;

const adonisjsDescription: WebFrameworkDescription = {
  label: "AdonisJS",
  packageManagers: PACKAGE_MANAGERS,
  defaultPort: 3333,
  init: async ({ packageManager: pm }) => ({
    command: getAdonisInitCommand(pm),
    dependencies: {
      "@fedify/adonisjs": PACKAGE_VERSION,
    },
    federationFile: "start/federation.ts",
    loggingFile: "start/logging.ts",
    files: {
      "app/middleware/fedify_middleware.ts": await readTemplate(
        "adonisjs/app/middleware/fedify_middleware.ts",
      ),
      "start/kernel.ts": await readTemplate("adonisjs/start/kernel.ts"),
      "start/routes.ts": await readTemplate("adonisjs/start/routes.ts"),
    },
    instruction: getInstruction(pm, 3333),
  }),
};

export default adonisjsDescription;

const getAdonisInitCommand = (pm: PackageManager): string[] => [
  ...createAdonisAppCommand(pm),
  ".",
  "--kit=slim",
  "--git-init=false",
  `--pkg=${pm}`,
];

const createAdonisAppCommand = (pm: PackageManager): string[] =>
  pm === "bun"
    ? ["bunx", "create-adonisjs@2.4.1"]
    : pm === "npm"
    ? ["npx", "create-adonisjs@2.4.1"]
    : [pm, "dlx", "create-adonisjs@2.4.1"];
