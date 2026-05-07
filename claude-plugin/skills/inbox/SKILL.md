---
name: inbox
description: >-
  Help the user set up Fedify inbox listeners for handling incoming
  ActivityPub activities. Use when the user needs to handle Follow, Like,
  Announce, Create, Undo, or other activity types delivered to their inbox.
---

Help the user configure Fedify inbox listeners.

Walk through:

1.  Calling `setInboxListeners(inboxPath, sharedInboxPath?)` on the
    `Federation` / `FederationBuilder`.
2.  Chaining `.on(ActivityType, handler)` for each activity type to handle
    (`Follow`, `Create`, `Undo`, `Like`, `Announce`, etc.).
3.  Adding `.onError(handler)` for error logging.
4.  Optionally adding `.onUnverifiedActivity(handler)` if the user needs
    to inspect activities that failed signature verification.
5.  Using `.withIdempotency(strategy)` to avoid duplicate processing.
6.  Noting that activity types with no registered handler receive HTTP 202
    and are logged as unsupported: add a catch-all on the base `Activity`
    class if needed.

Reference: <https://fedify.dev/manual/inbox>
