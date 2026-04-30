# Design System: The Sovereign Lattice

## 1. Overview & Creative North Star
The Creative North Star for this system is **"The Digital Architect."** In a decentralized marketplace, trust isn't given; it is engineered. This system moves away from the "flatness" of standard web apps, instead favoring a high-end, editorial aesthetic that feels like a futuristic terminal for global commerce.

To break the "template" look, we utilize **intentional asymmetry** and **tonal depth**. Elements should not simply sit on the grid; they should float within a 3D space. We use overlapping glass containers, aggressive typographic contrast (the industrial weight of Bebas Neue against the precision of IBM Plex Mono), and role-based luminescence to guide the user through a complex data landscape.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a "Deep Space" ethos, using the near-black `#07090E` as a void from which light and data emerge.

### Role-Based Accents
Color is used functionally to define user state and identity:
- **Worker (Primary):** `primary_container` (#0095FF) — Used for task discovery and earning actions.
- **Employer (Secondary):** `secondary_container` (#00C9A7) — Used for talent acquisition and management.
- **Admin (Tertiary):** `tertiary_container` (#F5642E) — Used for governance and resolution.
- **Success:** `Green` (#00D68F) — Reserved strictly for financial growth and verified proofs.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined through:
1.  **Tonal Shifts:** A `surface_container_low` section sitting atop a `surface` background.
2.  **Luminescence:** A subtle glow (`primary` at 10% opacity) defining the edge of a container.
3.  **Negative Space:** Utilizing the spacing scale to create mental groupings.

### The Glass & Gradient Rule
To achieve "The Digital Architect" look, floating elements must use **Glassmorphism**.
- **Effect:** Background Blur: 24px.
- **Fill:** A semi-transparent mix of `surface_container` (60-80% opacity).
- **Gradients:** Buttons and high-priority cards must use a subtle linear gradient (e.g., `primary` to `primary_container`) with a 15% radial "glow" anchored to the top-left corner to simulate an internal light source.

---

## 3. Typography
The typographic system creates an industrial-editorial hybrid, mixing the raw strength of a condensed display face with the technical precision of a monospace font.

- **Display & Headlines (Bebas Neue):** Used for titles, massive numbers, and section headers. Its verticality suggests authority. 
    - *Usage:* `display-lg` for Pi amounts; `headline-md` for screen titles.
- **Body & Titles (DM Sans):** The workhorse for legibility. Its geometric clarity balances the display font.
    - *Usage:* `body-md` for descriptions; `title-sm` for card headings.
- **Data & Verification (IBM Plex Mono):** Used for hash strings, wallet addresses, and verification codes. This font signals "System Logic" to the user.
    - *Usage:* `label-md` for technical metadata.

---

## 4. Elevation & Depth
In this system, depth is a functional tool for hierarchy, not a stylistic flourish.

### Tonal Layering
We stack `surface-container` tiers to create "nested" importance:
- **Level 0 (Background):** `surface_dim` (#111319) - The base canvas.
- **Level 1 (Sections):** `surface_container_low` - For secondary groupings.
- **Level 2 (Cards):** `surface_container` - The primary interaction surface.
- **Level 3 (Pop-overs/Modals):** `surface_container_highest` + 24px Blur.

### Ambient Shadows & Ghost Borders
- **Shadows:** Avoid black shadows. Use a tinted shadow (`#000000` at 40% opacity) with a large blur (30px+) and 0px spread.
- **The Ghost Border:** If a container requires further definition on a complex background, use `outline_variant` at **15% opacity**. Never use 100% opaque lines.

---

## 5. Components

### Buttons (The "Core Action" Primitive)
- **Primary (Role-based):** 18px border radius. Background: Gradient from `accent` to `accent_container`. Box-shadow: 12px blur, matching the accent color at 20% opacity.
- **Tertiary (Ghost):** No background. `DM Sans` Medium. Text color: `on_surface_variant`. Focus state: Subtle 1px `Ghost Border`.

### Input Fields (The "Data Node")
- **Base:** `surface_container_lowest` fill, 18px border radius.
- **Interaction:** On focus, the field emits a role-based glow (`primary` or `secondary` at 20%) and the label shifts to `IBM Plex Mono` for a "system active" feel.

### Cards & Progress
- **Cards:** No dividers. Separate content using `title-md` (DM Sans) for headers and `body-sm` for metadata.
- **The Honeycomb Overlay:** Apply a subtle Hex-mesh pattern (SVG overlay at 5% opacity) to the background of `Employer` or `Worker` specific dashboard cards to reinforce the decentralized "Grid" identity.

### Role-Based Status Chips
- Use `IBM Plex Mono` in all-caps.
- Background: 10% opacity of the role color.
- Border: 20% opacity `Ghost Border` of the role color.

---

## 6. Do’s and Don’ts

### Do:
- **Use "Pi" as a visual anchor:** In the decentralized context, show amounts in `display-lg` (Bebas Neue) to make earnings feel substantial.
- **Embrace Asymmetry:** Place a floating action button slightly off-center or use overlapping glass panels to create a sense of movement.
- **Role Consistency:** If the user is in "Worker Mode," all glows, primary buttons, and active states must be Blue (#0095FF).

### Don’t:
- **Don't use dividers:** Never use a horizontal line to separate list items. Use 16px or 24px of vertical space instead.
- **Don't use flat black:** Pure `#000000` kills the depth of glassmorphism. Always use the specified `surface` tokens.
- **Don't crowd the edges:** Maintain a strict 20px margin on the 390px mobile canvas. The "Digital Architect" requires breathing room to feel premium.