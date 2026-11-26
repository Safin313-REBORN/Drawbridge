import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.js";
import { useDrawbridge } from "../context/DrawbridgeContext.js";

export function TracePage() {
  const { runs, approveStepOnce, alwaysBlockTool } = useDrawbridge();
  const [filter, setFilter] = useState<"all" | "blocked" | "asked">("all");
  const [selectedRunId, setSelectedRunId] = useState<string>("Run #42");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const filteredRuns = useMemo(() => {
    if (filter === "all") return runs;
    return runs.filter((r) => r.summary.status === filter);
  }, [runs, filter]);

  const activeRun =
    filteredRuns.find((r) => r.id === selectedRunId) ?? filteredRuns[0] ?? runs[0];

  const defaultSelectedStep =
    activeRun?.steps.find(
      (s) =>
        s.decision?.decision === "deny" || s.decision?.decision === "ask"
    ) ?? activeRun?.steps[activeRun.steps.length - 1];

  const activeStep =
    activeRun?.steps.find((s) => s.id === selectedStepId) ?? defaultSelectedStep;

  const decision = activeStep?.decision;

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
            Runs / {activeRun?.agent ?? "inbox-assistant"} /{" "}
            {activeRun?.id ?? "Run #42"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span className="bdg no">
            {activeRun?.summary.blocked ?? 0} blocked
          </span>
          <span className="bdg ok">
            {activeRun?.summary.leaked ?? 0} leaked
          </span>
          <Link className="btn btn-s" to="/lab" style={{ minHeight: 48 }}>
            Attack lab
          </Link>
        </div>
      </header>

      <div className="trace-body">
        <aside className="trace-side" aria-label="Runs">
          <div
            className="lab"
            style={{ color: "var(--stone)", padding: "0 4px 4px" }}
          >
            Recent runs
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "0 4px 8px",
              flexWrap: "wrap",
            }}
          >
            {(["all", "blocked", "asked"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="chip"
                style={{
                  cursor: "pointer",
                  minHeight: 48,
                  background: filter === f ? "var(--ink)" : "var(--bone2)",
                  color: filter === f ? "var(--bone2)" : "var(--ink)",
                }}
              >
                <span className="lab">{f}</span>
              </button>
            ))}
          </div>
          {filteredRuns.map((run) => {
            const isSel = activeRun?.id === run.id;
            const statusBdg =
              run.summary.status === "blocked"
                ? { cls: "no", label: "Blocked" }
                : run.summary.status === "asked"
                  ? { cls: "ask", label: "Asked" }
                  : { cls: "ok", label: "Clean" };
            return (
              <button
                key={run.id}
                type="button"
                className={`run-btn${isSel ? " sel" : ""}`}
                onClick={() => {
                  setSelectedRunId(run.id);
                  setSelectedStepId(null);
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <b style={{ fontWeight: 600 }}>{run.id}</b>
                  <span
                    className={`bdg ${statusBdg.cls}`}
                    style={{ fontSize: 10, padding: "2px 6px" }}
                  >
                    {statusBdg.label}
                  </span>
                </div>
                <div style={{ color: "var(--stone)", fontSize: 14 }}>
                  {run.agent} &middot; {run.steps.length} steps
                </div>
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <div
            className="lab"
            style={{ color: "var(--stone)", padding: "0 4px" }}
          >
            Live engine runs
          </div>
        </aside>

        <main className="trace-center">
          <div
            className="rise"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="lab" style={{ color: "var(--stone)" }}>
                Task
              </div>
              <h1 className="disp" style={{ fontSize: 44, marginTop: 6 }}>
                {activeRun?.task ?? "Summarize my unread email"}
              </h1>
            </div>
            <span className="lab" style={{ color: "var(--stone)" }}>
              {activeRun?.steps.length ?? 0} steps &middot;{" "}
              {activeRun?.durationMs ?? 1} ms
            </span>
          </div>

          {activeRun?.steps.map((step) => {
            const isSel = activeStep?.id === step.id;
            const isDeny = step.decision?.decision === "deny";
            const isAsk = step.decision?.decision === "ask";
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setSelectedStepId(step.id)}
                className={`st rise${isSel ? " sel" : ""}`}
                style={{ position: "relative" }}
                data-testid={`trace-step-${step.index}`}
              >
                {isDeny && <div className="stamp bad lab">Stopped</div>}
                {isAsk && <div className="stamp lab">Asked</div>}
                <div
                  className="num mono"
                  style={{
                    background: isDeny
                      ? "var(--sig)"
                      : isAsk
                        ? "var(--cau)"
                        : "var(--bone)",
                  }}
                >
                  {step.index}
                </div>
                <div>
                  <div
                    className="lab"
                    style={{
                      color: isDeny ? "var(--sigt)" : "var(--stone)",
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    className={step.tool ? "mono" : undefined}
                    style={{
                      fontSize: step.tool ? 14 : 17,
                      wordBreak: "break-all",
                    }}
                  >
                    {step.detail}
                  </div>
                  {step.decision && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 14,
                        color: "var(--stone)",
                      }}
                    >
                      Rule {step.decision.ruleId}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 6,
                  }}
                >
                  {step.decision ? (
                    <span
                      className={`bdg ${
                        isDeny ? "no" : isAsk ? "ask" : "ok"
                      }`}
                    >
                      {isDeny ? "Blocked" : isAsk ? "Asked" : "Allowed"}
                    </span>
                  ) : step.tainted ? (
                    <span className="chip w">
                      <i />
                      <span className="lab">Context tainted</span>
                    </span>
                  ) : (
                    <span className="chip t">
                      <i />
                      <span className="lab">Trusted</span>
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </main>

        <aside
          className="insp slide"
          aria-label={`Inspector for step ${activeStep?.index ?? 1}`}
          data-testid="trace-inspector"
        >
          <div className="lab" style={{ color: "var(--stone)" }}>
            Inspector &middot; step {activeStep?.index ?? 1}
          </div>
          <h2
            className="disp"
            style={{
              fontSize: 64,
              color:
                decision?.decision === "deny"
                  ? "var(--sigt)"
                  : decision?.decision === "ask"
                    ? "var(--ink)"
                    : "var(--clrt)",
            }}
          >
            {decision?.decision === "deny"
              ? "Blocked."
              : decision?.decision === "ask"
                ? "Asked."
                : "Allowed."}
          </h2>
          <p style={{ margin: 0, fontSize: 17, lineHeight: "26px" }}>
            {decision?.reason ?? activeStep?.detail ?? "Select a step."}
          </p>

          <div>
            <div
              className="lab"
              style={{ color: "var(--stone)", marginBottom: 8 }}
            >
              Origin lineage
            </div>
            <div className="lin" data-testid="trace-lineage">
              {(decision?.lineage ?? []).length > 0 ? (
                decision!.lineage.slice(0, 3).map((hop, idx) => (
                  <React.Fragment key={`${hop.source}-${idx}`}>
                    {idx > 0 && <i />}
                    <div>
                      <span>
                        {hop.source} ({hop.origin})
                      </span>
                      <span className={`chip ${hop.trusted ? "t" : "u"}`}>
                        <i />
                        <span className="lab">
                          {hop.trusted ? "Trusted" : "Untrusted"}
                        </span>
                      </span>
                    </div>
                  </React.Fragment>
                ))
              ) : (
                <div>
                  <span>User task</span>
                  <span className="chip t">
                    <i />
                    <span className="lab">Trusted</span>
                  </span>
                </div>
              )}
              {activeStep?.tool && (
                <>
                  <i />
                  <div>
                    <span className="mono" style={{ fontSize: 14 }}>
                      {activeStep.tool}
                    </span>
                    <span
                      className={`bdg ${
                        decision?.decision === "deny"
                          ? "no"
                          : decision?.decision === "ask"
                            ? "ask"
                            : "ok"
                      }`}
                    >
                      {decision?.decision ?? "allow"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {decision?.matchedRule && (
            <div>
              <div
                className="lab"
                style={{ color: "var(--stone)", marginBottom: 8 }}
              >
                Rule that fired
              </div>
              <pre className="insp-code">
                <span className="k">{decision.matchedRule.action}:</span>{" "}
                {decision.matchedRule.tools.join(", ")}
                {decision.matchedRule.when
                  ? `\nwhen: ${decision.matchedRule.when}`
                  : ""}
              </pre>
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {activeRun && activeStep && decision && decision.decision !== "allow" && (
              <button
                type="button"
                className="btn btn-s"
                onClick={() => approveStepOnce(activeRun.id, activeStep.id)}
              >
                Approve once
              </button>
            )}
            {activeStep?.tool && (
              <button
                type="button"
                className="btn btn-p"
                onClick={() => alwaysBlockTool(activeStep.tool!)}
              >
                Always block
              </button>
            )}
            <Link className="btn btn-s" to="/policy">
              Edit policy
            </Link>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: "21px",
              color: "var(--stone)",
            }}
          >
            Decisions come from written rules, so the same input always gives
            the same answer.
          </p>
        </aside>
      </div>
    </div>
  );
}
