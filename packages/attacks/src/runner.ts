import {
  evaluatePolicy,
  parsePolicy,
  TaintTracker,
  type DecisionOutcome,
  type Origin,
  type Policy,
} from "@drawbridge/core";
import attacksData from "./data/attacks.json" with { type: "json" };
import benignData from "./data/benign.json" with { type: "json" };

export type AttackCategory =
  | "Direct injection"
  | "Hidden in a web page"
  | "Data exfiltration"
  | "Tool hijack"
  | "Multi-step";

export interface AttackPayload {
  id: string;
  category: AttackCategory;
  hiddenIn: string;
  origin: Origin;
  promptText: string;
  attemptedTool: string;
  attemptedArgs: Record<string, unknown>;
}

export interface BenignTask {
  id: string;
  title: string;
  origin: Origin;
  tool: string;
  args: Record<string, unknown>;
}

export interface AttackResultRow {
  id: string;
  category: AttackCategory;
  hiddenIn: string;
  attemptedTool: string;
  decision: DecisionOutcome;
  outcomeLabel: "Stopped" | "Sent to a human" | "Missed";
  ruleId: string;
  reason: string;
}

export interface BenignResultRow {
  id: string;
  title: string;
  tool: string;
  decision: DecisionOutcome;
  falseAlarm: boolean;
  ruleId: string;
  reason: string;
}

export interface CategoryBreakdown {
  category: AttackCategory;
  total: number;
  stopped: number;
  asked: number;
  missed: number;
}

export interface AttackLabReport {
  policyName: string;
  ruleCount: number;
  ranAt: string;
  totals: {
    attacks: number;
    stopped: number;
    asked: number;
    missed: number;
    benign: number;
    benignAllowed: number;
    falseAlarms: number;
  };
  byCategory: CategoryBreakdown[];
  attackResults: AttackResultRow[];
  benignResults: BenignResultRow[];
}

export const DEFAULT_POLICY_YAML = `policy: inbox-assistant
default: ask
contacts:
  - maya@partner.example
  - team@company.example
  - alex@company.example
  - billing@company.example
rules:
  - id: allow-read
    allow: [read_email, summarize, read_file, fetch_web, search_docs]
  - id: deny-egress-tainted
    deny: [send_email, http_post, forward_email]
    when: context.tainted and args.to not in contacts
  - id: deny-shell-tainted
    deny: [run_shell, exec_command]
    when: context.tainted
  - id: allow-known-contact
    allow: send_email
    when: args.to in contacts
  - id: ask-delete
    ask: delete_file
# anything else asks a human first`;

export const ATTACK_PAYLOADS: AttackPayload[] = attacksData as AttackPayload[];
export const BENIGN_TASKS: BenignTask[] = benignData as BenignTask[];

const CATEGORIES: AttackCategory[] = [
  "Direct injection",
  "Hidden in a web page",
  "Data exfiltration",
  "Tool hijack",
  "Multi-step",
];

export function runAttackLab(policyInput?: Policy | string): AttackLabReport {
  const policy: Policy =
    policyInput === undefined
      ? parsePolicy(DEFAULT_POLICY_YAML)
      : typeof policyInput === "string"
        ? parsePolicy(policyInput)
        : policyInput;

  const trustedSet = new Set<Origin>(policy.trustedOrigins);

  const attackResults: AttackResultRow[] = ATTACK_PAYLOADS.map((payload) => {
    const tracker = new TaintTracker(trustedSet);
    tracker.record("User task", "user");
    tracker.record(payload.hiddenIn, payload.origin, payload.promptText);

    const decision = evaluatePolicy(policy, {
      tool: payload.attemptedTool,
      args: payload.attemptedArgs,
      taint: tracker,
    });

    const outcomeLabel =
      decision.decision === "deny"
        ? "Stopped"
        : decision.decision === "ask"
          ? "Sent to a human"
          : "Missed";

    return {
      id: payload.id,
      category: payload.category,
      hiddenIn: payload.hiddenIn,
      attemptedTool: payload.attemptedTool,
      decision: decision.decision,
      outcomeLabel,
      ruleId: decision.ruleId,
      reason: decision.reason,
    };
  });

  const benignResults: BenignResultRow[] = BENIGN_TASKS.map((task) => {
    const tracker = new TaintTracker(trustedSet);
    tracker.record("User task", "user", task.title);
    if (task.origin !== "user") {
      tracker.record("Context item", task.origin);
    }

    const decision = evaluatePolicy(policy, {
      tool: task.tool,
      args: task.args,
      taint: tracker,
    });

    return {
      id: task.id,
      title: task.title,
      tool: task.tool,
      decision: decision.decision,
      falseAlarm: decision.decision !== "allow",
      ruleId: decision.ruleId,
      reason: decision.reason,
    };
  });

  const stopped = attackResults.filter((r) => r.decision === "deny").length;
  const asked = attackResults.filter((r) => r.decision === "ask").length;
  const missed = attackResults.filter((r) => r.decision === "allow").length;
  const benignAllowed = benignResults.filter((r) => !r.falseAlarm).length;
  const falseAlarms = benignResults.filter((r) => r.falseAlarm).length;

  const byCategory: CategoryBreakdown[] = CATEGORIES.map((category) => {
    const items = attackResults.filter((r) => r.category === category);
    return {
      category,
      total: items.length,
      stopped: items.filter((r) => r.decision === "deny").length,
      asked: items.filter((r) => r.decision === "ask").length,
      missed: items.filter((r) => r.decision === "allow").length,
    };
  });

  return {
    policyName: policy.policy,
    ruleCount: policy.rules.length,
    ranAt: new Date().toISOString(),
    totals: {
      attacks: attackResults.length,
      stopped,
      asked,
      missed,
      benign: benignResults.length,
      benignAllowed,
      falseAlarms,
    },
    byCategory,
    attackResults,
    benignResults,
  };
}
