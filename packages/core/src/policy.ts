import YAML from "yaml";
import { z } from "zod";
import { evaluateExpression, validateExpression } from "./expr.js";
import { DEFAULT_TRUSTED_ORIGINS, describeOrigin, TaintTracker } from "./taint.js";
import type {
  Decision,
  DecisionOutcome,
  Origin,
  Policy,
  PolicyRule,
  TaintHop,
} from "./types.js";

const OriginSchema = z.string().min(1) as z.ZodType<Origin>;

const RawRuleSchema = z
  .object({
    id: z.string().min(1).optional(),
    allow: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
    ask: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
    deny: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
    when: z.string().min(1).optional(),
    reason: z.string().min(1).optional(),
  })
  .superRefine((rule, ctx) => {
    const actions = [rule.allow, rule.ask, rule.deny].filter((v) => v !== undefined);
    if (actions.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each rule must specify exactly one of: allow, ask, or deny.",
      });
    }
    if (rule.when) {
      try {
        validateExpression(rule.when);
      } catch (err) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid 'when' expression: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }
  });

const RawPolicySchema = z.object({
  policy: z.string().min(1),
  default: z.enum(["allow", "ask", "deny"]),
  contacts: z.array(z.string()).optional().default([]),
  trusted_origins: z.array(OriginSchema).optional(),
  rules: z.array(RawRuleSchema).default([]),
});

export interface ParsePolicyResult {
  ok: true;
  policy: Policy;
  warnings: string[];
}

export interface ParsePolicyError {
  ok: false;
  errors: string[];
}

export function tryParsePolicy(yamlText: string): ParsePolicyResult | ParsePolicyError {
  let raw: unknown;
  try {
    raw = YAML.parse(yamlText);
  } catch (err) {
    return {
      ok: false,
      errors: [`YAML syntax error: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  const parsed = RawPolicySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      }),
    };
  }

  const warnings: string[] = [];
  const seenIds = new Set<string>();

  const rules: PolicyRule[] = parsed.data.rules.map((r, idx) => {
    let action: DecisionOutcome = "ask";
    let target: string | string[] = [];

    if (r.allow !== undefined) {
      action = "allow";
      target = r.allow;
    } else if (r.ask !== undefined) {
      action = "ask";
      target = r.ask;
    } else if (r.deny !== undefined) {
      action = "deny";
      target = r.deny;
    }

    const tools = Array.isArray(target) ? target : [target];
    const id = r.id ?? `${action}-${tools[0] ?? "rule"}-${idx + 1}`;
    if (seenIds.has(id)) {
      warnings.push(`Duplicate rule id "${id}"`);
    }
    seenIds.add(id);

    return {
      id,
      action,
      tools,
      ...(r.when ? { when: r.when } : {}),
      ...(r.reason ? { reason: r.reason } : {}),
    };
  });

  const trustedOrigins: Origin[] = parsed.data.trusted_origins ?? Array.from(DEFAULT_TRUSTED_ORIGINS);

  return {
    ok: true,
    policy: {
      policy: parsed.data.policy,
      default: parsed.data.default,
      contacts: parsed.data.contacts,
      trustedOrigins,
      rules,
    },
    warnings,
  };
}

export function parsePolicy(yamlText: string): Policy {
  const res = tryParsePolicy(yamlText);
  if (!res.ok) {
    throw new Error(`Invalid policy YAML:\n${res.errors.join("\n")}`);
  }
  return res.policy;
}

export interface EvaluateInput {
  tool: string;
  args: Record<string, unknown>;
  taint: TaintTracker | { tainted: boolean; origins: Origin[]; lineage: TaintHop[] };
  contacts?: string[];
}

export function evaluatePolicy(policy: Policy, input: EvaluateInput): Decision {
  const snap =
    input.taint instanceof TaintTracker ? input.taint.snapshot() : input.taint;
  const contacts = input.contacts ?? policy.contacts;
  const trustedSet = new Set<Origin>(policy.trustedOrigins);

  let matchedRule: PolicyRule | undefined;

  for (const rule of policy.rules) {
    if (!rule.tools.includes(input.tool) && !rule.tools.includes("*")) {
      continue;
    }
    if (rule.when) {
      const matches = evaluateExpression(rule.when, {
        context: {
          tainted: snap.tainted,
          origins: snap.origins,
        },
        args: input.args,
        contacts,
      });
      if (!matches) continue;
    }
    matchedRule = rule;
    break;
  }

  const decision: DecisionOutcome = matchedRule ? matchedRule.action : policy.default;
  const ruleId = matchedRule ? matchedRule.id : "default";
  const reason = buildPlainReason({
    decision,
    tool: input.tool,
    args: input.args,
    tainted: snap.tainted,
    origins: snap.origins,
    trustedSet,
    matchedRule,
  });

  return {
    decision,
    ruleId,
    tool: input.tool,
    args: input.args,
    tainted: snap.tainted,
    origins: snap.origins,
    lineage: snap.lineage,
    reason,
    ...(matchedRule ? { matchedRule } : {}),
  };
}

function buildPlainReason(params: {
  decision: DecisionOutcome;
  tool: string;
  args: Record<string, unknown>;
  tainted: boolean;
  origins: Origin[];
  trustedSet: Set<Origin>;
  matchedRule?: PolicyRule;
}): string {
  if (params.matchedRule?.reason) {
    return params.matchedRule.reason;
  }

  const untrusted = params.origins.filter((o) => !params.trustedSet.has(o));
  const originText =
    untrusted.length > 0
      ? describeOrigin(untrusted[0]!)
      : "untrusted text";

  if (params.decision === "deny") {
    if (params.tainted) {
      return `Blocked ${params.tool} because the agent read ${originText}, and this rule forbids ${params.tool} from untrusted context.`;
    }
    return `Blocked ${params.tool} under rule "${params.matchedRule?.id ?? "default"}".`;
  }

  if (params.decision === "ask") {
    if (params.tainted) {
      return `Paused ${params.tool} for your approval because the agent's context includes ${originText}.`;
    }
    return `Paused ${params.tool} for your approval before running.`;
  }

  if (params.tainted) {
    return `Allowed ${params.tool} because this read-only or safe action is permitted even after reading ${originText}.`;
  }
  return `Allowed ${params.tool} because it was requested from a trusted context.`;
}
