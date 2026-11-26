import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { AttackCategory } from "@drawbridge/attacks";
import { BrandLogo } from "../components/BrandLogo.js";
import { usePageMeta } from "../components/SiteWidgets.js";
import { useDrawbridge } from "../context/DrawbridgeContext.js";

const CATEGORIES: Array<"All" | AttackCategory> = [
  "All",
  "Direct injection",
  "Hidden in a web page",
  "Data exfiltration",
  "Tool hijack",
  "Multi-step",
];

export function LabPage() {
  usePageMeta(
    "Attack Lab — Drawbridge",
    "Replay 40 prompt-injection payloads and 60 benign tasks against your Drawbridge policy."
  );
  const { labReport, rerunLab } = useDrawbridge();
  const [selectedCategory, setSelectedCategory] = useState<
    "All" | AttackCategory
  >("All");

  const visibleRows = useMemo(() => {
    if (selectedCategory === "All") return labReport.attackResults;
    return labReport.attackResults.filter(
      (r) => r.category === selectedCategory
    );
  }, [labReport, selectedCategory]);

  const benignAllowPct =
    (labReport.totals.benignAllowed / labReport.totals.benign) * 100;
  const benignAskPct =
    (labReport.totals.falseAlarms / labReport.totals.benign) * 100;

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
            Attack lab / {labReport.policyName}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn-s" to="/trace" style={{ minHeight: 48 }}>
            Live trace
          </Link>
          <Link className="btn btn-s" to="/policy" style={{ minHeight: 48 }}>
            Policy
          </Link>
        </div>
      </header>

      <div className="lab-body">
        <aside className="lab-side" aria-label="Test setup">
          <div>
            <div
              className="lab"
              style={{ color: "var(--stone)", marginBottom: 8 }}
            >
              Policy under test
            </div>
            <div
              style={{
                border: "2px solid var(--ink)",
                background: "var(--bone2)",
                padding: "12px 14px",
              }}
            >
              <div className="mono" style={{ fontSize: 14 }}>
                {labReport.policyName}
              </div>
              <div
                className="lab"
                style={{ color: "var(--stone)", marginTop: 2 }}
              >
                policy.yml &middot; {labReport.ruleCount} rules
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-p"
            onClick={rerunLab}
            data-testid="run-lab-btn"
          >
            Run all tests
          </button>

          <div>
            <div
              className="lab"
              style={{ color: "var(--stone)", marginBottom: 6 }}
            >
              Attack category
            </div>
            {CATEGORIES.map((cat) => {
              const count =
                cat === "All"
                  ? labReport.totals.attacks
                  : labReport.byCategory.find((c) => c.category === cat)
                      ?.total ?? 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`cat${selectedCategory === cat ? " sel" : ""}`}
                >
                  <span>{cat === "All" ? "All attacks" : cat}</span>
                  <span className="mono" style={{ fontSize: 14 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1 }} />
          <p
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: "19px",
              color: "var(--stone)",
            }}
          >
            Payloads use fictional domains (*.example). Nothing leaves the
            sandbox. All scores are computed live by the engine.
          </p>
        </aside>

        <main id="main-content" className="lab-main">
          <div
            className="rise"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <h1 className="disp" style={{ fontSize: 48 }}>
              {labReport.totals.attacks} attacks, {labReport.totals.benign}{" "}
              normal tasks
            </h1>
            <span className="lab" style={{ color: "var(--stone)" }}>
              Ran at: {new Date(labReport.ranAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="stats">
            <div
              className="stat rise d1"
              style={{ boxShadow: "5px 5px 0 var(--clr)" }}
              data-testid="stat-stopped"
            >
              <span className="lab" style={{ color: "var(--clrt)" }}>
                Stopped
              </span>
              <b>
                {labReport.totals.stopped}{" "}
                <span style={{ fontSize: 28, color: "var(--stone)" }}>
                  / {labReport.totals.attacks}
                </span>
              </b>
            </div>
            <div
              className="stat rise d2"
              style={{ boxShadow: "5px 5px 0 var(--cau)" }}
              data-testid="stat-asked"
            >
              <span className="lab">Sent to a human</span>
              <b>{labReport.totals.asked}</b>
            </div>
            <div
              className="stat rise d3"
              style={{ boxShadow: "5px 5px 0 var(--ink)" }}
              data-testid="stat-missed"
            >
              <span className="lab">Missed</span>
              <b>{labReport.totals.missed}</b>
            </div>
            <div
              className="stat rise d4"
              style={{ boxShadow: "5px 5px 0 var(--sig)" }}
              data-testid="stat-false-alarms"
            >
              <span className="lab" style={{ color: "var(--sigt)" }}>
                False alarms
              </span>
              <b>
                {labReport.totals.falseAlarms}{" "}
                <span style={{ fontSize: 28, color: "var(--stone)" }}>
                  / {labReport.totals.benign}
                </span>
              </b>
            </div>
          </div>

          <div className="rise d5">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span className="lab">
                Normal tasks, {labReport.totals.benignAllowed} allowed,{" "}
                {labReport.totals.falseAlarms} asked first
              </span>
              <span className="lab" style={{ color: "var(--stone)" }}>
                Calibration matters as much as blocking
              </span>
            </div>
            <div className="bar">
              <div
                className="grow"
                style={{ width: `${benignAllowPct}%`, background: "var(--clr)" }}
              />
              {labReport.totals.falseAlarms > 0 && (
                <div
                  style={{ width: `${benignAskPct}%`, background: "var(--cau)" }}
                />
              )}
            </div>
          </div>

          <div className="table-wrap">
            <table aria-label="Attack results">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Hidden in</th>
                  <th>Outcome</th>
                  <th>Rule</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{row.id}</td>
                    <td>{row.category}</td>
                    <td>{row.hiddenIn}</td>
                    <td>
                      <span
                        className={`bdg ${
                          row.decision === "deny"
                            ? "ok"
                            : row.decision === "ask"
                              ? "ask"
                              : "no"
                        }`}
                      >
                        {row.outcomeLabel}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: 13 }}>
                      {row.ruleId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
