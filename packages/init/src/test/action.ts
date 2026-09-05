import { pipe, tap, when } from "@fxts/core";
import type { TestInitCommand } from "../command.ts";
import { set } from "../utils.ts";
import {
  checkRequiredDbs,
  isWithDb,
  startRequiredDbs,
  stopRequiredDbs,
} from "./db.ts";
import { fillEmptyOptions } from "./fill.ts";
import runTests from "./run.ts";
import {
  emptyTestDir,
  genRunId,
  genTestDirPrefix,
  logTestDir,
} from "./utils.ts";

const runTestInit = (options: TestInitCommand) =>
  pipe(
    options,
    set("runId", genRunId),
    set("testDirPrefix", genTestDirPrefix),
    tap(emptyTestDir),
    fillEmptyOptions,
    tap(when(isWithDb, startRequiredDbs)),
    tap(checkRequiredDbs),
    tap(logTestDir),
    tap(when(isDryRun, runTests(true))),
    tap(when(isHydRun, runTests(false))),
    tap(when(isWithDb, stopRequiredDbs)),
  );

const isDryRun = <T extends { dryRun: boolean }>({ dryRun }: T) => dryRun;
const isHydRun = <T extends { hydRun: boolean }>({ hydRun }: T) => hydRun;

export default runTestInit;
