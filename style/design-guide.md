# Graphite — Text Simplifier Design Guide

Graphite is the design system behind the Text Simplifier web app. It is a
monochrome, sharp-cornered, high-contrast interface built around hairline
borders, uppercase micro-labels, and inverted hover states, with a full
light/dark pair that share the same structure.

This guide documents the system so new UI work stays consistent. When in
doubt, follow the tokens and rules below; the living source of truth is
`static/css/index.css`.

---

## 1. Design Principles

1. **Monochrome first.** The interface is intentionally gray-scale. Accent
   colors are reserved for transient feedback only (the success checkmark and
   the loading spinner, which reuse the foreground color).
2. **Sharp corners.** Nothing is rounded except circular affordances that are
   round by nature (spinners, checkmarks, the scrollbar is square). Never add
   `border-radius` to boxes, buttons, badges, or bubbles.
3. **Hairline borders.** Separation comes from 1px `#e5e5e5` (light) /
   `#3f3f45` (dark) borders rather than shadows or elevation.
4. **Inverted hover.** The primary interaction cue is a full foreground /
   background inversion (`#111111` ↔ `#ffffff`, mirrored in dark mode).
5. **Micro-typography.** Uppercase, letter-spaced labels at 12–13px drive the
   "instrument panel" feel; body text stays quiet at 14px.
6. **Two themes, one layout.** Every color rule has a light and a dark value;
   dark mode never changes structure, spacing, or motion — only color.
7. **Contained scrolling.** Text areas scroll internally; controls never grow
   to fit content (see the `min-height: 0` / `overflow` chain).

---

## 2. Color Palette

Both palettes map one-to-one onto the same roles.

### Light (default)

| Role                    | Token            | Hex       |
| ----------------------- | ---------------- | --------- |
| Page background         | `--bg-page`      | `#f9f9f9` |
| Surface (panels, header)| `--surface`      | `#ffffff` |
| Subtle fill (badges)    | `--bg-subtle`    | `#f5f5f5` |
| Subtle fill hover       | `--bg-subtle-hover` | `#ececec` |
| Border (hairline)       | `--border`       | `#e5e5e5` |
| Text — primary          | `--text-primary` | `#111111` |
| Text — secondary        | `--text-secondary` | `#666666` |
| Text — muted/placeholder| `--text-muted`   | `#999999` |
| Inverted surface (bubble)| `--inverse`     | `#111111` |
| Inverted text           | `--on-inverse`   | `#ffffff` |
| Scrollbar track         | —                | `#f5f5f5` |
| Scrollbar thumb         | —                | `#d0d0d0` |

### Dark (`[data-theme="dark"]`)

| Role                    | Hex       |
| ----------------------- | --------- |
| Page background         | `#1c1c1e` |
| Surface                 | `#26262a` |
| Subtle fill             | `#3a3a3e` |
| Subtle fill hover       | `#4a4a50` |
| Border (hairline)       | `#3f3f45` |
| Text — primary          | `#e8e8ea` |
| Text — secondary        | `#a2a2a8` |
| Text — muted/placeholder| `#6e6e73` |
| Inverted surface (bubble)| `#e8e8ea` |
| Inverted text           | `#111111` |
| Scrollbar track         | `#26262a` |
| Scrollbar thumb         | `#55555b` |

Rules:

- Never introduce a hue; stay within the gray ramp above.
- The theme is switched by setting `<html data-theme="light|dark">`; every new
  color rule must ship a matching `[data-theme="dark"]` override.
- Dark mode also sets `color-scheme: dark` so native form controls match.

---

## 3. Typography

| Style              | Font / Weight            | Size | Tracking | Usage |
| ------------------ | ------------------------ | ---- | -------- | ----- |
| Base body          | system stack, 400        | 14px | —        | Default text, inputs, output |
| App title          | system stack, 600        | 24px | -0.5px   | Header title |
| Panel label        | system stack, 600, UPPERCASE | 12px | 0.5px | Panel headers |
| Model value        | `Monaco`, `Courier New`, monospace, 600 | 13px | — | Model name in badge |
| Word count         | system stack             | 11px | —        | Next to panel labels |
| Button label       | system stack, 500        | 14px | —        | Buttons |
| Simplify micro-label | system stack            | 10px | 1px     | The `SIMPLIFY` text on the header button |
| Bubble text        | system stack             | 13px | 0.5px   | Status bubble |

- Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif`.
- Line heights: 1.5 for general text, 1.6 for text areas, 1.1 for word counts.
- Uppercase + letter-spacing is the label language; body text is never
  uppercased.

---

## 4. Shape, Borders, Spacing

- **Corners:** all 0 (`border-radius: 0`). The status bubble was deliberately
  changed from 6px to 0 to match.
- **Borders:** 1px solid `#e5e5e5` / `#3f3f45`. Buttons use 1px solid
  `#111111` / `#e8e8ea`.
- **Spacing rhythm:** 32px page gutters (16px ≤1024px, 12px ≤640px); 8–16px
  internal padding; 8–14px gaps between grouped controls; 16px text-area
  padding.
- **No shadows, no gradients, no elevation** — flat surfaces separated by
  hairlines only.

---

## 5. Icons

- Inline SVG, 18×18 viewBox, rendered at 18px.
- Stroke-based: `stroke-width: 1.8`, `stroke-linecap: round`,
  `stroke-linejoin: round`, `fill: none`, `stroke: currentColor`.
- Color follows the text color (`currentColor`) so icons adapt to hover
  inversion and dark mode automatically.
- Panel-header action icons live inside 36px-tall icon buttons separated by a
  `border-left` hairline.

---

## 6. Controls

### Header

- **App title** — 24px, weight 600, tracking -0.5px, left-aligned; left/right
  groups separated by `space-between`.
- **Model badge** (`#modelBadgeBtn`) — subtle fill `#f5f5f5`, 1px hairline
  border, 13px text, padding 8px 16px; hover warms to `#ececec`; a chevron
  rotates 180° when open.
- **Theme toggle** (`#themeToggle`) — an icon button styled to match the badge
  (`#f5f5f5` / `#e5e5e5`, hover `#ececec`) so the two read as one group; icon
  is a sun (light) or moon (dark).
- **Status bubble** (`#modelBubble`) — inverted pill (`#111111` on light,
  `#e8e8ea` on dark), square corners, 13px + 0.5px tracking, anchored directly
  below the badge (right-aligned) with a 6px up-pointing arrow.

### Panels

- **Panel** — 1px hairline border, surface background, column flex.
- **Panel header** — hairline bottom border; label on the left, action buttons
  on the right.
- **Panel label** — uppercase 12px/600/0.5px in secondary text color, padding
  10px 14px.
- **Word count** — muted 11px directly after the label.
- **Panel-header buttons** — stretch to the header height, no border except a
  `border-left` hairline separator; grouped with no gap between them.
- **Text areas** — borderless inside the panel, 14px/1.6, muted placeholder;
  the output text area scrolls internally (`overflow-y: auto`) with
  `min-height: 0` up the flex chain so it never grows.

### Buttons

- **Base `.btn`** — transparent, 1px solid `#111111` border, 14px/500, padding
  10px 16px, gap 8px. Hover inverts (`#111111` bg, white text); active fades to
  80%; disabled dims to 50% and suppresses hover/active.
- **Primary** — same base, wider padding (10px 22px).
- **Secondary / icon** — padding 8px 10px, min 36×36px, icon-only.
- **Success** — the icon is swapped for a `✓` checkmark (pulse animation,
  0.3s), the stale content fades to 35%; text on mixed buttons is untouched.
- **Loading** — the icon is replaced by a border spinner (14px, 2px,
  `currentColor`), 0.8s linear spin.

### Footer

- Hairline top border, surface background, muted 14px description text and a
  link that darkens and underlines on hover; the description is hidden on
  compact screens.

### Config panel

- Collapsible section with an animated height transition; page background,
  16px/32px inner padding.
- Title uses the uppercase micro-label style; inputs are 1px hairline-bordered
  surfaces with 13px text and a `#111111` focus border.

### Scrollbars

- Custom WebKit scrollbars, 8px wide, square thumbs (`border-radius: 0`).

---

## 7. Motion

| Use case          | Transition / Animation                     | Duration |
| ----------------- | ------------------------------------------ | -------- |
| Buttons, generic  | `all` ease-out                             | 0.15s    |
| Badge chevron     | `transform` ease-out                       | 0.2s     |
| Status bubble     | `opacity` ease-out                         | 0.2s     |
| Config panel      | `height` + `border-top-width` ease         | 0.3s     |
| Success checkmark | scale pulse (`checkmarkPulse`)             | 0.3s     |
| Loading spinner   | rotate (`spin`) linear infinite            | 0.8s     |

Motion is subtle and functional; no bounce, no delay-heavy choreography.

---

## 8. Responsive Behavior

- **≤1024px:** panels stack into a single column (`minmax(0, 1fr)` rows),
  header wraps, header-right and badge go full width.
- **≤640px:** compact gutters (12px), footer stacks vertically and hides its
  description text, buttons stretch full width.
- Scrolling is always internal to panels; the page itself never grows past the
  viewport (`height` chain with `min-height: 0`).

---

## 9. Conformance Checklist

When adding or changing UI:

- [ ] Colors come only from the palette tables in §2, with a dark-mode
      override for every light rule.
- [ ] No `border-radius` on boxes, buttons, badges, or bubbles.
- [ ] Separators are 1px hairlines, not shadows.
- [ ] Labels use uppercase + letter-spacing micro style; body text stays 14px.
- [ ] Icons are 18px stroke SVGs (`stroke-width: 1.8`, `currentColor`).
- [ ] Hover = inversion (or subtle-fill for badge-like controls); disabled
      state dims without hover treatment.
- [ ] Long text scrolls inside the control; nothing grows to fit content.
- [ ] Structure, spacing, and motion are identical in light and dark mode.
