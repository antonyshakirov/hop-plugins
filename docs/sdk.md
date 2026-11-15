# SDK v1

Call `definePlugin()` once with an object containing any of `activate(context)`, `onEvent(event, context)` and `onAction(action, context)`. Handlers return a contribution object synchronously. A missing handler or a return without a value makes no change. The runtime uses a bare JavaScript context inside a sandboxed XPC service; it is not Node.js or a browser.

## Permissions and context

| Capability | Access |
| --- | --- |
| `ui.theme` | Override known theme tokens without changing base preferences |
| `ui.panel` | Append or replace panel content with native controls |
| `timer.read` | Read `context.timer` and receive `timer.finished` |
| `timer.control` | Return start/stop commands for the timer |
| `system.read` | Read `context.system` CPU and memory snapshots |

`context.settings` contains validated manifest settings. Each setting has `key`, `label`, `type` and `default`. Types are `string`, `boolean` and `integer`; integer settings can also specify `min` and `max`. Settings belong to the plugin and do not change Hop's base preferences.

`context.system.cpu` and `context.system.memory` are fractions from 0 to 1, or `null` when unavailable. Memory is used memory divided by total memory. These values come from the existing system monitor snapshot. Reading them does not enable a disabled monitor or start another collector.

`context.timer` contains `state`, `remaining`, `duration`, `session`, `revision` and `startedByPlugin`. Times are seconds. Completion events contain `type: "timer.finished"`, `session`, `revision` and `startedByPlugin`. A timer started by any plugin sets `startedByPlugin` to true, so the Auto break example ignores its completion. Manual changes supersede older plugin commands; putting a different revision in a JavaScript response cannot authorize a stale command.

## Contributions

`theme` contains optional `light` and `dark` token maps: `accent`, `background`, `foreground`, `secondary`, `surface`, `line`. Colors use hex notation. Optional `fontScale` is bounded by the app. `panel` contains `mode: "replace" | "append"`, optional width from 300 to 800, and a `nodes` array. Native nodes are text, button, divider, spacer, row, column, or a built-in module slot. A button calls `onAction` with its action string. Trees are limited to 256 nodes, depth 8 and 4096 characters per text field.

Omitting `theme` or `panel` retains that plugin's previous contribution. Returning `null` clears it. `commands` are one-shot actions: `{type: "timer.start", seconds: 300}` or `{type: "timer.stop"}`. The app validates the entire contribution before applying any part.

## Limits and recovery

Packages are at most 1 MiB; JavaScript source is at most 256 KiB. Only JSON packages are accepted. The app verifies the catalog signature, package digest, identity, API version and requested permissions before installation. Installation does not evaluate JavaScript.

Enabling requires explicit permission approval. Disabling removes overlays and event handling while retaining settings. A runtime crash or timeout restores core UI and quarantines the affected package digest. The runtime is shared across enabled plugins, so a crash can pause other active plugins too. Separate JavaScript contexts are not separate operating-system processes.

Hop keeps native recovery controls and a safe launch mode independent of plugin content. Unknown API versions and revoked packages remain inactive. Saved settings and the user's desired enablement survive app replacement, but compatibility and permission checks still apply before execution.
