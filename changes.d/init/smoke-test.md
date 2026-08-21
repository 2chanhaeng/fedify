---
links:
  '#990': https://github.com/fedify-dev/fedify/pull/990
---
 -  Added a `test` task to projects scaffolded by `fedify init`.  It starts
    the app, waits for it to become ready on any loopback address, and checks
    that it resolves a local actor, giving projects a standard smoke test to
    run right after scaffolding and whenever the app changes afterwards.  Pass
    `--skip-smoke-test` to omit the smoke-test script and task.
    [[#898], [#994], [#990] by Jang Hanarae]
