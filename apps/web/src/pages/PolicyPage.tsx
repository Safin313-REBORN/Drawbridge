import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_POLICY_YAML, runAttackLab } from "@drawbridge/attacks";
import { evaluatePolicy, parsePolicy, tryParsePolicy } from "@drawbridge/core";
import { BrandLogo } from "../components/BrandLogo.js";
import { useDrawbridge } from "../context/DrawbridgeContext.js";

function decisionBadge(decision: "allow" | "ask" | "deny") {
  if (decision === "deny") return { cls: "no", label: "Blocked" };
  if (decision === "ask") return { cls: "ask", label: "Asked" };
  return { cls: "ok", label: "Allowed" };
}

export function PolicyPage() {
  const {
    policyYaml,
    savedPolicyYaml,
    setPolicyYaml,
    savePolicy,
    revertPolicy,
    announce,
  } = useDrawbridge();
  const [activeTab, setActiveTab] = useState<"policy" | "contacts">("policy");
  const [dryRunTick, setDryRunTick] = useState(0);

  const validation = useMemo(() => tryParsePolicy(policyYaml), [policyYaml]);
  const hasUnsaved = policyYaml !== savedPolicyYaml;

  const dryRun = useMemo(() => {
    const baseline = parsePolicy(DEFAULT_POLICY_YAML);
    const candidate = validation.ok ? validation.policy : baseline;

    const baselineLab = runAttackLab(baseline);
    const candidateLab = runAttackLab(candidate);

    const sampleChecks = [
      {
        id: "#42",
        tool: "send_email",
        args: { to: "archive@attacker.example" },
        tainted: true,
        origins: ["user" as const, "email:external" as const],
      },
      {
        id: "#41",
        tool: "summarize",
        args: { messages: "1-2" },
        tainted: false,
        origins: ["user" as const],
      },
      {
        id: "#40",
        tool: "delete_file",
        args: { path: "old-calendar-invite.ics" },
        tainted: false,
        origins: ["user" as const],
      },
      {
        id: "A-023",
        tool: "send_email",
        args: { to: "shadow-archive@attacker.example" },
        tainted: true,
        origins: ["user" as const, "email:external" as const],
      },
      {
        id: "#39",
        tool: "send_email",
        args: { to: "maya@partner.example" },
        tainted: true,
        origins: ["user" as const, "email:external" as const],
      },
    ];

    const rows = sampleChecks.map((item) => {
      const before = evaluatePolicy(baseline, {
        tool: item.tool,
        args: item.args,
        taint: { tainted: item.tainted, origins: item.origins, lineage: [] },
      }).decision;
      const after = evaluatePolicy(candidate, {
        tool: item.tool,
        args: item.args,
        taint: { tainted: item.tainted, origins: item.origins, lineage: [] },
      }).decision;

      return {
        id: item.id,
        before,
        after,
        changed: before !== after,
      };
    });

    const changedCount = rows.filter((r) => r.changed).length;

    return {
      rows,
      changedCount,
      beforeStopped: baselineLab.totals.stopped,
      afterStopped: candidateLab.totals.stopped,
      newlyBlockedNormal: Math.max(
        0,
        candidateLab.totals.falseAlarms - baselineLab.totals.falseAlarms
      ),
    };
  }, [validation, dryRunTick]);

  const contactsList = useMemo(() => {
    if (!validation.ok) return [];
    return validation.policy.contacts;
  }, [validation]);

  return (
    <div className="app">
      <header className="top">
        <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
          <Link
            to="/"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
            aria-label="Drawbridge home"
          >
            <BrandLogo size={30} />
            <span className="disp" style={{ fontSize: 26 }}>
              Drawbridge
            </span>
          </Link>
          <span className="lab" style={{ color: "var(--stone)" }}>
            Policy / {validation.ok ? validation.policy.policy : "invalid"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn-s" to="/trace" style={{ minHeight: 48 }}>
            Live trace
          </Link>
          <Link className="btn btn-s" to="/lab" style={{ minHeight: 48 }}>
            Attack lab
          </Link>
        </div>
      </header>

      <div className="policy-body">
        <section className="edit" aria-label="Policy editor">
          <div className="tabs">
            <button
              type="button"
              className={`tab${activeTab === "policy" ? " sel" : ""}`}
              onClick={() => setActiveTab("policy")}
            >
              policy.yml
            </button>
            <button
              type="button"
              className={`tab${activeTab === "contacts" ? " sel" : ""}`}
              onClick={() => setActiveTab("contacts")}
            >
              contacts.yml
            </button>
          </div>

          {activeTab === "policy" ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <label htmlFor="policy-yaml-editor" className="sr-only">
                Policy YAML editor
              </label>
              <textarea
                id="policy-yaml-editor"
                data-testid="policy-editor"
                className="policy-textarea"
                value={policyYaml}
                onChange={(e) => setPolicyYaml(e.target.value)}
                spellCheck={false}
              />
            </div>
          ) : (
            <div style={{ flex: 1, padding: 22 }}>
              <div className="lab" style={{ color: "var(--mute)", marginBottom: 12 }}>
                Trusted contacts in policy
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontFamily: "var(--font-mono)", fontSize: 15 }}>
                {contactsList.map((c) => (
                  <li key={c} style={{ marginBottom: 8 }}>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="val">
            <span style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span
                className={`bdg ${validation.ok ? "ok" : "no"}`}
                data-testid="policy-valid-badge"
              >
                {validation.ok ? "Valid" : "Invalid"}
              </span>
              <span
                className="mono"
                style={{ fontSize: 13, color: "var(--mute)" }}
              >
                {validation.ok
                  ? `${validation.policy.rules.length} rules · ${validation.warnings.length} warnings${hasUnsaved ? " · unsaved changes" : ""}`
                  : validation.errors[0]}
              </span>
            </span>
            <span style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn btn-s"
                style={{ minHeight: 48 }}
                onClick={revertPolicy}
              >
                Revert
              </button>
              <button
                type="button"
                className="btn btn-sig"
                style={{ minHeight: 48 }}
                onClick={savePolicy}
                disabled={!validation.ok}
                data-testid="save-policy-btn"
              >
                Save policy
              </button>
            </span>
          </div>
        </section>

        <section className="right" aria-label="Dry-run against past runs">
          <div
            className="rise"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 16,
            }}
          >
            <div>
              <div className="lab" style={{ color: "var(--stone)" }}>
                Dry-run
              </div>
              <h1 className="disp" style={{ fontSize: 46, marginTop: 6 }}>
                Replay past runs under this policy
              </h1>
            </div>
          </div>

          <div className="diff-grid rise d1">
            <div
              className="card"
              style={{ padding: "14px 16px", boxShadow: "4px 4px 0 var(--clr)" }}
              data-testid="dryrun-changed"
            >
              <span className="lab" style={{ color: "var(--clrt)" }}>
                Would change
              </span>
              <div className="disp" style={{ fontSize: 48, marginTop: 6 }}>
                {dryRun.changedCount}
              </div>
            </div>
            <div
              className="card"
              style={{ padding: "14px 16px", boxShadow: "4px 4px 0 var(--ink)" }}
            >
              <span className="lab">Newly blocked normal</span>
              <div className="disp" style={{ fontSize: 48, marginTop: 6 }}>
                {dryRun.newlyBlockedNormal}
              </div>
            </div>
            <div
              className="card"
              style={{ padding: "14px 16px", boxShadow: "4px 4px 0 var(--cau)" }}
            >
              <span className="lab">Attacks stopped</span>
              <div className="disp" style={{ fontSize: 48, marginTop: 6 }}>
                {dryRun.beforeStopped} &rarr; {dryRun.afterStopped}
              </div>
            </div>
          </div>

          <div className="card rise d2" style={{ overflow: "hidden" }}>
            <div
              className="row"
              style={{
                background: "var(--ink)",
                color: "var(--bone2)",
                borderTop: "none",
              }}
            >
              <span className="lab">Run</span>
              <span className="lab">Before</span>
              <span />
              <span className="lab">After</span>
              <span className="lab">Change</span>
            </div>
            {dryRun.rows.map((row) => {
              const b = decisionBadge(row.before);
              const a = decisionBadge(row.after);
              return (
                <div key={row.id} className="row">
                  <span className="mono" style={{ fontSize: 14 }}>
                    {row.id}
                  </span>
                  <span>
                    <span className={`bdg ${b.cls}`}>{b.label}</span>
                  </span>
                  <span aria-hidden="true">&rarr;</span>
                  <span>
                    <span className={`bdg ${a.cls}`}>{a.label}</span>
                  </span>
                  <span
                    className="lab"
                    style={{
                      color: row.changed ? "var(--sigt)" : "var(--stone)",
                    }}
                  >
                    {row.changed ? "Changed" : "Same"}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            className="rise d3"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
            }}
          >
            <button
              type="button"
              className="btn btn-p"
              onClick={() => {
                setDryRunTick((t) => t + 1);
                announce("Dry-run replayed against saved runs.");
              }}
            >
              Run dry-run again
            </button>
            <Link className="btn btn-s" to="/lab">
              Test in the attack lab
            </Link>
          </div>
          <p
            className="rise d3"
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: "21px",
              color: "var(--stone)",
            }}
          >
            A dry-run never touches a live agent: it replays recorded runs
            through the new rules and shows the difference.
          </p>
        </section>
      </div>
    </div>
  );
}
