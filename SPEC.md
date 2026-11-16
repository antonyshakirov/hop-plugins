# Catalog preview specification

The legacy preview catalog provides opt-in first-party example packages for the Hop Dev 2.6 SDK. Third-party pack intake is not supported. Stable 2.5 has no plugin runtime. New installations start with every plugin disabled. No catalog action can activate a plugin or update one automatically.

One source directory maps to one id and one versioned `.hopplugin` JSON artifact. The package contains only `formatVersion`, `manifest` and JavaScript `code`. The catalog binds identity, API version, metadata, capabilities, package URL and SHA-256. Exact catalog bytes are signed with a separate Ed25519 key. Signing keys never enter the repository or PR runner. Revision rollback protection belongs to the app's persisted catalog state.

`build` validates metadata, limits and JavaScript syntax, then generates deterministic packages and catalog bytes. It never evaluates plugin JavaScript. `check` compares those exact artifacts and verifies the committed signature. PR validation compares generated artifacts without requiring a new signature; the maintainer's final check verifies the signature before publication. CI has read-only repository access and no publish or signing operation.

The first examples are Desk panel (`ui.theme`, `ui.panel`) and Auto break (`timer.read`, `timer.control`). Neither is automatically installed or enabled. Desk panel uses existing timer/system module slots. Auto break ignores completion events from plugin-started timers and relies on the trusted host revision to reject commands after a manual change.

Acceptance: deterministic rebuild, metadata and size rejection, exact-byte signature rejection for tampering or a different key, package hash binding, no duplicate ids, no revoked listed hashes, no arbitrary package hosts, and syntax checking without execution. Installed App examples, UI, runtime isolation and recovery are separately verified by the Hop App workstream; the catalog checks do not substitute for those tests.

## Authorship and reuse

Every catalog plugin is open source under MIT. Its manifest author remains visible in the catalog and installed plugin list. Each source directory contains its own LICENSE with its copyright holders; the builder retains the complete text as a JavaScript comment in the downloadable package. Package format and SDK capabilities do not change. Removing or changing notices must change the digest and require a new version and catalog signature.

A contribution does not transfer copyright. Contributors must have the right to submit all included material under MIT and preserve prior notices. Contributors remain responsible for having the necessary rights; validation of a license file alone cannot establish ownership. Contributions may be incorporated into Hop, including commercial distributions, subject to the license. A built-in integration retains all required notices in the distributed application and records the plugin author/source in acknowledgements. No plugin code is being incorporated into the core by this change.

Acceptance: complete notice survives packaging, multiple original notices remain, missing/non-MIT/unsafe license text fails build, licensing never evaluates plugin code, attribution is not replaced with the maintainer's name, and unsigned/tampered artifacts cannot pass the signed catalog check.

## Owner clarification — 2026-11-17

Plugins customize existing Hop functions; genuinely new modules belong in the core project through its PR process. No community packages are installed with Hop. Users explicitly select, install and enable each package. These requirements are accepted. The owner rejects an official third-party marketplace, third-party pack PR moderation and a personal review obligation for every pack. Personal creation and independent sharing are the intended direction; research is required before choosing the final executable or data-only format. Current signed catalog v1 describes the existing Dev preview, not the final moderation model.
