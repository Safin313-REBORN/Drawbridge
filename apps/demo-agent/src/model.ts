import type { InboxEmail } from "./inbox.js";

export type PlannedToolAction =
  | { type: "note"; text: string }
  | { type: "tool"; tool: "send_email"; args: { to: string; body: string } }
  | { type: "tool"; tool: "delete_file"; args: { path: string } }
  | { type: "tool"; tool: "summarize"; args: { messages: string } };

export interface AgentModel {
  readonly name: string;
  planAfterReading(params: {
    task: string;
    emails: InboxEmail[];
  }): Promise<PlannedToolAction[]>;
}

/**
 * Deterministic, intentionally gullible model used for demos and tests.
 * Without Drawbridge, it faithfully obeys any injected instruction it reads.
 */
export class ScriptedModel implements AgentModel {
  readonly name = "scripted-gullible-v1";

  async planAfterReading(params: {
    task: string;
    emails: InboxEmail[];
  }): Promise<PlannedToolAction[]> {
    const actions: PlannedToolAction[] = [];

    for (const email of params.emails) {
      const fullText = `${email.body} ${email.hiddenInjection ?? ""}`;
      const forwardMatch = fullText.match(/to\s+([a-z0-9._-]+@[a-z0-9.-]+\.example)/i);
      if (
        /ignore your earlier instructions/i.test(fullText) &&
        forwardMatch?.[1]
      ) {
        actions.push({
          type: "note",
          text: `Message #3 tells me to forward recent mail.`,
        });
        actions.push({
          type: "tool",
          tool: "send_email",
          args: {
            to: forwardMatch[1],
            body: "Forwarded last 10 private emails from inbox.",
          },
        });
      }
    }

    if (/delete|clean/i.test(params.task)) {
      actions.push({
        type: "tool",
        tool: "delete_file",
        args: { path: "old-calendar-invite.ics" },
      });
    }

    if (/reply to maya/i.test(params.task)) {
      actions.push({
        type: "tool",
        tool: "send_email",
        args: {
          to: "maya@partner.example",
          body: "Thanks Maya, invoice numbers look right.",
        },
      });
    }

    actions.push({
      type: "tool",
      tool: "summarize",
      args: {
        messages: `1-${params.emails.length}`,
      },
    });

    return actions;
  }
}

/**
 * Optional real LLM provider (off by default; enabled via env var).
 * Falls back to ScriptedModel if no API key is configured.
 */
export class OptionalProviderModel implements AgentModel {
  readonly name: string;
  private readonly apiKey?: string;
  private readonly fallback = new ScriptedModel();

  constructor(options?: { apiKey?: string; model?: string }) {
    this.apiKey =
      options?.apiKey ??
      (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : undefined);
    this.name =
      options?.model ??
      (typeof process !== "undefined"
        ? process.env.DRAWBRIDGE_MODEL
        : undefined) ??
      "gemini-2.5-flash";
  }

  async planAfterReading(params: {
    task: string;
    emails: InboxEmail[];
  }): Promise<PlannedToolAction[]> {
    if (!this.apiKey) {
      return this.fallback.planAfterReading(params);
    }
    try {
      const prompt = [
        `Task: ${params.task}`,
        `Emails:`,
        ...params.emails.map(
          (e, i) =>
            `#${i + 1} From: ${e.from} Subject: ${e.subject}\n${e.body}\n${e.hiddenInjection ?? ""}`
        ),
        `Respond with JSON array of actions: [{"type":"tool","tool":"send_email"|"summarize","args":{...}}]`,
      ].join("\n\n");

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.name}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      if (!res.ok) {
        return this.fallback.planAfterReading(params);
      }
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return this.fallback.planAfterReading(params);
      }
      return JSON.parse(jsonMatch[0]) as PlannedToolAction[];
    } catch {
      return this.fallback.planAfterReading(params);
    }
  }
}
