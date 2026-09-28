# Remote integration — 2026-09-28

Merged remote main `7319207` (including `073507c`) into the accepted local UI history.
The histories contain independent implementations of the same v8 migration, not a
linear sequence of fixes. The integration retains the local implementation tree
from `454b613`; the remote commits remain reachable through the merge parent.

Resolution follows the accepted package boundary and current 3085 implementation:

- Remote CrystraShell mounts HTML plus imperative sidebar runtime in the UI package.
  The accepted sidebar belongs to Crystra-dsh; reintroducing it here would create
  a second host shell and violate that boundary.
- Retain the local TSX workbench/browser components, shared menu behavior and Header
  navigation slots. Do not replace them with the parallel draft/portal assembly.
- Retain recorded-time Analysis hooks, independent metadata and Trace requests,
  metric adapters and host-controlled preferences; remote Analysis precedes these.
- Remote exploration fixtures, old browser tests and release-request changes belong
  to that parallel assembly. They are not copied into the accepted runtime or used
  as release authority. Their exact source remains in the merged remote history.

This is an explicit supersession resolution, not a claim that the two source trees
were identical. No UI release is requested by this synchronization.
