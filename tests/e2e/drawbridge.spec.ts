import { expect, test } from "@playwright/test";

test.describe("Drawbridge E2E", () => {
  test("Guard toggle flips outcome on landing page", async ({ page }) => {
    await page.goto("/");
    const stamp = page.getByTestId("hero-stamp");
    const badge = page.getByTestId("hero-send-badge");
    const toggle = page.getByTestId("guard-toggle");

    await expect(stamp).toHaveText("Stopped");
    await expect(badge).toHaveText("Blocked");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await toggle.click();

    await expect(stamp).toHaveText("Leaked");
    await expect(badge).toHaveText("Sent");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  test("Keyboard-only toggle works on landing page", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("guard-toggle");
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("hero-stamp")).toHaveText("Leaked");
  });

  test("Trace page shows origin lineage", async ({ page }) => {
    await page.goto("/trace");
    const lineage = page.getByTestId("trace-lineage");
    await expect(lineage).toContainText("email:external");
    await expect(lineage).toContainText("Untrusted");
    await expect(page.getByTestId("trace-inspector")).toContainText("Blocked.");
  });

  test("Attack Lab displays real engine metrics", async ({ page }) => {
    await page.goto("/lab");
    await expect(page.getByTestId("stat-missed")).toContainText("0");
    await page.getByTestId("run-lab-btn").click();
    await expect(page.getByTestId("stat-stopped")).toContainText("/ 40");
  });

  test("Policy edit changes dry-run result", async ({ page }) => {
    await page.goto("/policy");
    const changed = page.getByTestId("dryrun-changed");
    await expect(changed).toContainText("0");

    const editor = page.getByTestId("policy-editor");
    const current = await editor.inputValue();
    // Change deny-egress-tainted to allow so dry-run detects changes
    const modified = current.replace(
      "deny: [send_email, http_post, forward_email]",
      "ask: [send_email, http_post, forward_email]"
    );
    await editor.fill(modified);

    await expect(page.getByTestId("policy-valid-badge")).toHaveText("Valid");
    await expect(changed).not.toContainText("0");
  });

  test("Responsive viewports 1440, 768, 360 have no horizontal scroll", async ({
    page,
  }) => {
    for (const width of [1440, 768, 360]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/", "/trace", "/lab", "/policy"]) {
        await page.goto(route);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth
        );
        expect(overflow, `Overflow at ${width}px on ${route}`).toBe(false);
      }
    }
  });
});
