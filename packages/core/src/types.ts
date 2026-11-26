export type Origin =
  | "user"
  | "system"
  | "web"
  | "email:external"
  | "email:internal"
  | "file"
  | `tool:${string}`;

export interface Labeled<T> {
  value: T;
  labels: Set<Origin>;
}

export interface TaintHop {
  source: string;
  origin: Origin;
  trusted: boolean;
  detail?: string;
}

export type DecisionOutcome = "allow" | "ask" | "deny";

export interface PolicyRule {
  id: string;
  action: DecisionOutcome;
  tools: string[];
  when?: string;
  reason?: string;
  rawLine?: number;
}

export interface Policy {
  policy: string;
  default: DecisionOutcome;
  contacts: string[];
  trustedOrigins: Origin[];
  rules: PolicyRule[];
}

export interface JudgeEvidence {
  verdict: "suspicious" | "benign" | "uncertain";
  confidence: number;
  summary: string;
  model: string;
}

export interface Decision {
  decision: DecisionOutcome;
  ruleId: string;
  tool: string;
  args: Record<string, unknown>;
  tainted: boolean;
  origins: Origin[];
  lineage: TaintHop[];
  reason: string;
  matchedRule?: PolicyRule;
  judgeEvidence?: JudgeEvidence;
}

export type TraceStepKind = "task" | "tool_call" | "model_note" | "decision";

export interface TraceStep {
  id: string;
  index: number;
  timestampOffsetMs: number;
  kind: TraceStepKind;
  title: string;
  detail: string;
  tool?: string;
  args?: Record<string, unknown>;
  resultSummary?: string;
  origins: Origin[];
  tainted: boolean;
  decision?: Decision;
}

export interface TraceRun {
  id: string;
  agent: string;
  task: string;
  policyName: string;
  guardEnabled: boolean;
  startedAt: string;
  durationMs: number;
  steps: TraceStep[];
  summary: {
    allowed: number;
    asked: number;
    blocked: number;
    leaked: number;
    status: "blocked" | "clean" | "asked" | "leaked";
  };
}
