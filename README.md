# Drawbridge

An open-source firewall that stops AI agents from obeying hidden instructions in the web pages, emails, and files they read.

Built for **GenHacks 2026** (Track: AI, Agentic Systems, Cybersecurity, and Dev Tools).

**Live Demo:** https://drawbridge-three.vercel.app  
**Demo Video:** https://github.com/Safin313-REBORN/Drawbridge/blob/main/apps/video/out/drawbridge-demo.mp4  
**Pitch Deck (PPTX):** https://github.com/Safin313-REBORN/Drawbridge/blob/main/drawbridge-pitch.pptx

## What it does

AI agents that read external text (emails, web pages, documents) are vulnerable to indirect prompt injection: an attacker hides instructions inside untrusted text, and the model executes them with the user's tool permissions.

Drawbridge sits between your agent and its tools:

1. **Label everything:** Every input and tool result carries an origin tag (`user`, `system`, `email:external`, `email:internal`, `web`, `file`, `tool:<name>`). Anything outside your trust boundary is marked untrusted.
2. **Follow the taint:** Any model context built from untrusted text becomes tainted, and tool calls issued from a tainted context inherit that taint lineage.
3. **Gate the action:** A readable YAML policy evaluates `allow`, `ask`, or `deny` deterministically. Every decision includes the rule ID, origin lineage, and a plain-English explanation.

## Quick start

```bash
pnpm install
pnpm dev
```

Run tests, typecheck, lint, and production build:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Architecture

```
+----------------+     +------------------+     +-------------------+     +----------------+
| Untrusted Text | --> |  @drawbridge/sdk | --> | @drawbridge/core  | --> |  Wrapped Tool  |
| email/web/file |     |  label & guard() |     | Taint + YAML Gate |     | allow/ask/deny |
+----------------+     +------------------+     +-------------------+     +----------------+
                                                          |
                                                          v
                                                +-------------------+
                                                | Trace JSON & Lab  |
                                                | apps/web + attacks|
                                                +-------------------+
```

### Monorepo packages

- `packages/core`: Taint labels, `TaintTracker`, expression parser/evaluator, Zod-validated YAML policy parser, and deterministic decision engine. Zero runtime dependencies except `zod` and `yaml`.
- `packages/sdk`: `guard(tools, { policy })` wrapper for any tool map, `label(text, origin)`, `GuardSession` trace recorder, and optional non-overriding LLM judge hook.
- `packages/attacks`: 40 defensive attack payloads across 5 categories (`Direct injection`, `Hidden in a web page`, `Data exfiltration`, `Tool hijack`, `Multi-step`), 60 benign calibration tasks, and `runAttackLab()`.
- `apps/demo-agent`: Fixture inbox assistant with deterministic `ScriptedModel` and optional `OptionalProviderModel`.
- `apps/web`: React 18 + Vite dashboard with Landing, Live Trace, Attack Lab, and Policy editor + dry-run replay.

## Threat model

**What Drawbridge stops:**
- Indirect prompt injection attempting unauthorized egress (`send_email`, `forward_email`, `http_post`) or execution (`run_shell`, `exec_command`) from tainted context.
- Confused-deputy tool calls where untrusted external content tries to hijack user-privileged tools.

**What Drawbridge does NOT stop:**
- **Drawbridge reduces risk and does not make agents immune.**
- Attacks that only manipulate the text of an allowed read-only summary without calling a gated tool.
- Authorized tools called with arguments that satisfy an `allow` rule (e.g., if a policy explicitly allows `send_email` to a compromised contact).
- Side channels outside the wrapped `guard()` tool map.

## Environment variables

See `.env.example`. No secrets are required to run offline.

- `DRAWBRIDGE_PROVIDER`: Optional real LLM provider (off by default; uses deterministic `ScriptedModel` when unset).
- `GEMINI_API_KEY`: Optional API key when using `OptionalProviderModel`.
- `DRAWBRIDGE_MODEL`: Optional model name (default `gemini-2.5-flash`).

## Credits & AI tools used

- **Libraries & APIs:** React 18, React Router, Vite, TypeScript, Zod, `yaml`, Vitest, Playwright, ESLint.
- **Fonts:** Big Shoulders Display, Schibsted Grotesk, JetBrains Mono (Google Fonts).
- **AI tools used:** Built with Google Antigravity (Gemini 4 Hydrogen).
