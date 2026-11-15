# Hop plugins — SDK v1 preview

Community plugins for changing Hop's panel, colors and timer behavior.

**Requires the Hop Dev 2.6.0 preview. Stable Hop 2.5 does not run plugins.** The SDK is under development; compatibility is limited to API version 1.

Every plugin starts disabled. Installing a package does not run its code. In Hop Dev, open **Settings → Plugins**, import a `.hopplugin` package or load the catalog, then enable the plugin and approve its permissions. Plugin settings and your choices are stored outside the application bundle so app updates can retain them. An incompatible or quarantined plugin stays paused until you resolve it.

| Plugin | Changes | Permissions |
| --- | --- | --- |
| Desk panel | Custom title and accent; timer and system monitor in a native panel | Panel, theme |
| Auto break | One break after your countdown; no repeated breaks | Read and control the timer |

Plugin panels keep Hop's recovery controls. Built-in module slots follow your existing module visibility. Plugins cannot access files, the network, processes, fans, sleep settings or the hardware helper through SDK v1.

## Create a plugin

Copy a folder under `plugins/`, choose a unique lowercase id, and edit `manifest.json` and `plugin.js`. The folder name must match the manifest id. Start with only the permissions you need. The current API is described in [sdk/hop.d.ts](sdk/hop.d.ts) and [docs/sdk.md](docs/sdk.md).

With Node.js 22 or newer:

```sh
node --test tests/*.test.mjs
node scripts/catalog.mjs build
```

The build writes one JSON `.hopplugin` file per plugin and updates `catalog.json`. Packages contain the manifest and JavaScript source. There are no dependencies to install. Validation compiles JavaScript for syntax checking without executing plugin code.

Open a pull request with your plugin folder and generated package. See [CONTRIBUTING.md](CONTRIBUTING.md). A maintainer reviews the behavior and permissions, increments the catalog revision and signs the resulting catalog. PR checks have no signing keys.

## Verify the catalog

```sh
node scripts/catalog.mjs check
```

This rebuilds expected bytes in memory, verifies each package hash and checks the Ed25519 signature over the exact catalog bytes. The public key is in `catalog-config.json`. Changing a package, catalog field or even catalog whitespace invalidates verification. Updating a plugin requires a user action; the catalog never activates or updates installed plugins automatically.

## Publish a catalog update

The maintainer sets a higher `revision` in `catalog-config.json`, rebuilds, reviews the generated changes, and signs using an owner-only key outside this repository:

```sh
node scripts/catalog.mjs build
node scripts/catalog.mjs sign --key /private/path/catalog-key.pem
node --test tests/*.test.mjs
node scripts/catalog.mjs check
```

Never add the signing key to Git or expose it to a pull request workflow. To revoke a package, remove it from the available plugin list and add its SHA-256 to `revokedSha256` in the next catalog revision. App-side checks reject lower catalog revisions and revoked packages. Fetching the catalog requires a user action.

The preview's isolation and app integration are verified separately in the Hop app. Catalog validation alone does not establish that a plugin is safe or that it works on every supported Mac.
