# Drawbridge — Implementation Notes

## Deviations from design HTML references
- **Responsive layouts (768px and 360px):** The `design/*.dc.html` files were authored at fixed `1440px` width. In `apps/web/src/styles/global.css`, we replaced fixed `1440px`/`900px` constraints with fluid `min-height: 100vh` / `max-width: 1440px` and responsive media queries at `1120px`, `768px`, and `480px` so columns stack cleanly with zero horizontal scroll and >=48px tap targets.
- **Editable Policy Editor:** `Policy.dc.html` showed static highlighted lines. `PolicyPage.tsx` uses a real `<textarea>` bound to `tryParsePolicy()` so users can edit YAML live and immediately see validation and dry-run diffs.
- **Syntax highlight tokens:** Replaced raw hex colors in `.k`, `.s`, `.r` with `tokens.css` variables (`--tclr`, `--tcau`, `--tsig`) to uphold the zero-hardcoded-hex rule.

## Open questions / future work
- Persist approved-once overrides and custom policies to local storage or a lightweight backend API if multi-session persistence is needed.
- Add a CLI entrypoint (`npx drawbridge test`) for running `@drawbridge/attacks` in CI pipelines outside Node/Vitest.
