# Contribute to the SDK

This repository contains the experimental SDK1 implementation and first-party examples. We do not accept third-party customization packs for an official marketplace. Keep personal packs in your own repository or files and share them independently. Using Hop's format does not imply review or endorsement by Hop.

SDK documentation, validation and first-party example fixes may be proposed through a focused pull request. New independent Hop modules belong in the main Hop project. Describe the visible result, relevant permissions and checks. Do not include unrelated community packages or change publishing keys and workflows with an example change.

For SDK1 examples, retain `manifest.json`, `plugin.js` and the per-example `LICENSE`. The builder embeds the complete MIT text and copyright notices in the downloadable package. Use a new version for source or notice changes. The existing catalog files are compatibility fixtures for the Dev preview; they are not a new community submission service.

Run the tests and artifact validation commands in the README. Automatic validation must not execute plugin JavaScript. An unsigned artifact check is not a passing signed-catalog publication check.

SDK contributions use MIT. Submit only material that you own or have permission to distribute under the applicable terms, identify third-party material and preserve all original copyright and license notices. Do not replace another author's name with Hop or your own. Automated checks validate notice retention, not legal ownership.

You retain copyright. MIT permits use, modification and incorporation into Hop, including commercial distributions, subject to its notice requirements. Our integration policy also credits the original author and source in Hop's acknowledgements when their code is incorporated into the core. A PR does not transfer ownership, guarantee acceptance or create a payment agreement. Personal packs shared outside this project retain their own actual licenses. See [authorship and reuse](docs/authorship.md).
