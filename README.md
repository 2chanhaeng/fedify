<!-- deno-fmt-ignore-file -->

@fedify/redis: Redis drivers for Fedify
=======================================

[![JSR][JSR badge]][JSR]
[![npm][npm badge]][npm]
[![GitHub Actions][GitHub Actions badge]][GitHub Actions]

This package provides [Fedify]'s [`KvStore`] and [`MessageQueue`]
implementations for Redis:

 -  [`RedisKvStore`]
 -  [`RedisMessageQueue`]

~~~~ typescript
import { createFederation } from "@fedify/fedify";
import { RedisKvStore, RedisMessageQueue } from "@fedify/redis";
import { Redis } from "ioredis";

const federation = createFederation({
  kv: new RedisKvStore(new Redis()),
  queue: new RedisMessageQueue(() => new Redis()),
});
~~~~

[JSR]: https://jsr.io/@fedify/redis
[JSR badge]: https://jsr.io/badges/@fedify/redis
[npm]: https://www.npmjs.com/package/@fedify/redis
[npm badge]: https://img.shields.io/npm/v/@fedify/redis?logo=npm
[GitHub Actions]: https://github.com/dahlia/fedify-redis/actions/workflows/main.yaml
[GitHub Actions badge]: https://github.com/dahlia/fedify-redis/actions/workflows/main.yaml/badge.svg
[Fedify]: https://fedify.dev/
[`KvStore`]: https://jsr.io/@fedify/fedify/doc/federation/~/KvStore
[`MessageQueue`]: https://jsr.io/@fedify/fedify/doc/federation/~/MessageQueue
[`RedisKvStore`]: https://jsr.io/@fedify/redis/doc/kv/~/RedisKvStore
[`RedisMessageQueue`]: https://jsr.io/@fedify/redis/doc/mq/~/RedisMessageQueue


Installation
------------

### Deno

~~~~ sh
deno add @fedify/redis
~~~~

### Node.js

~~~~ sh
npm install @fedify/redis
~~~~

### Bun

~~~~ sh
bun add @fedify/redis
~~~~


Changelog
---------

### Version 0.2.0

To be released.

 -  Let `RedisMessageQueue` follow up the latest `MessageQueue` interface,
    which was updated in Fedify 1.0.0.
 -  Added some example code.

### Version 0.1.1

Released on June 22, 2024.

 -  Exported `@fedify/redis/mq` module.

### Version 0.1.0

Initial release.  Released on June 22, 2024.
