# CinePath — Design System & Engineering Rules (pathe.ma/fr Edition)

## 1. Visual World & Theme
- **Dual-Surface Architecture (Exact `pathe.ma/fr` System):**
  - **Cinema Discovery & Editorial Surfaces (Home, Movie Details, Catalog, Footer):**
    - Deep Cinema Black: `#0a0a0a` / `#0d0d0d`
    - Warm Charcoal Filter & Date Cards: `#2c2825` (selected: `#322e2a` with `border-white/80`)
    - Showtime Cards: `#1a1a1a` with `border-white/[0.08]`
    - Primary Brand Yellow: `#ffc61a` (Hover: `#ffd147`)
    - "Nouveau" Corner Badge Red: `#e51923` (sentence-case `Nouveau`)
    - "En vente !" Corner Badge Yellow: `#ffc61a` (sentence-case `En vente !`)
    - Ranked Gold Stroke (`Les plus attendus` 1–6): `-webkit-text-stroke: 1.35px #a88225`
  - **Booking Studio Split Surface (`/booking/[showtimeId]/seats`):**
    - Left Persistent Summary Sidebar: Dark Slate `#181b20` with dimmed movie backdrop header, `#3c4048` 3-column ticket summary (`Date | Séance | Place`) with scalloped semicircle perforated bottom edge, `#ffffff` `Mon tarif` receipt block in Step 3, and `#fbd361` `Total à régler` footer.
    - Right Interactive Canvas: Crisp Light Off-White `#f8f8f8` with pure `#ffffff` rounded containers (`border-zinc-200/80`) and `#1c1e24` typography.
    - Custom SVG Amphitheater Seats:
      - `Places libres`: `#ffecb3` fill, `#d4a024` stroke (softens to `#fdf4d7` / `#dfc06c` on hover), including elongated front-row Chaise Longue recliners.
      - `Mes places`: `#48c78e` fill, `#257953` stroke with white checkmark.
      - `Places occupées`: `#efefef` fill, `#cccccc` stroke with person silhouette.
    - Seat Hover Tooltip: Split `#488ee6` seat badge (`C8`, `A6`) + `#ffffff` status card (`Fauteuil standard` + `#009933` `LIBRE` or `#e6193c` `RÉSERVÉ`).
- **Official Brand Assets:**
  - Tab Favicon: `/logo/CinePath_Bear_Black_Icon.png`
  - Header, Sidebar & Footer Logo: `/logo/CinePath_Bear_White_Full_Logo.png` (using `mix-blend-mode: screen` via `.logo-screen-blend` so its black background is transparent over movie backdrops).

## 2. Emil Kowalski's Motion & Interaction Rules
- **Button Feedback:** Interactive buttons and pills include active press feedback (`active:scale-[0.97]` or `active:scale-[0.98]`).
- **Snappy Durations (< 250ms):** Micro-interactions at `150ms`, drawers/modals at `200ms`, explicit transition properties (`transition-colors`, `transition-transform`, `transition-opacity`).
