# Crystra UI release path

`crystra-ui-core@0.1.0` is an ordinary dependency delivered as an exact GitHub Release tarball. It is not a DSH plugin and requires no public npm publishing. The single user-facing plugin is `dsh-crystra` from `crystra-dsh`.

The component evolves on its own `main`. A push to `release/next` with `release/request.json` containing `candidate_tag: crystra-ui-v0.1.0-rc.1` qualifies that exact component commit. No superproject checkout, pin or authority ref is required. Package version bytes are stable before qualification so promotion reuses the exact archive.

The candidate workflow runs formatting, lint, type checks, tests, package and React 18 consumer checks, dependency inventory, browser tests and Docker smoke checks. It reads back exact uploaded bytes. Promotion remains manual and creates `crystra-ui-v0.1.0` from the qualified candidate without rebuilding or publishing to npm.

Remote repository rename and CRYSTRA release App configuration are performed during T5. Development checks may run before those publishing coordinates are active.
