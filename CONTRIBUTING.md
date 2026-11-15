# Contribute a plugin

Submit one plugin per pull request. Include `plugins/<id>/manifest.json`, `plugins/<id>/plugin.js`, and the generated `packages/<id>-<version>.hopplugin` file. Use a unique id and a new version for every behavior change. Describe the visible result, the permissions it needs and how you tested it in Hop Dev.

Run the tests and build commands in the README. A changed catalog will not match the published signature until a maintainer reviews and signs it. Do not change `catalog.json.sig`, the public key, workflows or validation scripts as part of an ordinary plugin contribution.

Keep the plugin disabled on installation. Do not add code that downloads or evaluates other code. SDK v1 has no file, network, process, hardware or sleep capabilities. Request only the supported permissions used by your plugin. Handle repeated events without starting a timer loop, and let the user's manual actions take priority.

Test enabling, disabling, changing settings, restarting Hop Dev and using both light and dark themes. For a custom panel, check a small display and long text. Verify that disabling the plugin restores the existing panel and theme. For timer behavior, check completion, cancellation and manual timer changes.

Contributions are licensed under this repository's MIT license. Maintainers may request changes, decline a plugin, or revoke a published package that causes harm. A merged contribution does not enable the plugin for anyone.
