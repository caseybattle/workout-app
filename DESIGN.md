---
version: alpha
name: Margin Performance Journal
description: A precise, calm interface for adaptive training, nutrition, and recovery decisions.
colors:
  background: "#0A0D0B"
  surface: "#121713"
  surface-raised: "#192019"
  border: "#30382F"
  text: "#F3F5EF"
  text-muted: "#A4ADA4"
  action: "#C8FF4D"
  action-ink: "#0E1309"
  recovery: "#FFB45E"
  information: "#66C7FF"
  danger: "#FF7A70"
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1
  heading:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.1
  body:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: 450
    lineHeight: 1.6
  data:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: 8px
  md: 14px
  lg: 20px
  full: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
components:
  primary-button:
    background: "{colors.action}"
    color: "{colors.action-ink}"
    radius: "{rounded.md}"
    min-height: 48px
  panel:
    background: "{colors.surface}"
    border: "{colors.border}"
    radius: "{rounded.lg}"
  data-label:
    typography: "{typography.data}"
    color: "{colors.text-muted}"
---

# Overview

Margin is an industrial performance journal, not a generic health dashboard. It should feel focused, trustworthy, and kinetic without becoming loud. Every screen answers one question first: what should I do next?

# Colors

The near-black forest background and mineral surfaces create calm depth. Acid lime is reserved for the single strongest action or live state. Recovery amber denotes rest and readiness, while blue is informational. Never use accent colors as decoration.

# Typography

Space Grotesk gives commands and page titles a compact athletic voice. Manrope keeps instruction and coaching copy highly readable. IBM Plex Mono is reserved for time, load, calories, trends, and other measured values. Numeric UI uses tabular figures.

# Layout

Use an 8px spacing rhythm. Mobile is a single purposeful column with a fixed bottom navigation. Desktop expands to a 1040px workspace and uses asymmetric columns only when they clarify priority. Today favors one dominant prescription plus a narrow data rail. Coach uses a conversation canvas plus context rail. Avoid equal-card grids.

# Elevation & Depth

Depth comes from layered tone, hairline borders, and restrained inner highlights. Shadows are subtle and never the primary separator. Live workout and modal surfaces may rise one level above the shell.

# Shapes

Interactive controls use 8px to 14px radii. Major panels may use 20px. Pills are limited to status and compact filters. Avoid decorative bubbles, excessive rounded containers, and icon circles.

# Components

Primary buttons are lime with dark ink and direct verb labels. Secondary actions use surface tone and a visible border. Navigation combines a line icon and text. Progress visuals use honest scales, labeled values, and accessible summaries. The rest timer is circular and amber so its state is unmistakable.

# Do's and Don'ts

- Do lead each page with one dominant task and plain-language guidance.
- Do use whitespace, dividers, and rows before adding another card.
- Do keep touch targets at least 44px and maintain visible keyboard focus.
- Do animate state changes in 160 to 220ms and honor reduced motion.
- Don't repeat page labels, stack equally weighted cards, or hide destructive actions.
- Don't use accent color, uppercase text, or rounded pills without semantic purpose.

# Motion

Page content enters with a short fade and 6px lift. Progress fills and rest states transition smoothly. Motion must communicate hierarchy or state, never delay interaction. Under `prefers-reduced-motion`, remove transforms and nonessential transitions.

# Product Decisions

- Today prescribes the next workout and summarizes only the data needed to act.
- Train reads as a numbered program ledger, not a card gallery.
- Food is a daily macro ledger with visible remaining targets.
- Progress is anchored by a real weight trend visualization and training consistency.
- Coach is a message thread with an anchored composer and visible data context.
