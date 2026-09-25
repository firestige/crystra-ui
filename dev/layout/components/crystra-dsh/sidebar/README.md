# Sidebar

The authoritative design is `workflow-self-recursive/tmp/20260907/Crystra-ui-design/components/shell-and-sidebar.md`. This implementation follows its data-independent layout and interaction contract; design decisions are not redefined here.

The Sidebar belongs to **Crystra-dsh**, including its composition, interaction and host behavior. Its implementation is staged at `dev/layout/components/crystra-dsh/sidebar/sidebar.tsx` for directory-based migration. It is not exported by `crystra-ui-core`; it consumes that package’s public Icon and ExpandableSearchField primitives.

## Inputs and ownership

- `tasks`, `workflows`, `analysis`: owner-supplied records. Empty arrays render explicit empty states; no built-in sample records exist.
- `href`, `selected`, identity, title, status, time and attention are supplied by the owner. Display labels never become identity keys. DSH supplies routes using `src/client/navigation/sidebar-model.js`.
- `preferences`, `onPreferencesChange`: controlled sidebar width mode, independent disclosure states, sort/filter choices and revision label visibility. Host storage owns persistence. Transient search and menus are local UI state.
- `onNavigate`: intercepts an unmodified primary link activation. Modified clicks retain native link behavior. UI does not write browser History or select DSH sessions.
- `onNewTask`, optional `onOpenHarness` and `onOpenSettings`: host callbacks. Missing optional capabilities leave the corresponding controls disabled. Collapsed brand activation only expands the sidebar.
- `labels`: override the complete locale copy; data titles remain unmodified. `brandMark` accepts the host-provided brand asset.

The component reuses Icon and ExpandableSearchField. Its styles are colocated with the DSH-owned component and do not require the prototype HTML, Tailwind Play or local filesystem assets. `data-ui-owner="components"` keeps prototype-wide color rewriting from modifying the formal component.

## Behavior

Task, Workflow and Analysis disclose independently. Search occupies the existing title row. View choices persist when search is closed. Active filtering excludes only records explicitly marked inactive. Exact revision navigation does not change when version labels are hidden.

The same directory DOM is reused in the collapsed 300px drawer. Escape closes search/menu first, then the directory and restores rail focus. The host allocates 260px (expanded default) or 64px (collapsed), and can set `--crystra-sidebar-expanded-width` for its actual expanded width. The directory follows a 340ms slide, with reduced-motion support. Host geometry and the Chat/Bench mounts remain outside the Sidebar.

The preview data is in `dev/layout/fixtures.ts`. It is not a production data source. DSH 0.1.5 host mounting, real sessions and persistent preference storage remain separate integration work.
