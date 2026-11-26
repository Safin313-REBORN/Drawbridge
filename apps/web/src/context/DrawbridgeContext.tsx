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

  // Re-run hero inbox assistant whenever guardEnabled or savedPolicyYaml changes
  useEffect(() => {
    let cancelled = false;
    void runInboxAssistant({
      guardEnabled,
      policyYaml: savedPolicyYaml,
    }).then((res) => {
      if (!cancelled) {
        setHeroRun(res);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [guardEnabled, savedPolicyYaml]);

  // Re-generate real trace runs whenever savedPolicyYaml changes
  useEffect(() => {
    let cancelled = false;
    void generateDefaultRuns(savedPolicyYaml).then((res) => {
      if (!cancelled) {
        setRuns(res);
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
