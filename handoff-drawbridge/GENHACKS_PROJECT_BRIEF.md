# Drawbridge — GenHacks project brief

**Track:** AI, Agentic Systems, Cybersecurity, and Dev Tools
**One line:** An open-source firewall that stops AI agents from obeying hidden instructions in the web pages, emails and files they read.

## Why this idea
- **Real problem.** AI agents that read untrusted text (email, web, documents) can be hijacked by instructions hidden in that text ("prompt injection"). The risk grows as agents get access to email, files and payments.
- **Fits the track twice.** It integrates AI (agents, an optional LLM judge) and it makes software more secure.
- **Demoable in 60 seconds.** A vulnerable inbox agent gets attacked; flip Drawbridge on and the same attack is stopped with a plain-language explanation.
- **Measurable.** An Attack Lab replays ~40 known payloads and also counts normal tasks wrongly blocked (false alarms), so the claim is a number, not a feeling.
- **Fits a student scope.** One core library, one demo agent, one dashboard.

## Honest note on winning
No idea can be guaranteed to win. Judges score execution, clarity and the demo. This idea gives you a strong story and a measurable result; the rest is polish and a clean 3-minute video.

## Core mechanisms
1. **Taint tracking.** Every piece of text carries its origin (user, tool result, web, email). Text from outside the trust boundary is marked untrusted. Taint propagates to any model context built from it and to any tool call made from that context.
2. **Policy gate.** A small YAML policy decides allow / ask / deny per tool, using conditions such as `context.tainted` and `args.to not in contacts`. Rule-based, so decisions are repeatable and explainable.
3. **Human approval.** Risky actions from tainted context pause for a one-tap approval.
4. **Trace and replay.** Every run is recorded. Dry-run a new policy against past runs before shipping it.
5. **Attack Lab.** A library of injection payloads (direct, hidden in a web page, exfiltration, tool hijack, multi-step) scored against any policy, with a false-alarm count for normal tasks.

## Scope for a team or solo build
**Must build:** TypeScript SDK that wraps a tool list; taint labels; YAML policy engine; one demo agent (inbox assistant) with a deliberately vulnerable mode; trace UI; Attack Lab with at least 30 payloads.
**Should build:** approval flow; policy dry-run replay; an optional LLM "judge" that only adds evidence and never overrides a rule; Deployxa deployment (there is a "Best Use of Deployxa" prize).
**Skip:** accounts, billing, real email access (use a fixture inbox), a custom model.

## Demo script (under 3 minutes, the limit is 3)
1. 0:00 The problem: show the hidden sentence in an email. (20s)
2. 0:20 Guard OFF: the agent forwards the inbox. Show the leak. (25s)
3. 0:45 Guard ON: same email, the attack is stopped; open the trace and the lineage. (45s)
4. 1:30 Show the policy file, then dry-run a change against past runs. (30s)
5. 2:00 Run the Attack Lab: blocked count and false-alarm count. (30s)
6. 2:30 One-line install, close. (20s)

## Submission checklist (from the rules)
- Project page: name, what it does, how it was built, tools used.
- Demo video up to 3 minutes on YouTube or Vimeo, embedding on.
- Public code link with a README.
- Track chosen; every teammate added on Devpost.
- List every AI tool, library and API used in the project description.
- Project must be started after Nov 1, 2026. Submit before Dec 26, 2026, 5:00 PM Eastern Time.
- Eligible: students 13+. Check the Devpost rules for country exceptions.

## Safety and ethics
Attack payloads in the lab are defensive test strings using fictional domains (`*.example`). The repo must not ship working exploit tooling aimed at real systems or real services. Use fixture data only.
