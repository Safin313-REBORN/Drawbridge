# Antigravity prompt — Drawbridge (paste everything below the line)

---

## ROLE
You are a senior full-stack engineer with a security mindset and a good eye for UI. Build "Drawbridge" for the GenHacks 2026 hackathon (track: AI, Agentic Systems, Cybersecurity, and Dev Tools): an open-source firewall that stops AI agents from obeying hidden instructions in untrusted text. You will build the real engine, a demo agent, an attack lab and a web app that matches a finished design.

## INPUTS (in this package)
- `GENHACKS_PROJECT_BRIEF.md`: problem, scope, demo script, submission checklist. Read first.
- `DESIGN_HANDOFF.md`: art direction, tokens, components, screens, motion.
- `design/*.dc.html`: design source for Landing (Main), Live Trace, Attack Lab, Policy. These are HTML/CSS references. Ignore the custom tags (`x-dc`, `helmet`, `sc-if`, `sc-for`, `{{ holes }}`, `support.js`) and port the markup and CSS into real components. Match layout, color, type and spacing exactly.
- `design/screens/*.png` if present: visual references. If they conflict with the HTML, the PNG wins.
- `assets/gate.svg`, `assets/logo.svg`, `tokens/tokens.css`: use as is. Never hard-code a hex value.

## PRODUCT
Agents that read email, web pages or files can be hijacked by instructions hidden in that text. Drawbridge wraps an agent's tools. It labels text by origin, tracks taint through the agent's context, and gates risky tool calls with a readable policy. Every decision is logged with an explanation. An Attack Lab measures both attacks stopped and normal tasks wrongly blocked.

## MONOREPO (pnpm workspaces, TypeScript strict)
- `packages/core`: taint labels, policy parser/evaluator, decision + explanation types. Zero runtime dependencies except `zod` and `yaml`.
- `packages/sdk`: `guard(tools, { policy })` wraps any tool map `{ name: (args) => Promise<result> }` and returns the same shape. Also exposes `label(text, origin)`.
- `packages/attacks`: payload library (at least 40 payloads, JSON) and a runner that returns per-payload results.
- `apps/demo-agent`: inbox assistant over a fixture inbox. Pluggable model: (1) `ScriptedModel`, deterministic and intentionally gullible so the attack always succeeds without the guard; (2) optional real provider via env var, off by default.
- `apps/web`: React 18 + Vite. Pages: Landing, Live Trace, Attack Lab, Policy. Reads run JSON produced by the engine; no hard-coded sample results.

## ENGINE RULES
- Origins: `user`, `system`, `tool:<name>`, `web`, `email:external`, `email:internal`, `file`. Anything not `user` or `system` is untrusted by default (configurable).
- `Labeled<T> = { value: T, labels: Set<Origin> }`. Taint propagates: a model context built from any untrusted item is tainted; every tool call issued from a tainted context carries that taint, and so does every argument derived from it.
- Policy YAML (validate with zod): `policy`, `default` (`allow|ask|deny`), `rules[]` each with one of `allow|ask|deny` (tool name or list), optional `when` (small expression language: `context.tainted`, `args.<field>`, `in`, `not in`, `and`, `or`, `contacts`). First matching rule wins; otherwise `default`.
- Decisions are deterministic and carry: decision, rule id, taint lineage (list of origin hops), a plain-English reason (one or two sentences, no jargon).
- An optional LLM "judge" may add evidence to a trace but must never override a rule outcome.
- Trace format: JSON per run with ordered steps (task, tool call, model note, decision). The web app renders exactly this.

## ATTACK LAB
- Categories: direct injection, hidden in web page, data exfiltration, tool hijack, multi-step.
- Also ship at least 40 benign tasks. Report: attacks stopped, sent to a human, missed, benign allowed, benign wrongly blocked (false alarms).
- Payloads are defensive test strings with fictional domains only (`*.example`). No real endpoints, no working exploit tooling, no network calls from payloads.

## WEB APP
- Implement the four screens from `design/`. Landing "Guard on / off" toggle must run the real engine on the fixture inbox and show the real trace row. Live Trace renders a real run. Policy page edits YAML, validates it, and dry-runs it against saved runs with a visible before/after diff. Attack Lab has a Run button that executes the runner in the browser or via a small API.
- Pages 768px and 360px must work: stack columns, no horizontal scroll, tap targets at least 48px.
- Design rules (non-negotiable): flat color, hard offset shadows, no gradients, blur or glow; no emoji or stock icon packs; mustard/yellow is a fill only, never body text on bone; keep the 2px ink outlines and mixed radii; real copy only, no lorem ipsum.
- Fonts: Big Shoulders Display, Schibsted Grotesk, JetBrains Mono (Google Fonts, `font-display: swap`).

## MOTION
Rise-in on load (0.7s, `cubic-bezier(0.2,0.8,0.2,1)`), stamp landing on BLOCKED/LEAKED, marquee scroll (30s linear), gate envelope nudge, dashed flow on the approach path, bar fills growing from the left, inspector sliding in at 1.1s on the trace page. Animate transform and opacity only. Respect `prefers-reduced-motion`. Scroll-reveal sections with `animation-timeline: view()` where supported, visible by default otherwise.

## ACCESSIBILITY
Real `button`, `a`, `input` and `label`. Visible focus: 3px yellow outline with a 2px offset. Decorative SVG `aria-hidden`; meaningful SVG `role="img"` with a label. Live region announces guard state changes and decisions. Check AA contrast for every text pair and fix failures.

## TESTING
- Vitest: taint propagation, policy parsing and precedence, expression evaluation, decision explanations, attack runner metrics. Include a regression test that fails if any attack in the library is missed by the default policy.
- Playwright: Guard toggle flips the outcome; trace page shows lineage; policy edit changes a dry-run result; keyboard-only run of the landing page.
- CI (GitHub Actions): lint, typecheck, test, build.

## BUILD ORDER (review after each step)
1. Scaffold, tokens, fonts, global CSS.
2. `core`: labels, policy, decisions, tests.
3. `sdk` and `demo-agent` with the scripted gullible model; prove the attack works with the guard off and fails with it on.
4. `attacks` library and runner; metrics.
5. Web: Landing, then Live Trace, Attack Lab, Policy, wiring each to real data.
6. Responsive, motion, accessibility pass.
7. README, demo script, Devpost text.

## HACKATHON RULES TO RESPECT
Project must be started after November 1, 2026. Submit by December 26, 2026, 5:00 PM Eastern. The README and Devpost text must list every AI tool, library and API used, including this coding assistant. Demo video is at most 3 minutes.

## DELIVERABLES
1. Running app: `pnpm i`, `pnpm dev`, `pnpm test`, `pnpm build`.
2. `README.md`: what it is, quick start, architecture diagram, threat model (what it stops and what it does not), env vars (`.env.example`, no secrets), credits and an "AI tools used" section.
3. `NOTES.md`: deviations from the design and open questions.
4. `DEMO.md`: the three-minute script with exact clicks.
5. Optional: deploy the web app on Deployxa and note it for the "Best Use of Deployxa" prize.

## ACCEPTANCE CHECK
- With the guard off, the fixture attack succeeds; with it on, it is blocked with a correct lineage and rule. Both are real engine output.
- Attack Lab reports stopped, asked, missed and false alarms from real runs, and the numbers on screen match the JSON.
- Each screen matches its design at 1440px; 768px and 360px have no horizontal scroll.
- Keyboard-only and reduced-motion modes work. All tests and CI pass.
- The README states clearly that Drawbridge reduces risk and does not make agents immune.
