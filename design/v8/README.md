# Accepted Sidebar source

`sidebar.source.html` is an immutable snapshot of the accepted design. Its SHA256 is recorded in `provenance.json`; formatting this file would invalidate byte-level provenance, so it alone is excluded from Prettier.

The active implementation is in `packages/bi/src/components/v8-sidebar/`. Runtime, template and styles are formatted and linted normally. The duplicated, non-executable intermediate interaction fragment has been removed; the snapshot and active runtime retain the source and adapter behavior.

The imperative legacy runtime has a file-scoped TypeScript-checking exception during incremental typing. ESLint remains enabled except for the rule forbidding that explicitly documented directive. React portal registration has a single line exception because its targets exist only after the accepted DOM mounts, and portals must be populated before paint. Neither exception disables the surrounding React or browser checks.
