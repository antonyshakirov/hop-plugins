# Catalog preview specification

The catalog provides opt-in community packages for the Hop Dev 2.6 SDK. Stable 2.5 has no plugin runtime. New installations start with every plugin disabled. No catalog action can activate a plugin or update one automatically.

One source directory maps to one id and one versioned `.hopplugin` JSON artifact. The package contains only `formatVersion`, `manifest` and JavaScript `code`. The catalog binds identity, API version, metadata, capabilities, package URL and SHA-256. Exact catalog bytes are signed with a separate Ed25519 key. Signing keys never enter the repository or PR runner. Revision rollback protection belongs to the app's persisted catalog state.

`build` validates metadata, limits and JavaScript syntax, then generates deterministic packages and catalog bytes. It never evaluates plugin JavaScript. `check` compares those exact artifacts and verifies the committed signature. PR validation compares generated artifacts without requiring a new signature; the maintainer's final check verifies the signature before publication. CI has read-only repository access and no publish or signing operation.

The first examples are Desk panel (`ui.theme`, `ui.panel`) and Auto break (`timer.read`, `timer.control`). Neither is automatically installed or enabled. Desk panel uses existing timer/system module slots. Auto break ignores completion events from plugin-started timers and relies on the trusted host revision to reject commands after a manual change.

Acceptance: deterministic rebuild, metadata and size rejection, exact-byte signature rejection for tampering or a different key, package hash binding, no duplicate ids, no revoked listed hashes, no arbitrary package hosts, and syntax checking without execution. Installed App examples, UI, runtime isolation and recovery are separately verified by the Hop App workstream; the catalog checks do not substitute for those tests.
