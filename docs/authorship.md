# Authorship and reuse

The SDK and its first-party examples are open source under MIT. There is no third-party pack intake or endorsement service. Independently shared packs retain their actual licenses; compatibility alone does not impose MIT or transfer copyright. A public repository alone does not grant permission to copy code; the explicit license supplies the permission and conditions. The repository license covers the catalog infrastructure; each plugin also carries its own full license and copyright notices.

Keep `manifest.author` as the author's chosen public name or organization. It appears in the catalog and installed plugin list. Keep all copyright holders in `plugins/<id>/LICENSE`; additional contributors do not replace earlier holders. The builder embeds the complete file in the package's JavaScript comment, and the signed catalog binds the resulting bytes. Installation and app updates preserve the package bytes and author metadata outside the app bundle.

Authors retain copyright. MIT permits copying, modifying, merging, distributing and commercial use subject to preserving its copyright and permission notices in copies or substantial portions. It does not itself promise payment or require a separate agreement for each permitted reuse. These are license permissions, not a transfer of authorship or ownership.

If a plugin becomes a built-in Hop feature, the integration must retain all required notices in the distributed application. Our contribution policy also requires acknowledging the plugin author and source in Hop's credits. The feature may be adapted or rewritten; do not present copied work as originally authored by Hop. An integration may also need a migration plan for users of the former plugin. No plugin is incorporated into the core by adding it to this catalog.

A contributor must have the right to license every included part. Check third-party code, dependencies and other material separately; a newly added MIT file cannot relicense someone else's work. A plugin from outside this catalog keeps its actual license. Different licenses may impose different obligations; obtain suitable permission before copying when the terms do not allow the intended integration.

References: [MIT license](https://opensource.org/license/mit), [GitHub licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).
