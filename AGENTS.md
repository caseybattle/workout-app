# Workout App Instructions

## Design System

- Treat `DESIGN.md` as the visual source of truth. Read it before changing interface code.
- Preserve the industrial performance-journal direction and page-specific hierarchy.
- Use design tokens from `app/globals.css`; do not introduce one-off colors, spacing, or typography without updating `DESIGN.md`.
- Keep the primary action obvious, touch targets at least 44px, keyboard focus visible, and reduced motion supported.
- Validate design changes with `npm run design:lint`, `npm test`, `npm run test:auth`, and `npm run build`.
- Verify affected screens at desktop and mobile widths before completion.
