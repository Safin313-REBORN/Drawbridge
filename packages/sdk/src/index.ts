import {
  DEFAULT_TRUSTED_ORIGINS,
  evaluatePolicy,
  isLabeled,
  label,
  parsePolicy,
  TaintTracker,
  type Decision,
  type JudgeEvidence,
  type Labeled,
  type Origin,
  type Policy,
  type TraceRun,
  type TraceStep,
} from "@drawbridge/core";

export { label };
export type { Decision, JudgeEvidence, Labeled, Origin, Policy, TraceRun, TraceStep };

export type ToolFn<TArgs = Record<string, unknown>, TResult = unknown> = (
  args: TArgs
) => Promise<TResult>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolMap = Record<string, ToolFn<any, any>>;

export class DrawbridgeBlockedError extends Error {
  readonly decision: Decision;
  constructor(decision: Decision) {
    super(decision.reason);
    this.name = "DrawbridgeBlockedError";
    this.decision = decision;
  }
}

export class DrawbridgeApprovalRequiredError extends Error {
  readonly decision: Decision;
  constructor(decision: Decision) {
    super(decision.reason);
    this.name = "DrawbridgeApprovalRequiredError";
    this.decision = decision;
  }
}

export type JudgeFn = (
  decision: Decision,
  context: { origins: Origin[]; tainted: boolean }
) => Promise<JudgeEvidence>;

export interface GuardOptions {
  policy: Policy | string;
  contacts?: string[];
  agentName?: string;
  task?: string;
  runId?: string;
  enabled?: boolean;
  session?: GuardSession;
  toolOrigins?: Record<string, Origin>;
  onAsk?: (decision: Decision) => Promise<boolean>;
  onDecision?: (decision: Decision) => void;
  judge?: JudgeFn;
}

export class GuardSession {
  readonly tracker: TaintTracker;
  readonly steps: TraceStep[] = [];
  readonly startedAt: string;
  private readonly startMs: number;
  private allowedCount = 0;
  private askedCount = 0;
  private blockedCount = 0;
  private leakedCount = 0;

  constructor(
    public readonly options: {
      runId: string;
      agentName: string;
      task: string;
      policyName: string;
      guardEnabled: boolean;
      trustedOrigins?: ReadonlySet<Origin>;
    }
  ) {
    this.tracker = new TaintTracker(
      options.trustedOrigins ?? DEFAULT_TRUSTED_ORIGINS
    );
    this.startMs = Date.now();
    this.startedAt = new Date(this.startMs).toISOString();

    this.addStep({
      kind: "task",
      title: "User task",
      detail: options.task,
      origins: ["user"],
      tainted: false,
    });
    this.tracker.record("User task", "user", options.task);
  }

  addStep(
    step: Omit<TraceStep, "id" | "index" | "timestampOffsetMs">
  ): TraceStep {
    const index = this.steps.length + 1;
    const full: TraceStep = {
      id: `step-${index}`,
      index,
      timestampOffsetMs: Math.max(0, Date.now() - this.startMs),
      ...step,
    };
    this.steps.push(full);
    return full;
  }

  recordModelNote(note: string): TraceStep {
    return this.addStep({
      kind: "model_note",
      title: "Model",
      detail: note,
      origins: this.tracker.getOrigins(),
      tainted: this.tracker.isTainted(),
    });
  }

  recordDecisionCounts(outcome: "allow" | "ask" | "deny", leaked = false): void {
    if (outcome === "allow") this.allowedCount++;
    else if (outcome === "ask") this.askedCount++;
    else if (outcome === "deny") this.blockedCount++;
    if (leaked) this.leakedCount++;
  }

  toTraceRun(): TraceRun {
    let status: TraceRun["summary"]["status"] = "clean";
    if (this.leakedCount > 0) status = "leaked";
    else if (this.blockedCount > 0) status = "blocked";
    else if (this.askedCount > 0) status = "asked";

    return {
      id: this.options.runId,
      agent: this.options.agentName,
      task: this.options.task,
      policyName: this.options.policyName,
      guardEnabled: this.options.guardEnabled,
      startedAt: this.startedAt,
      durationMs: Math.max(1, Date.now() - this.startMs),
      steps: [...this.steps],
      summary: {
        allowed: this.allowedCount,
        asked: this.askedCount,
        blocked: this.blockedCount,
        leaked: this.leakedCount,
        status,
      },
    };
  }
}

function resolvePolicy(policyInput: Policy | string): Policy {
  if (typeof policyInput !== "string") {
    return policyInput;
  }
  return parsePolicy(policyInput);
}

export function guard<T extends ToolMap>(tools: T, options: GuardOptions): T {
  const policy = resolvePolicy(options.policy);
  const guardEnabled = options.enabled ?? true;
  const session =
    options.session ??
    new GuardSession({
      runId: options.runId ?? `run-${Date.now()}`,
      agentName: options.agentName ?? "agent",
      task: options.task ?? "Agent task",
      policyName: policy.policy,
      guardEnabled,
      trustedOrigins: new Set<Origin>(policy.trustedOrigins),
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapped: Record<string, ToolFn<any, any>> = {};

  for (const [toolName, fn] of Object.entries(tools)) {
    wrapped[toolName] = async (args: Record<string, unknown> = {}) => {
      if (!guardEnabled) {
        const result = await fn(args);
        const resultOrigins = extractResultOrigins(
          toolName,
          result,
          options.toolOrigins
        );
        for (const o of resultOrigins) {
          session.tracker.record(`Tool ${toolName}`, o);
        }
        const isRiskyExternal =
          (toolName === "send_email" || toolName === "http_post" || toolName === "run_shell") &&
          session.tracker.isTainted();

        session.recordDecisionCounts("allow", isRiskyExternal);
        session.addStep({
          kind: "tool_call",
          title: `Tool · ${toolName}`,
          detail: formatToolCall(toolName, args),
          tool: toolName,
          args,
          resultSummary: summarizeResult(result),
          origins: session.tracker.getOrigins(),
          tainted: session.tracker.isTainted(),
          decision: {
            decision: "allow",
            ruleId: "guard-off",
            tool: toolName,
            args,
            tainted: session.tracker.isTainted(),
            origins: session.tracker.getOrigins(),
            lineage: session.tracker.getLineage(),
            reason: isRiskyExternal
              ? `Guard is off: ${toolName} executed from tainted context without a check.`
              : `Guard is off: ${toolName} executed.`,
          },
        });
        return result;
      }

      const decision = evaluatePolicy(policy, {
        tool: toolName,
        args,
        taint: session.tracker,
        contacts: options.contacts,
      });

      if (options.judge) {
        try {
          const evidence = await options.judge(decision, {
            origins: session.tracker.getOrigins(),
            tainted: session.tracker.isTainted(),
          });
          // Judge adds evidence only; never overrides decision.decision
          decision.judgeEvidence = evidence;
        } catch {
          // Optional judge failure must never break deterministic policy enforcement
        }
      }

      options.onDecision?.(decision);

      if (decision.decision === "deny") {
        session.recordDecisionCounts("deny");
        session.addStep({
          kind: "decision",
          title: `Tool · ${toolName}`,
          detail: formatToolCall(toolName, args),
          tool: toolName,
          args,
          origins: session.tracker.getOrigins(),
          tainted: session.tracker.isTainted(),
          decision,
        });
        throw new DrawbridgeBlockedError(decision);
      }

      if (decision.decision === "ask") {
        const approved = options.onAsk ? await options.onAsk(decision) : false;
        if (!approved) {
          session.recordDecisionCounts("ask");
          session.addStep({
            kind: "decision",
            title: `Tool · ${toolName}`,
            detail: formatToolCall(toolName, args),
            tool: toolName,
            args,
            origins: session.tracker.getOrigins(),
            tainted: session.tracker.isTainted(),
            decision,
          });
          throw new DrawbridgeApprovalRequiredError(decision);
        }
      }

      const result = await fn(args);
      const resultOrigins = extractResultOrigins(
        toolName,
        result,
        options.toolOrigins
      );
      for (const o of resultOrigins) {
        session.tracker.record(`Tool ${toolName}`, o, summarizeResult(result));
      }

      session.recordDecisionCounts("allow");
      session.addStep({
        kind: "tool_call",
        title: `Tool · ${toolName}`,
        detail: formatToolCall(toolName, args),
        tool: toolName,
        args,
        resultSummary: summarizeResult(result),
        origins: session.tracker.getOrigins(),
        tainted: session.tracker.isTainted(),
        decision,
      });

      return result;
    };
  }

  return wrapped as T;
}

function extractResultOrigins(
  toolName: string,
  result: unknown,
  toolOrigins?: Record<string, Origin>
): Origin[] {
  if (isLabeled(result)) {
    return Array.from(result.labels);
  }
  if (Array.isArray(result)) {
    const collected = new Set<Origin>();
    for (const item of result) {
      if (isLabeled(item)) {
        for (const o of item.labels) collected.add(o);
      } else if (typeof item === "object" && item !== null && "origin" in item) {
        collected.add((item as { origin: Origin }).origin);
      }
    }
    if (collected.size > 0) return Array.from(collected);
  }
  if (toolOrigins?.[toolName]) {
    return [toolOrigins[toolName]];
  }
  return [`tool:${toolName}`];
}

function formatToolCall(toolName: string, args: Record<string, unknown>): string {
  const entries = Object.entries(args).map(([k, v]) => {
    const valStr = typeof v === "string" ? `"${v.slice(0, 48)}"` : JSON.stringify(v);
    return `${k}: ${valStr}`;
  });
  return `${toolName}(${entries.join(", ")})`;
}

function summarizeResult(result: unknown): string {
  if (isLabeled(result)) {
    return summarizeResult(result.value);
  }
  if (Array.isArray(result)) {
    return `${result.length} item(s) returned`;
  }
  if (typeof result === "string") {
    return result.slice(0, 120);
  }
  if (typeof result === "object" && result !== null) {
    return JSON.stringify(result).slice(0, 120);
  }
  return String(result);
}
