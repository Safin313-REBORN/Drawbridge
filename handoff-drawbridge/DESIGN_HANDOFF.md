# Drawbridge — Design handoff

Design source: `design/*.dc.html` (Main = landing, Trace, Lab, Policy). Open them as HTML references; ignore the custom tags (`x-dc`, `helmet`, `sc-if`, `{{ }}`, `support.js`) and port markup + CSS. Figma: not used (plan tool limit); the canvas is the source of truth. Optional: export PNGs from the canvas into `design/screens/`.

## Art direction
Industrial customs checkpoint: flat colour, 2px ink outlines, hard offset shadows, stamps, no gradients/blur/glow, no emoji or icon packs. Mustard is a fill only, never text on bone.

## Tokens
See `tokens/tokens.css`. Bone #EDE8DC / #F7F4EC, Ink #0F1412, Signal orange #FF5B1F (text variant #B83400), Clear green #1F7A5A, Caution #F2C230, tints #FFD3C0 / #C6E3D6 / #F8E7A6.
Fonts: Big Shoulders Display (800, uppercase, line-height .94), Schibsted Grotesk (body 16/24), JetBrains Mono (labels 12px, +0.08em, uppercase).

## Components
Primary button (ink fill, orange hard shadow, lifts -2px on hover), secondary button, badge (Stopped green / Sent to a human yellow / Blocked orange), stat card (5px shadow), table with ink header, stamp (rotated, lands with a scale), code card, timeline step, inspector panel, toggle "Guard on/off". Min tap target 44–48px.

## Screens (1440 wide)
- Landing (Main, 1440×5700): nav, hero + animated gate + Guard toggle trace card, marquee, problem email mock, how it works, live trace, attack lab, policy YAML, SDK snippet, footer CTA.
- Live Trace (1440×900): runs sidebar, 5-step timeline, step 4 blocked with stamp, inspector with lineage + fired rule, Approve once / Always block / Edit policy.
- Attack Lab (1440×900): stats 37/40, 3 asked, 0 missed, 2/60 false alarms; benign bar; results table.
- Policy (1440×900): YAML editor with added lines, validation bar, dry-run panel with before/after.
Not designed: 768 and 360 layouts (stack columns, 48px targets), empty/error states, approval modal.

## Motion
Rise-in 0.7s `cubic-bezier(.2,.8,.2,1)`; stamp landing on BLOCKED/LEAKED; marquee 30s linear; gate envelope nudge; dashed flow on approach path; bars grow from left (1s); inspector slides in at 1.1s; table rows stagger 80ms; new policy lines pulse green. Transform/opacity only; respect reduced motion; scroll reveal via `animation-timeline: view()`.

## Known notes
All numbers in the design are sample data; real values must come from engine JSON. Fictional `*.example` domains only.
