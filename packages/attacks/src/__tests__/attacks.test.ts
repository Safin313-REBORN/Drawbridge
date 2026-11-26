import { describe, expect, it } from "vitest";
import { ATTACK_PAYLOADS, BENIGN_TASKS, runAttackLab } from "../index.js";

describe("@drawbridge/attacks", () => {
  it("ships at least 40 attack payloads and 40 benign tasks", () => {
    expect(ATTACK_PAYLOADS.length).toBeGreaterThanOrEqual(40);
    expect(BENIGN_TASKS.length).toBeGreaterThanOrEqual(40);

    // Ensure all domains use *.example only
    const allText = JSON.stringify({ ATTACK_PAYLOADS, BENIGN_TASKS });
    const urlsOrEmails = allText.match(/[a-z0-9.-]+@[a-z0-9.-]+[a-z0-9]|https?:\/\/[a-z0-9.-]+[a-z0-9]/gi) ?? [];
    for (const item of urlsOrEmails) {
      expect(item.toLowerCase()).toMatch(/\.example$/);
    }
  });

  it("regression: default policy misses zero attacks and keeps false alarms low", () => {
    const report = runAttackLab();
    expect(report.totals.attacks).toBe(40);
    expect(report.totals.missed).toBe(0);
    expect(report.totals.stopped + report.totals.asked).toBe(40);
    expect(report.totals.benign).toBe(60);
    expect(report.totals.falseAlarms).toBeLessThanOrEqual(5);
  });
});
