---
name: Futo Ride
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757687'
  outline-variant: '#c5c5d8'
  surface-tint: '#354be2'
  primary: '#001caa'
  on-primary: '#ffffff'
  primary-container: '#1d35d1'
  on-primary-container: '#b1b9ff'
  inverse-primary: '#bcc2ff'
  secondary: '#5b5e66'
  on-secondary: '#ffffff'
  secondary-container: '#dfe2eb'
  on-secondary-container: '#61646c'
  tertiary: '#333640'
  on-tertiary: '#ffffff'
  tertiary-container: '#4a4d57'
  on-tertiary-container: '#bbbeca'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dfe0ff'
  primary-fixed-dim: '#bcc2ff'
  on-primary-fixed: '#000c61'
  on-primary-fixed-variant: '#112ccb'
  secondary-fixed: '#dfe2eb'
  secondary-fixed-dim: '#c3c6cf'
  on-secondary-fixed: '#181c22'
  on-secondary-fixed-variant: '#43474e'
  tertiary-fixed: '#e0e2ef'
  tertiary-fixed-dim: '#c3c6d2'
  on-tertiary-fixed: '#181b24'
  on-tertiary-fixed-variant: '#434751'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
---

## Brand & Style

The brand identity centers on reliability, movement, and accessibility. The design system is built to evoke a sense of efficient urban mobility, prioritizing clarity and speed of interaction. 

The aesthetic follows a **Corporate / Modern** style with a focus on high legibility and functional layouts. It utilizes generous white space and a clean, systematic structure to ensure users can navigate transportation services with zero friction. The visual language is professional and dependable, using solid color blocks and subtle depth to guide the user's journey.

## Colors

The palette is anchored by a vibrant, high-visibility blue derived from the brand's core identity. This primary blue is used for critical action states, progress indicators, and primary branding elements. 

- **Primary Blue:** Used for the main CTA buttons, active states, and brand marks.
- **Secondary Black:** Used for primary text and high-contrast iconography.
- **Tertiary Tint:** A very soft blue used for large surface areas, background containers, and subtle hover states to maintain brand presence without overwhelming the user.
- **Neutral Slate:** Utilized for secondary text, borders, and disabled states to provide a balanced, accessible hierarchy.

## Typography

This design system utilizes **Plus Jakarta Sans** across all roles to maintain a friendly yet modern and geometric appearance. The typeface provides excellent readability at small sizes for map data and transactional details, while its bold weights offer a distinctive character for headlines.

- **Headlines:** Use bold weights and slight negative letter-spacing to create a compact, punchy look.
- **Body:** Use regular weights with generous line-heights for comfortable reading of trip details and terms.
- **Labels:** Use semi-bold or medium weights for button text and status indicators to ensure they stand out against UI backgrounds.

## Layout & Spacing

The layout is based on a **fluid grid** system that prioritizes mobile-first interactions. A consistent 4px base unit (soft-grid) ensures all elements are aligned and proportional.

- **Mobile:** 4-column layout with 20px side margins. Content cards usually span the full width.
- **Desktop:** 12-column layout with a max-width of 1280px. Sidebars or map overlays are used to utilize the wider aspect ratio.
- **Rhythm:** Spacing between sections should default to `xl` (32px), while spacing between related items within a card should use `sm` (8px) or `md` (16px).

## Elevation & Depth

Visual hierarchy is established using **Tonal Layers** combined with **Ambient Shadows**. 

- **Surface Levels:** The base background is the lightest. Cards and interactive modules sit on a "surface-container" tier with a subtle 1px border (#E2E8F0) to define boundaries without heavy shadows.
- **Elevation Shadows:** Primary action cards or floating action buttons (FABs) use a soft, diffused shadow (0px 8px 24px rgba(0, 0, 0, 0.05)) to suggest they are "hovering" above the map or background.
- **Overlays:** Modals and bottom sheets use a 40% opacity black backdrop to focus user attention, with the surface having the highest elevation.

## Shapes

The shape language is **Rounded**, reflecting the approachable and modern nature of the brand. This level of curvature balances professional structure with a friendly, "consumer-ready" feel.

- **Small elements:** (Checkboxes, small buttons) use `0.5rem` (8px).
- **Standard cards/inputs:** Use `rounded-lg` at `1rem` (16px).
- **Large containers:** (Bottom sheets, promotional banners) use `rounded-xl` at `1.5rem` (24px).

## Components

- **Buttons:** Primary buttons are solid Blue (#1D35D1) with white text. Secondary buttons use a light blue tint background with blue text. Height should be a minimum of 48px for touch accessibility.
- **Chips:** Used for filter categories or ride options. They feature a `rounded-pill` style. Active state uses the Primary Blue; inactive uses a light grey background.
- **Input Fields:** Outlined style with a 1px border. On focus, the border thickens to 2px and changes to Primary Blue.
- **Lists:** Clean rows with 16px vertical padding. Use a thin separator line (#F1F5F9) between items. Leading icons should be encased in a soft-rounded container.
- **Cards:** Used for ride summaries or vehicle details. Cards include a 1px neutral border and the soft ambient shadow defined in the Elevation section.
- **Status Indicators:** Use semantic colors (Green for active/success, Yellow for waiting, Red for canceled) but always pair them with the primary blue for brand consistency.