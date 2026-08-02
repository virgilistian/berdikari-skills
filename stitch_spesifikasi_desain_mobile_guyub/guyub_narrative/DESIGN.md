---
name: Guyub Narrative
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#3f4942'
  inverse-surface: '#303030'
  inverse-on-surface: '#f2f0f0'
  outline: '#6f7a71'
  outline-variant: '#bec9bf'
  surface-tint: '#006c44'
  primary: '#006a42'
  on-primary: '#ffffff'
  primary-container: '#258459'
  on-primary-container: '#f6fff6'
  inverse-primary: '#7ed9a6'
  secondary: '#9f4200'
  on-secondary: '#ffffff'
  secondary-container: '#ff7a2b'
  on-secondary-container: '#602500'
  tertiary: '#7d5231'
  on-tertiary: '#ffffff'
  tertiary-container: '#996a47'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9af5c1'
  primary-fixed-dim: '#7ed9a6'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#005232'
  secondary-fixed: '#ffdbcb'
  secondary-fixed-dim: '#ffb692'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#793100'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#f4bb92'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#653d1e'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  price-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  margin-mobile: 16px
  gutter-mobile: 12px
  touch-target: 44px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system is built on the philosophy of "Santai tapi pasti"—blending a relaxed, communal atmosphere with unwavering reliability. It targets hyper-local residents in the Pangkalan and Tegalwaru areas, prioritizing accessibility and trust.

The visual style is **Corporate Modern with a Soft Touch**, leaning into clean layouts while incorporating organic, friendly elements. It avoids the coldness of high-tech enterprise apps by using warmth in the palette and roundedness in the geometry. The interface should feel like a digital extension of the neighborhood market—organized but welcoming.

**Key Principles:**
- **Local Connection:** Use authentic, slightly "handmade" illustrations for empty states to avoid a generic stock-photo feel.
- **Immediate Clarity:** Information hierarchy must prioritize current status and actionable targets.
- **Approachable Voice:** Copy uses "kamu" to create a personal, neighborly dialogue.

## Colors

The palette is rooted in the local landscape and culture.
- **Primary Green (#2D8A5E):** Represents growth, agriculture, and community harmony. Used for primary actions and success states.
- **Secondary Orange (#F27121):** Evokes energy, appetite, and warmth. Used for delivery updates, countdowns, and highlights.
- **Tertiary Earth (#8B5E3C):** A grounding brown used for subtle accents and secondary UI elements to maintain an organic feel.
- **Neutrals:** Soft greys and off-whites are used to reduce visual fatigue, moving away from pure black and white to maintain a "gentle" screen presence.

**Status Colors:**
- **Active/Process:** Primary Green.
- **Pending/Alert:** Secondary Orange.
- **Completed:** Deep Teal.
- **Cancelled/Closed:** Muted Grey-Brown.

## Typography

The typography system prioritizes legibility on mobile devices under varying outdoor light conditions. **Plus Jakarta Sans** provides a friendly, slightly rounded personality for headlines, while **Inter** ensures that functional data (status, prices, distances) remains highly readable.

**Constraints:**
- **Minimum Size:** No text should fall below 14px for body content to ensure accessibility for all age groups in the community.
- **Currency:** Prices use the `price-lg` style with standard Indonesian Rupiah formatting (e.g., Rp 15.000).
- **Line Height:** Generous line-height is applied to prevent crowding in data-heavy list views.

## Layout & Spacing

This design system follows a **Mobile-First 360dp baseline** grid. The layout is fluid, relying on consistent margins rather than rigid columns to accommodate various smartphone aspect ratios.

**Spacing Logic:**
- **Touch Targets:** A strict minimum of 44px for all interactive elements to ensure ease of use while walking or on the move.
- **Outer Margins:** 16px safe area on left and right edges.
- **Vertical Rhythm:** Elements are stacked using multiples of 8px. Use 16px between related items and 24px between distinct sections.
- **Cards:** Content within cards should use a 12px internal padding for a snug, organized feel.

## Elevation & Depth

To maintain the "Santai" (relaxed) feel, this design system avoids harsh, heavy shadows. Instead, it uses **Ambient Shadows** and **Tonal Layering**.

- **Surface Tiers:** The background uses a very light neutral (Off-white). Cards and input fields sit on a pure white surface to pop forward.
- **Shadow Profile:** Shadows are diffused with a large blur radius and low opacity (approx 8-12%), tinted slightly with the tertiary brown to keep them "warm" rather than grey.
- **Interactive Depth:** Buttons use a slightly deeper shadow when active to provide tactile feedback, mimicking a physical press.

## Shapes

The shape language is consistently **Rounded (Radius 2)**. This removes the "sharp edges" of technology, making the app feel more like a community tool and less like a formal banking app.

- **Standard Elements:** 0.5rem (8px) for input fields, small cards, and buttons.
- **Container Elements (rounded-lg):** 1rem (16px) for Merchant cards and Product cards to create a softer visual "cushion."
- **Status Chips:** Use a fully rounded pill-shape (circular ends) to distinguish them from interactive buttons.

## Components

### Buttons & Inputs
- **Primary Action:** Solid Green fill with white text. Minimum height 48px.
- **Input Fields:** 1px neutral border, 8px radius. Label sits above the field in `label-sm`.
- **Touch Targets:** All interactive icons must have a 44x44px minimum hit area, even if the icon itself is smaller.

### Chips & Badges
- **StatusChip:** Pill-shaped. Background uses a 15% opacity version of the status color with a 100% opacity text color for high contrast.
- **Open/Closed Badges:** 
    - **Open:** Green text with a "Dot" indicator. 
    - **Closed:** Muted brown/grey text. Specific timing logic (e.g., "Buka jam 08:00") should be displayed immediately below the badge.

### Cards
- **MerchantCard:** Features a 16px rounded image at the top, followed by the merchant name in `headline-md` and a sub-line for distance/rating.
- **ProductCard:** Horizontal layout for lists; 80px square image with 8px radius, title, and price in `price-lg`.

### Patterns
- **Countdown Timers:** Displayed in Secondary Orange. Use a monospaced-width variant of the body font if possible to prevent "jittering" during the countdown.
- **EmptyState:** Centered handmade-style illustrations with a clear "Call to Action" button below the descriptive text.