# Pokenese — Visual Design Specification

## 1. Design Philosophy

Pokenese targets adult learners who enjoy games. The visual identity must feel:

- **Modern & sleek** — clean lines, generous whitespace, no visual clutter
- **Game-like** — satisfying interactions, clear feedback, rewarding moments
- **Culturally resonant** — Chinese aesthetic cues without being clichéd; think ink, not kitsch
- **Trustworthy** — consistent spacing and typography signal polish

Primary inspiration: the restrained, focused UX of Wordle and NYT Games, elevated with subtle Pokémon visual identity cues.

---

## 2. Design Tokens

### 2.1 Color Palette

**Dark Theme (default):**

| Token | Hex | Usage |
|---|---|---|
| `bg-base` | `#0F0F1A` | Page background |
| `bg-surface` | `#1A1A2E` | Cards, panels |
| `bg-elevated` | `#252542` | Dropdowns, modals, hovered cards |
| `bg-input` | `#1E1E35` | Input fields |
| `border` | `#2E2E50` | Subtle dividers, card borders |
| `border-focus` | `#5555AA` | Input focus rings |
| `text-primary` | `#F0F0FF` | Primary text |
| `text-secondary` | `#9090BB` | Supporting text, labels |
| `text-muted` | `#555575` | Disabled, placeholder |
| `accent-red` | `#E8334A` | Primary CTA, Pokémon red |
| `accent-red-hover` | `#FF4560` | Hover state |
| `accent-gold` | `#F5C842` | Stars, streaks, score highlights |
| `accent-blue` | `#4488FF` | Links, info |
| `success` | `#4CAF78` | Correct guess |
| `error` | `#FF4444` | Wrong guess |
| `warning` | `#F5A623` | Proximity score |
| `hint-bg` | `#1E2040` | Hint card background |

**Light Theme:**

| Token | Hex | Usage |
|---|---|---|
| `bg-base` | `#F5F5FA` | Page background |
| `bg-surface` | `#FFFFFF` | Cards |
| `bg-elevated` | `#EEEEF8` | Elevated surfaces |
| `bg-input` | `#FFFFFF` | Inputs |
| `border` | `#DDDDEF` | Dividers |
| `border-focus` | `#8888CC` | Focus rings |
| `text-primary` | `#111128` | Primary text |
| `text-secondary` | `#555570` | Supporting text |
| `text-muted` | `#AAAACC` | Disabled |
| (accent colors same as dark) | | |

### 2.2 Pokémon Type Colors

Used for `TypeBadge` component and typing hint cards:

| Type | Background | Text |
|---|---|---|
| Normal | `#A8A878` | `#FFFFFF` |
| Fire | `#F08030` | `#FFFFFF` |
| Water | `#6890F0` | `#FFFFFF` |
| Electric | `#F8D030` | `#333333` |
| Grass | `#78C850` | `#FFFFFF` |
| Ice | `#98D8D8` | `#333333` |
| Fighting | `#C03028` | `#FFFFFF` |
| Poison | `#A040A0` | `#FFFFFF` |
| Ground | `#E0C068` | `#333333` |
| Flying | `#A890F0` | `#FFFFFF` |
| Psychic | `#F85888` | `#FFFFFF` |
| Bug | `#A8B820` | `#FFFFFF` |
| Rock | `#B8A038` | `#FFFFFF` |
| Ghost | `#705898` | `#FFFFFF` |
| Dragon | `#7038F8` | `#FFFFFF` |
| Dark | `#705848` | `#FFFFFF` |
| Steel | `#B8B8D0` | `#333333` |
| Fairy | `#EE99AC` | `#FFFFFF` |

### 2.3 Typography

**Font Families:**
- **Latin/UI:** `Inter` (Google Fonts, variable font). Fallback: `system-ui, sans-serif`
- **Chinese characters:** `Noto Sans SC` (Google Fonts). Fallback: `PingFang SC, Microsoft YaHei, sans-serif`
- **Monospace/Pinyin:** `Noto Sans Mono` for IPA only. Pinyin uses Inter.

**Type Scale:**

| Name | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `display` | 64px | 800 | 1.1 | Chinese name on game card |
| `heading-1` | 32px | 700 | 1.2 | Page titles, score numbers |
| `heading-2` | 24px | 600 | 1.3 | Pinyin, section headers |
| `heading-3` | 20px | 600 | 1.4 | Card titles |
| `body-lg` | 18px | 400 | 1.6 | Game instructions |
| `body` | 16px | 400 | 1.6 | Standard body |
| `body-sm` | 14px | 400 | 1.5 | Secondary text, labels |
| `caption` | 12px | 400 | 1.4 | Hints, metadata |
| `mono` | 14px | 400 | 1.5 | IPA text |

### 2.4 Spacing

Base unit: `4px`. Use multiples: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`.

In Tailwind terms: `p-1` (4px) through `p-24` (96px).

### 2.5 Border Radius

| Name | Value | Usage |
|---|---|---|
| `sm` | `4px` | Badges, tags |
| `md` | `8px` | Buttons, inputs |
| `lg` | `12px` | Cards |
| `xl` | `16px` | Modals, large cards |
| `2xl` | `24px` | Nav pills, feature cards |
| `full` | `9999px` | Circular avatars, pill badges |

### 2.6 Shadows & Glows

Dark mode:
- `shadow-card`: `0 4px 24px rgba(0, 0, 0, 0.4)`
- `shadow-elevated`: `0 8px 40px rgba(0, 0, 0, 0.6)`
- `glow-red`: `0 0 20px rgba(232, 51, 74, 0.3)` (used on CTA hover)
- `glow-gold`: `0 0 16px rgba(245, 200, 66, 0.4)` (used on score display)
- `glow-success`: `0 0 20px rgba(76, 175, 120, 0.3)`

### 2.7 Motion / Animation

| Name | Duration | Easing | Usage |
|---|---|---|---|
| `fast` | 120ms | `ease-out` | Button hover, toggle |
| `default` | 250ms | `ease-out` | Most transitions |
| `slow` | 400ms | `ease-in-out` | Page transitions, modals |
| `spring` | 500ms | `spring(1, 80, 10, 0)` | Score reveal, success |

Framer Motion variants to define:
- `hint-reveal`: y: 20→0, opacity: 0→1, 300ms ease-out, stagger 80ms between hints
- `shake`: x: [-8, 8, -6, 6, -4, 4, 0], 400ms (wrong guess on input)
- `success-flash`: scale: 1→1.04→1, bg flash to success color, 500ms
- `count-up`: numeric value animates from 0 to final score over 1s
- `confetti`: particle burst (use `canvas-confetti` library), red + yellow + blue particles
- `page-transition`: opacity 0→1, 200ms on route change

---

## 3. Layout System

### 3.1 Grid

- Max content width: `960px` centered
- Horizontal padding: `24px` (desktop), `16px` (mobile)
- Column grid: 12-column with `16px` gutters

### 3.2 Breakpoints

| Name | Width | Notes |
|---|---|---|
| `mobile` | 0–767px | Single column, bottom nav |
| `tablet` | 768–1023px | Two columns possible |
| `desktop` | 1024px+ | Full layout with side margins |

---

## 4. Screen-by-Screen Specification

### 4.1 Home Screen (`/`)

**Purpose:** Mode selection hub. First screen a user sees.

**Layout (desktop):**
- Top nav bar (full-width)
- Below nav: vertically and horizontally centered content
- Logo: "Pokenese" in 48px `heading-1`, with a stylized Poké ball (●) icon to the left in `accent-red`. Below logo: tagline "Learn Chinese through Pokémon" in `text-secondary body-sm`.
- Three mode cards in a horizontal row, each ~280px wide, with `12px` gap:
  - **Daily** (leftmost)
  - **Challenge** (center)
  - **Glossary** (right)
- Footer: `text-muted caption` "Made with ♥ by [creator]" centered.

**Mode Cards:**
Each card uses `bg-surface`, `border`, `radius-xl`, `shadow-card`, padding `24px`.

- **Daily Card:**
  - Icon: Calendar icon (24px, `accent-red`)
  - Title: "Daily" (`heading-3`, `text-primary`)
  - Description: "Three new challenges every day. See how you rank globally." (`body-sm`, `text-secondary`)
  - Status block (if already played today): gray "Completed ✓" with score
  - Status block (if not played): green countdown "Next reset: 14:23:07" OR red "Play Now!" button
  - Streak badge (if streak > 0): gold pill "🔥 14 day streak" bottom-right of card

- **Challenge Card:**
  - Icon: Lightning bolt icon
  - Title: "Challenge"
  - Description: "Unlimited mode. Don't fail or you start over."
  - Status: "Score: 24,600 · 47/1025 Pokémon" if active run exists
  - CTA button: "Continue" (if active) or "Start" (if not)

- **Glossary Card:**
  - Icon: Book icon
  - Title: "Glossary"
  - Description: "Review Pokémon you've encountered."
  - Status: "127 Pokémon discovered"
  - CTA button: "Browse"

**Mobile layout:**
- Cards stack vertically, full-width.
- Bottom navigation bar replaces mode cards as primary navigation.
- Home screen shows same cards but smaller, stacked.

---

### 4.2 Game Screen — Shared Layout

Both Daily (`/daily`) and Challenge (`/challenge`) use this shared game screen layout.

**Top area (above fold on mobile):**

1. **Progress indicator** (top of content area):
   - Daily: "Challenge 2 of 3" with three dots (●●○) in `accent-red`/`border`
   - Challenge: "Pokémon 47 / 1025" with a thin progress bar below

2. **Name Display Card** (`ChineseName` component):
   - Card: `bg-surface`, `radius-xl`, `shadow-card`, centered, max-width `480px`, padding `32px 24px`
   - Chinese characters: `display` (64px), `font-family: Noto Sans SC`, `text-primary`, centered, `letter-spacing: 0.05em`
     - In extreme mode: characters are replaced by a blurred/hidden overlay. A blur filter (`filter: blur(8px)`) is applied, with a "Reveal" button that temporarily unblurs.
   - Pinyin row (below characters, `16px` gap):
     - Pinyin text: `heading-2` (24px), Inter, `text-secondary`, centered
     - Hidden if `show_pinyin = false` (settings toggle); if hidden, show "[pinyin hidden]" in muted text as placeholder
   - IPA row (below pinyin, `8px` gap):
     - IPA text: `mono` (14px), `text-muted`, centered
     - Only shown if `show_ipa = true`
   - Audio button: positioned `12px` to the right of the Chinese characters row, vertically centered with it. Rounded square `40px × 40px`, `bg-elevated`, border `border`, hover: `bg-hint-bg glow-red`. Contains speaker icon (`24px`, `text-secondary`). On click, plays audio and icon animates (speaker waves animation, 500ms).
   - Subtle decorative element: A faint Poké ball outline SVG (opacity: 0.05) centered behind the card content as background decoration.

3. **Hint List** (`HintList` component):
   - Sits below the Name Display Card, centered, max-width `480px`
   - Starts empty
   - Each hint appears in sequence as wrong guesses are made
   - Animation: each hint card slides up from below + fades in

4. **Guess Input** (`GuessInput` component):
   - Positioned below the hint list (or below the name card if no hints yet)
   - Full-width, max-width `480px`, centered
   - Input field: `bg-input`, `border`, `radius-md`, `48px` tall, `16px` horizontal padding
     - Placeholder: "Guess Pokémon name..."
     - Font: Inter `body` (16px), `text-primary`
     - On focus: `border-focus` ring (2px), subtle background lighten
   - Autocomplete dropdown:
     - Appears immediately below input on first keystroke
     - `bg-elevated`, `border`, `radius-md`, `shadow-elevated`
     - Max 8 items shown, scrollable
     - Each item: `48px` tall, `16px` padding, flex row
       - Left: sprite thumbnail `32px × 32px` (from PokeAPI CDN)
       - Middle: English name (`body`, `text-primary`) + Chinese name (`caption`, `text-secondary`)
       - Hover: `bg-surface` highlight
     - Keyboard: arrow keys navigate, Enter selects, Escape closes
   - Submit button: `48px` tall, `120px` wide, attached right side of input field (or below on mobile)
     - Background: `accent-red`, text: "Guess" (`body`, white, weight 600)
     - Hover: `accent-red-hover`, `glow-red`
     - Disabled when input is empty or not a valid Pokémon name

5. **Guess History** (`GuessHistory` component):
   - Appears above the input field (between hints and input)
   - Each wrong guess: a row showing sprite + English name, with a subtle red-tinted background (`rgba(255, 68, 68, 0.08)`)
   - Most recent guess at top
   - On wrong guess submission: row slides in from top (y: -20→0, opacity: 0→1), input shakes

**Bottom area / After completion:**

When a challenge is completed (correct guess OR all 5 guesses used):
- Name Display Card updates to show the Pokémon's sprite (official artwork, `200px × 200px`) overlaid or replacing the Chinese name area
- Score Display card slides up from bottom: large animated count-up number in `accent-gold`, label "pts" below
- On correct guess: confetti burst, card briefly flashes `success` background
- On failure: card briefly flashes `error` background (300ms), then shows proximity score in `warning` color
- "Next →" button appears (or "Share" button if it's the last challenge of the day)

---

### 4.3 Hint Cards

Each hint type has its own visual treatment within a `HintCard` container:

**Container:** `bg-hint-bg`, `border`, `radius-lg`, padding `16px`, width `100%`, max-width `480px`.

**Etymology Hint:**
- Header: 🔤 "Character Meanings" (icon + label, `body-sm`, `text-secondary`)
- Body: Horizontal flex-wrap of character chips
  - Each chip: `bg-elevated`, `radius-sm`, padding `8px 12px`, contains:
    - Character: `heading-2` (24px), `Noto Sans SC`, `text-primary`
    - `"="` separator: `text-muted`
    - Meaning: `body-sm`, `text-secondary` italic
  - Example: `[噴 = to spit] [火 = fire] [龍 = dragon]`

**Generation Hint:**
- Header: 🏔️ "Generation" 
- Body: "Generation [N] — [Region Name]" e.g. "Generation I — Kanto"
  - Generation number: `heading-2`, `text-primary`
  - Region name: `body`, `text-secondary`

**Typing Hint:**
- Header: ⚡ "Type"
- Body: One or two `TypeBadge` components side by side
  - Each badge: colored pill (from type colors table), Pokémon type name, `body-sm` white text, padding `6px 16px`, `radius-full`

**Category Hint:**
- Header: 📖 "Pokédex Entry"
- Body: `"The [Category] Pokémon"` in italic `body-lg`, `text-primary`
  - E.g. *"The Flame Pokémon"*

---

### 4.4 Daily Mode (`/daily`)

Extends the shared game screen layout. Additional elements:

**Challenge progress bar:**
- Three segments at top of game area, each representing one challenge
- Active challenge: `accent-red` fill
- Completed: `success` fill  
- Locked: `border` fill
- Segments separated by small gaps

**Between challenges:**
- When challenge N is complete, display an interstitial card (500ms auto-dismiss OR manual "Next Challenge →" button):
  - Shows score for just-completed challenge
  - A loading/transition animation (Poké ball spinning, 1s)

**All 3 complete — Results Screen:**
- Replaces game area with results summary
- Three rows (one per challenge), each showing:
  - Pokémon sprite (small, `48px`)
  - Challenge number
  - Guess count visualization: N filled circles + (5-N) empty circles, colored `success`/`error`
  - Score
- Total score large at bottom: `display` size, `accent-gold`
- Share button: `accent-red`, full-width, "Share Today's Score"
- "View Glossary" secondary button

---

### 4.5 Challenge Mode (`/challenge`)

Extends shared game screen. Additional elements:

**Run progress indicator** (top of screen):
- "Pokémon 47 / 1025" label
- Thin full-width progress bar below nav, height `4px`, `accent-red` fill
- Current total score in smaller text: "Score: 24,600"

**Failure / Run Reset Dialog:**
- Full-screen modal overlay, dark with blur
- Red warning icon (large, `96px`)
- "Run Over" heading
- "You couldn't identify [Pokémon Name]. Your score of [X] has been reset."
- "Your best ever: [X]"
- Single CTA button: "Try Again" (`accent-red`)

**Run Complete Dialog (full Pokédex):**
- Full-screen celebratory overlay
- Gold confetti, stars
- "Pokémon Master!" heading
- "You identified all 1025 Pokémon! Final score: [X]"
- Share button + "Play Again" button

---

### 4.6 Glossary Screen (`/glossary`)

**Layout:**
- Filters row at top: generation dropdown, type filter dropdown, sort by (A-Z, by number, date discovered), search input
- Grid below: 4 columns desktop, 2 columns tablet, 2 columns mobile
- Total: shows "127 / 1025 Discovered" above grid

**Pokémon Card (`PokemonCard`):**
- `bg-surface`, `border`, `radius-lg`, padding `16px`, aspect ratio approximately square
- Centered sprite image: `80px × 80px`
- Below sprite: English name (`body`, `text-primary`, centered)
- Below name: Chinese name (`body-sm`, `Noto Sans SC`, `text-secondary`, centered)
- Below Chinese: Pinyin (`caption`, `text-muted`, centered)
- Type badge(s): small, bottom of card
- Hover: card lifts (`shadow-elevated`), scale `1.02`, `250ms`
- Click: navigates to `/glossary/[id]` or opens detail modal

**Undiscovered slots:**
- Shown as silhouette: black Pokémon sprite image with `brightness(0)` CSS filter, `opacity: 0.2`
- "???" text where name would be
- Clicking shows a "Play Daily or Challenge to discover more Pokémon" toast

---

### 4.7 Pokémon Detail Page (`/glossary/[id]`)

**Layout:** Centered max-width `640px`, vertical stack.

- Back button: `← Glossary` at top-left
- **Header card:** `bg-surface`, `radius-xl`, padding `32px`
  - Official artwork centered: `160px × 160px`, with subtle `glow-gold` shadow
  - Dex number: `#006` format, `caption`, `text-muted`
  - English name: `heading-1`, `text-primary`
  - Chinese name: `display` (48px here, not 64px), `Noto Sans SC`, `text-primary`, with audio button inline
  - Pinyin: `heading-2`, `text-secondary`
  - IPA: `mono`, `text-muted` (if `show_ipa` enabled)
  - Type badges row
  - Generation + Category: `body-sm`, `text-secondary`

- **Etymology card:** `bg-surface`, `radius-xl`, padding `24px`, margin-top `16px`
  - Title: "Character Breakdown" (`heading-3`)
  - Table or flex layout: one row per character
    - Character (`Noto Sans SC`, `heading-2`) | Pinyin (`body`) | Meaning (`body`, italic, `text-secondary`)

- **Stats card:** `bg-surface`, `radius-xl`, padding `24px`, margin-top `16px`
  - "Seen in game" count: `body-sm`, `text-secondary`
  - First encountered date: `caption`, `text-muted`

---

### 4.8 Navigation

**Desktop Top Nav (all screens):**
- Fixed top, height `64px`, `bg-base` + `border-bottom: 1px solid border`
- Left: Logo mark (Poké ball SVG icon `28px` + "Pokenese" text `20px` weight `700`)
- Center: Three navigation links — "Daily" | "Challenge" | "Glossary" — each a pill button
  - Active: `bg-surface`, `text-primary`, `border`
  - Inactive: transparent, `text-secondary`
  - Hover: `bg-surface` fade-in
- Right: Settings icon button (gear, `24px`), then User avatar (circle `32px`, `bg-elevated`, initials or profile pic) OR "Sign In" text link

**Mobile Bottom Nav:**
- Fixed bottom, height `64px` + safe area inset, `bg-surface` + `border-top`
- 5 items: Home | Daily | Challenge | Glossary | Profile
- Active item: icon + label in `accent-red`
- Inactive: icon only in `text-muted` (label hidden)
- Icon size: `24px`

**Settings Drawer:**
- Slides in from right, width `320px` (desktop) / full-width (mobile)
- Overlay: `rgba(0,0,0,0.6)` backdrop blur
- Header: "Settings" (`heading-3`) + close ✕ button
- **Toggle rows** (each `56px` tall with toggle right-aligned):
  - "Show Pinyin" (default: on)
  - "Show IPA" (default: off)
  - "Extreme Mode — Hide all text, audio only" (default: off)
  - "Auto-play audio" (default: off)
  - "Light Mode" (default: off)
- **Account section** (divider above):
  - If logged in: avatar + username + "Sign out" link
  - If guest: "Create account to sync across devices" + "Sign In / Register" button

---

### 4.9 Auth Screens (`/login`, `/register`)

Minimal, centered on `bg-base`.

- Card: `bg-surface`, `radius-xl`, `shadow-card`, max-width `400px`, padding `40px`
- Logo at top of card
- Heading: "Sign In" or "Create Account"
- Form fields: email, password (register: + username + confirm password)
  - Standard input style (`bg-input`, `border`, `radius-md`, `48px` tall)
  - Label above each field (`body-sm`, `text-secondary`)
  - Error message below field (`caption`, `error`)
- Primary button: full-width, `accent-red`, `48px` tall
- Divider: "or" with horizontal rules
- "Continue as guest" link (`text-secondary`, centered below form)
- Switch link: "Don't have an account? Register" / "Already have an account? Sign In"

---

### 4.10 Share Graphic

Dimensions: `1080×1080px` (1:1 square). Designed to be rendered client-side from a hidden HTML div.

**Layout (top to bottom, all centered):**
- Background: `bg-base` (`#0F0F1A`)
- Subtle grid pattern: 1px `border` colored grid lines at `80px` spacing, `opacity: 0.3`
- Top: Pokenese logo (wordmark + poké ball icon), white, `32px`, centered, `60px` from top
- Date: "May 25, 2026" in `text-secondary`, `body-sm`, `16px` below logo
- Divider line: 1px, `border`, full-width with `60px` horizontal margins
- Three challenge rows (equal spacing):
  - Each row: Pokémon sprite (`64px`) + English name (`body`) + pinyin (`caption`, `text-secondary`) + score circles
  - Score circles: 5 circles (`16px` diameter), filled = guesses used (red `accent-red`), unfilled = remaining (dark `bg-elevated`). For correct guesses: circles show filled count. For fail: all 5 red with ✗ style.
- Divider
- Total score: big number (`64px`, `accent-gold`), "pts" suffix (`24px`)
- Streak badge (if applicable): "🔥 14 day streak" gold pill
- Bottom: "pokenese.com" `text-muted` `caption`, `40px` from bottom

---

## 5. Icon System

Use **Lucide React** (`lucide-react` npm package) for all UI icons. No icon font dependencies.

Key icons used:
- Nav: `Calendar`, `Zap`, `BookOpen`, `User`, `Settings`
- Game: `Volume2` (audio), `Eye`/`EyeOff` (pinyin toggle), `ChevronRight` (next)
- Hints: `Type`, `MapPin`, `Sword`, `BookMarked`
- Misc: `Share2`, `Trophy`, `Flame`, `Check`, `X`, `Menu`

Icon sizes: `16px` (inline), `20px` (buttons/nav), `24px` (feature icons), `32px`+ (decorative)

---

## 6. Loading States

**Poké ball spinner:**
- SVG Poké ball that rotates 360° continuously at `1s` linear infinite
- Used for: initial page load, between daily challenges, API calls > 300ms
- Size: `48px` for full-page, `24px` for inline

**Skeleton screens:**
- Glossary grid: gray `bg-elevated` rectangles matching card shape with shimmer animation
- No spinners for skeleton states

**Optimistic updates:**
- Guess submissions should feel instant — update UI immediately, reconcile with server response

---

## 7. Error States

- **API error toast:** Slides in from top-right, `bg-surface`, `border-left: 4px solid error`, icon + message + auto-dismiss (5s)
- **No internet:** Banner at top of page: "No internet connection. Progress will sync when reconnected."
- **404 glossary entry:** "Pokémon not yet discovered. Play Daily or Challenge to unlock it."
- **Daily already completed:** Shows results screen, not the game

---

## 8. Responsive Behavior Summary

| Element | Mobile | Tablet | Desktop |
|---|---|---|---|
| Nav | Hidden; use bottom nav | Top nav, no center links | Full top nav |
| Game card | Full-width, `16px` horizontal margin | Max `480px` centered | Max `480px` centered |
| Hint cards | Full-width | Max `480px` | Max `480px` |
| Glossary grid | 2 columns | 3 columns | 4 columns |
| Home mode cards | Stacked vertical | Horizontal row | Horizontal row |
| Settings | Full-screen drawer | `320px` slide-in | `320px` slide-in |
| Auth forms | Full-width, `16px` margin | `400px` centered | `400px` centered |

---

## 9. Accessibility

- Color contrast: all text meets WCAG AA (4.5:1 minimum). Test with `bg-base` + `text-primary` and `bg-surface` + `text-secondary`.
- Focus states: all interactive elements have visible focus rings (`border-focus` color, `2px` outline, `2px` offset).
- Keyboard navigation: full game playable via keyboard only (Tab, Arrow keys, Enter, Escape).
- Screen reader: all game state changes announced via `aria-live` regions.
- Audio: Chinese name audio is supplemental; all information also available visually.
- Touch targets: minimum `44px × 44px` on mobile.
- Reduced motion: respect `prefers-reduced-motion` — disable non-essential animations.

---

## 10. Implementation Notes for Frontend Agent

- Configure design tokens as CSS custom properties in `globals.css` AND in `tailwind.config.ts` using `theme.extend`.
- Use Tailwind `dark:` prefix for dark/light theme variants, toggled via a `dark` class on `<html>`.
- All color tokens should be defined once in `tailwind.config.ts` to ensure consistency.
- Framer Motion: wrap pages in `AnimatePresence` for route transitions.
- The `ChineseName` component must handle three display states: full (hanzi + pinyin + IPA), no-pinyin, and extreme (blurred/hidden).
- All game state transitions (guess, hint reveal, challenge complete) should be driven by the `useGame` hook — components should be purely presentational.
- Use `next/image` for all Pokémon sprites with appropriate `width`, `height`, and `priority` props.
- The `pokemon.ts` data file must be code-split. Import it using dynamic imports inside hooks/components, not at module level in layouts or nav.
