# Design

The unit of the site is a Dock, so the Dock is the one rich object on every page. Everything around it stays quiet: neutral paper, compact text, one accent.

## Tokens

Defined at the top of `src/styles.css`; dark mode swaps the same names.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#fafaf8` | `#0e0e0d` | Page |
| `--card` | `#ffffff` | `#171716` | Raised surfaces |
| `--soft` | `#f1f1ee` | `#1d1d1b` | Controls, mini Docks |
| `--ink` | `#121211` | `#f2f2ef` | Headings, titles |
| `--muted` | `#52524e` | `#b3b3ac` | Body copy |
| `--faint` | `#6b6b66` | `#95958e` | Metadata (meets 4.5:1) |
| `--accent` | `#0f7466` | `#5fd0bd` | Links, hover titles, focus |

`--wallpaper` is the only gradient: it sits behind Docks so the glass shelf reads as glass. Shadows use `--raised` and `--lifted` (hairline plus soft throw); avoid one-off shadows.

## Type

Inter for text at 14px base; titles 15–16px; page headings 27–36px with tight tracking. Counts and dates use the system monospace (`.mono`) with tabular figures. Weight never changes on hover; state is shown with colour.

## Motion

| Motion | Duration | Easing |
|---|---|---|
| Hover and colour | 150ms | `ease` |
| Tooltip, preview card | 120–140ms | `--ease-swift` |
| Dock settle after magnification | 220ms | `--ease-swift` |
| Magnification while tracking | 70ms | linear |
| Cross-page Dock morph | 260ms | `--ease-swift` |

Rules:

- Animate `transform` and `opacity` only.
- Nothing is hidden waiting for JavaScript. Prerendered pages are complete without it.
- Magnification and hover previews are for fine pointers only. Keyboard and touch see the resting Dock.
- Previews open after 220ms, then instantly for 300ms after one closes, so scanning a list feels immediate.
- `prefers-reduced-motion: reduce` turns off every transition, animation and view transition.

## The Dock

`DockView` draws apps, optional spacer tiles, a divider, then stacks (Downloads and Trash by default). Icon size follows the container (`cqi`), capped per size (`lg` 60px, `md` 44px, `sm` 26px), so long Docks shrink like the real one. It is one `role="img"` with a label that lists every app in order.
