// Resolves the skills/fedify symlink to real files before npm pack, and
// restores the symlink afterwards.  Only acts when the path is a symlink;
// a real directory is left untouched in both directions.
import {
  cpSync,
  existsSync,
  lstatSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const skillsPath = join(root, "..", "skills", "fedify");
const sentinel = join(root, "..", ".skills-fedify-symlink");

const [cmd] = process.argv.slice(2);

if (cmd === "pre") {
  const stat = lstatSync(skillsPath);
  if (stat.isSymbolicLink()) {
    const target = realpathSync(skillsPath);
    rmSync(skillsPath, { recursive: true });
    cpSync(target, skillsPath, { recursive: true });
    writeFileSync(sentinel, "");
  } else if (!stat.isDirectory()) {
    throw new Error(
      `skills/fedify is neither a symlink nor a directory (got mode ${
        stat.mode.toString(8)
      }). ` +
        "On Windows, check core.symlinks in git config.",
    );
  }
} else if (cmd === "post") {
  if (existsSync(sentinel)) {
    rmSync(skillsPath, { recursive: true });
    symlinkSync("../../../claude-plugin/skills/fedify", skillsPath);
    unlinkSync(sentinel);
  }
}
