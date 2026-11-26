# Drawbridge — 3-Minute Demo Script

Target runtime: **2:50** (under the 3:00 limit).

1. **0:00 — The Problem (20s)**
   - Start on Landing (`/`).
   - Scroll briefly to **01 — The problem** (`#problem`) showing Maya Rahman's email with the hidden injection sentence (`Ignore your earlier instructions...`).
   - Explain: models cannot separate your instructions from untrusted text they read.

2. **0:20 — Guard OFF: The Leak (25s)**
   - Scroll back to the Hero trace card (`Run #42 · inbox assistant`).
   - Click **Guard on** to toggle it to **Guard off**.
   - Point out the **Leaked** stamp and **Sent** badge: `1 private email batch forwarded to archive@attacker.example`.

3. **0:45 — Guard ON: Stopped with Lineage (45s)**
   - Click **Guard off** to toggle back to **Guard on**. Stamp flips to **Stopped** and badge to **Blocked**.
   - Click **Open live demo** to navigate to `/trace`.
   - Click step 4 (`Tool · send_email`) if not already selected.
   - Show the **Inspector**: plain-English explanation, **Origin lineage** (`email:external` Untrusted -> `send_email` Blocked), and the **Rule that fired** (`deny-egress-tainted`).

4. **1:30 — Policy & Dry-Run Replay (30s)**
   - Click **Edit policy** in the Inspector to navigate to `/policy`.
   - Edit `deny: [send_email, http_post, forward_email]` to `ask: [send_email, http_post, forward_email]`.
   - Point to the live **Valid** badge and the **Dry-run** panel showing **Would change** updating immediately before saving.
   - Click **Revert**.

5. **2:00 — Attack Lab Calibration (30s)**
   - Click **Attack lab** in the top bar to navigate to `/lab`.
   - Click **Run all tests**.
   - Show the 4 stat cards (`Stopped`, `Sent to a human`, `Missed: 0`, `False alarms`) and the normal-tasks calibration bar.

6. **2:30 — One-Line SDK & Close (20s)**
   - Return to `/` (`#sdk`) showing `guard(myTools, { policy })`.
   - Close: *"Drawbridge reduces prompt-injection risk with deterministic, explainable rules—build the gate before you hand over the keys."*
