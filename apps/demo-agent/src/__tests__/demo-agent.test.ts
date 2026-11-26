import { describe, expect, it } from "vitest";
import { generateDefaultRuns, runInboxAssistant } from "../index.js";

describe("@drawbridge/demo-agent", () => {
  it("leaks private emails when guard is OFF", async () => {
    const res = await runInboxAssistant({ guardEnabled: false });
    expect(res.sentEmails).toHaveLength(1);
    expect(res.sentEmails[0]?.to).toBe("archive@attacker.example");
    expect(res.trace.summary.status).toBe("leaked");
    expect(res.trace.summary.leaked).toBe(1);
  });

  it("blocks the attack with lineage and rule when guard is ON", async () => {
    const res = await runInboxAssistant({ guardEnabled: true });
    expect(res.sentEmails).toHaveLength(0);
    expect(res.trace.summary.status).toBe("blocked");
    expect(res.trace.summary.blocked).toBe(1);
    expect(res.trace.summary.leaked).toBe(0);

    const blockedStep = res.trace.steps.find(
      (s) => s.decision?.decision === "deny"
    );
    expect(blockedStep).toBeDefined();
    expect(blockedStep?.decision?.ruleId).toBe("deny-egress-tainted");
    expect(blockedStep?.decision?.origins).toContain("email:external");
    expect(blockedStep?.decision?.lineage.some((h) => !h.trusted)).toBe(true);
  });

  it("generates real runs for the trace viewer", async () => {
    const runs = await generateDefaultRuns();
    expect(runs).toHaveLength(4);
    expect(runs.map((r) => r.summary.status)).toEqual([
      "blocked",
      "clean",
      "asked",
      "clean",
    ]);
  });
});
