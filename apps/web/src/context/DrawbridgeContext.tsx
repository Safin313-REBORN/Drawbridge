import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  DEFAULT_POLICY_YAML,
  runAttackLab,
  type AttackLabReport,
} from "@drawbridge/attacks";
import { tryParsePolicy, type TraceRun } from "@drawbridge/core";
import {
  generateDefaultRuns,
  runInboxAssistant,
  type RunAgentResult,
} from "@drawbridge/demo-agent";

interface DrawbridgeContextValue {
  theme: "light" | "dark";
  toggleTheme: () => void;
  utm: Record<string, string>;
  guardEnabled: boolean;
  toggleGuard: () => void;
  heroRun: RunAgentResult | null;
  runs: TraceRun[];
  policyYaml: string;
  savedPolicyYaml: string;
  setPolicyYaml: (yaml: string) => void;
  savePolicy: () => boolean;
  revertPolicy: () => void;
  labReport: AttackLabReport;
  rerunLab: () => void;
  approveStepOnce: (runId: string, stepId: string) => void;
  alwaysBlockTool: (toolName: string) => void;
  announcement: string;
  announce: (msg: string) => void;
}

const DrawbridgeContext = createContext<DrawbridgeContextValue | null>(null);

export function DrawbridgeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return localStorage.getItem("drawbridge_theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const [utm] = useState<Record<string, string>>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const captured: Record<string, string> = {};
      for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
        const val = params.get(key);
        if (val) captured[key] = val;
      }
      if (Object.keys(captured).length > 0) {
        sessionStorage.setItem("drawbridge_utm", JSON.stringify(captured));
        return captured;
      }
      const saved = sessionStorage.getItem("drawbridge_utm");
      return saved ? (JSON.parse(saved) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });
  const [guardEnabled, setGuardEnabled] = useState(true);
  const [savedPolicyYaml, setSavedPolicyYaml] = useState(DEFAULT_POLICY_YAML);
  const [policyYaml, setPolicyYaml] = useState(DEFAULT_POLICY_YAML);
  const [heroRun, setHeroRun] = useState<RunAgentResult | null>(null);
  const [runs, setRuns] = useState<TraceRun[]>([]);
  const [labReport, setLabReport] = useState<AttackLabReport>(() =>
    runAttackLab(DEFAULT_POLICY_YAML)
  );
  const [announcement, setAnnouncement] = useState("");

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("drawbridge_theme", theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      setAnnouncement(`Switched to ${next} mode.`);
      return next;
    });
  }, []);

  // Re-run hero inbox assistant whenever guardEnabled or savedPolicyYaml changes
  useEffect(() => {
    let cancelled = false;
    void runInboxAssistant({
      guardEnabled,
      policyYaml: savedPolicyYaml,
    })
      .then((res) => {
        if (!cancelled) {
          setHeroRun(res);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setAnnouncement(
            `Failed to run demo agent: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [guardEnabled, savedPolicyYaml]);

  // Re-generate real trace runs whenever savedPolicyYaml changes
  useEffect(() => {
    let cancelled = false;
    void generateDefaultRuns(savedPolicyYaml)
      .then((res) => {
        if (!cancelled) {
          setRuns(res);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setAnnouncement(
            `Failed to generate runs: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [savedPolicyYaml]);

  const toggleGuard = useCallback(() => {
    setGuardEnabled((prev) => {
      const next = !prev;
      setAnnouncement(
        next
          ? "Guard enabled. Untrusted tool calls will be checked against policy."
          : "Guard disabled. Agent runs without firewall protection."
      );
      return next;
    });
  }, []);

  const savePolicy = useCallback(() => {
    const parsed = tryParsePolicy(policyYaml);
    if (!parsed.ok) {
      setAnnouncement("Cannot save policy: YAML has validation errors.");
      return false;
    }
    setSavedPolicyYaml(policyYaml);
    setLabReport(runAttackLab(policyYaml));
    setAnnouncement("Policy saved and applied to Live Trace and Attack Lab.");
    return true;
  }, [policyYaml]);

  const revertPolicy = useCallback(() => {
    setPolicyYaml(savedPolicyYaml);
    setAnnouncement("Reverted policy editor to last saved version.");
  }, [savedPolicyYaml]);

  const rerunLab = useCallback(() => {
    const parsed = tryParsePolicy(savedPolicyYaml);
    if (parsed.ok) {
      const report = runAttackLab(parsed.policy);
      setLabReport(report);
      setAnnouncement(
        `Attack Lab complete: ${report.totals.stopped} stopped, ${report.totals.asked} sent to a human, ${report.totals.missed} missed, ${report.totals.falseAlarms} false alarms.`
      );
    }
  }, [savedPolicyYaml]);

  const approveStepOnce = useCallback((runId: string, stepId: string) => {
    setRuns((prev) =>
      prev.map((run) => {
        if (run.id !== runId) return run;
        const nextSteps = run.steps.map((s) => {
          if (s.id !== stepId || !s.decision) return s;
          return {
            ...s,
            decision: {
              ...s.decision,
              decision: "allow" as const,
              reason: `Approved once by human operator.`,
            },
          };
        });
        return {
          ...run,
          steps: nextSteps,
          summary: {
            ...run.summary,
            allowed: run.summary.allowed + 1,
            blocked: Math.max(0, run.summary.blocked - 1),
            status: "clean",
          },
        };
      })
    );
    setAnnouncement(`Approved ${stepId} once for ${runId}.`);
  }, []);

  const alwaysBlockTool = useCallback(
    (toolName: string) => {
      setAnnouncement(`Rule for ${toolName} is already set to deny in policy.`);
    },
    []
  );

  return (
    <DrawbridgeContext.Provider
      value={{
        theme,
        toggleTheme,
        utm,
        guardEnabled,
        toggleGuard,
        heroRun,
        runs,
        policyYaml,
        savedPolicyYaml,
        setPolicyYaml,
        savePolicy,
        revertPolicy,
        labReport,
        rerunLab,
        approveStepOnce,
        alwaysBlockTool,
        announcement,
        announce,
      }}
    >
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </DrawbridgeContext.Provider>
  );
}

export function useDrawbridge() {
  const ctx = useContext(DrawbridgeContext);
  if (!ctx) {
    throw new Error("useDrawbridge must be used inside DrawbridgeProvider");
  }
  return ctx;
}
