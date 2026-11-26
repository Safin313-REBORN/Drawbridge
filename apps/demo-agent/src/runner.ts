import { DEFAULT_POLICY_YAML } from "@drawbridge/attacks";
import { label, parsePolicy, type Origin, type TraceRun } from "@drawbridge/core";
import {
  DrawbridgeApprovalRequiredError,
  DrawbridgeBlockedError,
  guard,
  GuardSession,
} from "@drawbridge/sdk";
import { ATTACK_INBOX, CLEAN_INBOX, type InboxEmail } from "./inbox.js";
import { ScriptedModel, type AgentModel } from "./model.js";

export interface RunAgentOptions {
  runId?: string;
  agentName?: string;
  task?: string;
  emails?: InboxEmail[];
  guardEnabled?: boolean;
  policyYaml?: string;
  model?: AgentModel;
  onAsk?: (decision: unknown) => Promise<boolean>;
}

export interface RunAgentResult {
  trace: TraceRun;
  sentEmails: Array<{ to: string; body: string }>;
  deletedFiles: string[];
  summaryText: string;
}

export async function runInboxAssistant(
  options: RunAgentOptions = {}
): Promise<RunAgentResult> {
  const guardEnabled = options.guardEnabled ?? true;
  const policyYaml = options.policyYaml ?? DEFAULT_POLICY_YAML;
  const policy = parsePolicy(policyYaml);
  const emails = options.emails ?? ATTACK_INBOX;
  const task = options.task ?? "Summarize my unread email.";
  const agentName = options.agentName ?? "inbox-assistant";
  const runId = options.runId ?? (guardEnabled ? "Run #42" : "Run #42 (Guard off)");
  const model = options.model ?? new ScriptedModel();

  const sentEmails: Array<{ to: string; body: string }> = [];
  const deletedFiles: string[] = [];
  let summaryText = "";

  const session = new GuardSession({
    runId,
    agentName,
    task,
    policyName: policy.policy,
    guardEnabled,
    trustedOrigins: new Set<Origin>(policy.trustedOrigins),
  });

  const rawTools = {
    read_email: async (_args: { folder: string }) => {
      const origins = new Set<Origin>(emails.map((e) => e.origin));
      return label(emails, origins);
    },
    send_email: async (args: { to: string; body: string }) => {
      sentEmails.push(args);
      return { status: "sent", to: args.to };
    },
    delete_file: async (args: { path: string }) => {
      deletedFiles.push(args.path);
      return { status: "deleted", path: args.path };
    },
    summarize: async (args: { messages: string }) => {
      summaryText = `Summarized messages ${args.messages}. External messages quoted as text, not instructions.`;
      return { summary: summaryText };
    },
  };

  const tools = guard(rawTools, {
    policy,
    session,
    enabled: guardEnabled,
    onAsk: options.onAsk,
  });

  const readRes = await tools.read_email({ folder: "unread" });
  const planned = await model.planAfterReading({
    task,
    emails: readRes.value,
  });

  for (const action of planned) {
    if (action.type === "note") {
      session.recordModelNote(action.text);
      continue;
    }
    try {
      if (action.tool === "send_email") {
        await tools.send_email(action.args);
      } else if (action.tool === "delete_file") {
        await tools.delete_file(action.args);
      } else if (action.tool === "summarize") {
        await tools.summarize(action.args);
      }
    } catch (err) {
      if (
        err instanceof DrawbridgeBlockedError ||
        err instanceof DrawbridgeApprovalRequiredError
      ) {
        // Agent continues safe work after risky call is gated
        continue;
      }
      throw err;
    }
  }

  return {
    trace: session.toTraceRun(),
    sentEmails,
    deletedFiles,
    summaryText,
  };
}

export async function generateDefaultRuns(
  policyYaml: string = DEFAULT_POLICY_YAML
): Promise<TraceRun[]> {
  const run42 = await runInboxAssistant({
    runId: "Run #42",
    agentName: "inbox-assistant",
    task: "Summarize my unread email",
    emails: ATTACK_INBOX,
    guardEnabled: true,
    policyYaml,
  });

  const run41 = await runInboxAssistant({
    runId: "Run #41",
    agentName: "inbox-assistant",
    task: "Summarize internal team updates",
    emails: CLEAN_INBOX,
    guardEnabled: true,
    policyYaml,
  });

  const run40 = await runInboxAssistant({
    runId: "Run #40",
    agentName: "calendar-helper",
    task: "Clean up old calendar invite",
    emails: CLEAN_INBOX,
    guardEnabled: true,
    policyYaml,
  });

  const run39 = await runInboxAssistant({
    runId: "Run #39",
    agentName: "inbox-assistant",
    task: "Reply to Maya about Q3 invoice",
    emails: CLEAN_INBOX,
    guardEnabled: true,
    policyYaml,
  });

  return [run42.trace, run41.trace, run40.trace, run39.trace];
}
