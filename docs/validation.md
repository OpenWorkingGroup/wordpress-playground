# Starter validation — v1.0.0

Validated on macOS using the installed official WordPress Playground extension 0.1.72's worker, with its default PHP 7.4 and latest WordPress selection, in isolated temporary project directories on port 9427. Existing development servers were not stopped or changed.

- The extension detected the starter as wp-content mode.
- The homepage returned HTTP 200 and rendered the bundled Twenty Twenty-Five theme.
- Two fixture plugins were discovered in WordPress, activated through wp-admin, and executed together on the homepage.
- New files under plugins/ and subsequent source edits were immediately served without a synchronization step.
- Native WP-CLI packaging produced an installable fixture ZIP, excluded .env as directed by .distignore, and generated a checksum.

The worker was exercised directly with the same startup message used by VS Code. Clicking Start Server in the editor remains a manual UI check. First-use downloads require network access; this test reused the extension's existing WordPress/PHP cache. GitHub Actions results are separate from these local checks.

The repository's GitHub template flag was enabled and confirmed through the API. Template creation does not establish automatic upstream updates.
