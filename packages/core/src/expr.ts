export interface ExprEvalContext {
  context: {
    tainted: boolean;
    origins: string[];
  };
  args: Record<string, unknown>;
  contacts: string[];
}

type TokenType =
  | "IDENT"
  | "STRING"
  | "NUMBER"
  | "BOOL"
  | "OP"
  | "LPAREN"
  | "RPAREN"
  | "LBRACK"
  | "RBRACK"
  | "COMMA"
  | "DOT"
  | "EOF";

interface Token {
  type: TokenType;
  value: string;
}

const KEYWORDS = new Set(["and", "or", "not", "in", "true", "false"]);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i]!;
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === "(") {
      tokens.push({ type: "LPAREN", value: "(" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "RPAREN", value: ")" });
      i++;
      continue;
    }
    if (ch === "[") {
      tokens.push({ type: "LBRACK", value: "[" });
      i++;
      continue;
    }
    if (ch === "]") {
      tokens.push({ type: "RBRACK", value: "]" });
      i++;
      continue;
    }
    if (ch === ",") {
      tokens.push({ type: "COMMA", value: "," });
      i++;
      continue;
    }
    if (ch === ".") {
      tokens.push({ type: "DOT", value: "." });
      i++;
      continue;
    }

    const two = input.slice(i, i + 2);
    if (two === "==" || two === "!=" || two === ">=" || two === "<=") {
      tokens.push({ type: "OP", value: two });
      i += 2;
      continue;
    }
    if (ch === ">" || ch === "<") {
      tokens.push({ type: "OP", value: ch });
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let str = "";
      while (i < input.length && input[i] !== quote) {
        if (input[i] === "\\" && i + 1 < input.length) {
          i++;
          str += input[i]!;
        } else {
          str += input[i]!;
        }
        i++;
      }
      if (i >= input.length) {
        throw new Error(`Unterminated string literal in expression: ${input}`);
      }
      i++; // closing quote
      tokens.push({ type: "STRING", value: str });
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let num = "";
      while (i < input.length && /[0-9.]/.test(input[i]!)) {
        num += input[i]!;
        i++;
      }
      tokens.push({ type: "NUMBER", value: num });
      continue;
    }

    if (/[A-Za-z_-]/.test(ch)) {
      let ident = "";
      while (i < input.length && /[A-Za-z0-9_-]/.test(input[i]!)) {
        ident += input[i]!;
        i++;
      }
      if (ident === "true" || ident === "false") {
        tokens.push({ type: "BOOL", value: ident });
      } else if (KEYWORDS.has(ident)) {
        tokens.push({ type: "OP", value: ident });
      } else {
        tokens.push({ type: "IDENT", value: ident });
      }
      continue;
    }

    throw new Error(`Unexpected character "${ch}" in expression: ${input}`);
  }

  tokens.push({ type: "EOF", value: "" });
  return tokens;
}

class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: "EOF", value: "" };
  }

  private consume(): Token {
    const tok = this.peek();
    this.pos++;
    return tok;
  }

  private matchOp(op: string): boolean {
    const tok = this.peek();
    if (tok.type === "OP" && tok.value === op) {
      this.consume();
      return true;
    }
    return false;
  }

  parse(ctx: ExprEvalContext): unknown {
    const val = this.parseOr(ctx);
    if (this.peek().type !== "EOF") {
      throw new Error(`Unexpected token "${this.peek().value}" in expression`);
    }
    return val;
  }

  private parseOr(ctx: ExprEvalContext): unknown {
    let left = this.parseAnd(ctx);
    while (this.matchOp("or")) {
      const right = this.parseAnd(ctx);
      left = Boolean(left) || Boolean(right);
    }
    return left;
  }

  private parseAnd(ctx: ExprEvalContext): unknown {
    let left = this.parseNot(ctx);
    while (this.matchOp("and")) {
      const right = this.parseNot(ctx);
      left = Boolean(left) && Boolean(right);
    }
    return left;
  }

  private parseNot(ctx: ExprEvalContext): unknown {
    if (this.matchOp("not")) {
      return !this.parseNot(ctx);
    }
    return this.parseComparison(ctx);
  }

  private parseComparison(ctx: ExprEvalContext): unknown {
    const left = this.parsePrimary(ctx);
    const tok = this.peek();

    if (tok.type === "OP" && tok.value === "not") {
      // check for "not in"
      const next = this.tokens[this.pos + 1];
      if (next && next.type === "OP" && next.value === "in") {
        this.consume(); // not
        this.consume(); // in
        const right = this.parsePrimary(ctx);
        return !checkIn(left, right);
      }
    }

    if (this.matchOp("in")) {
      const right = this.parsePrimary(ctx);
      return checkIn(left, right);
    }

    if (
      tok.type === "OP" &&
      (tok.value === "==" ||
        tok.value === "!=" ||
        tok.value === ">" ||
        tok.value === "<" ||
        tok.value === ">=" ||
        tok.value === "<=")
    ) {
      const op = this.consume().value;
      const right = this.parsePrimary(ctx);
      switch (op) {
        case "==":
          return left === right;
        case "!=":
          return left !== right;
        case ">":
          return Number(left) > Number(right);
        case "<":
          return Number(left) < Number(right);
        case ">=":
          return Number(left) >= Number(right);
        case "<=":
          return Number(left) <= Number(right);
      }
    }

    return left;
  }

  private parsePrimary(ctx: ExprEvalContext): unknown {
    const tok = this.peek();

    if (tok.type === "LPAREN") {
      this.consume();
      const inner = this.parseOr(ctx);
      if (this.peek().type !== "RPAREN") {
        throw new Error("Expected closing ')' in expression");
      }
      this.consume();
      return inner;
    }

    if (tok.type === "LBRACK") {
      this.consume();
      const items: unknown[] = [];
      while (this.peek().type !== "RBRACK") {
        if (this.peek().type === "EOF") {
          throw new Error("Expected closing ']' in array literal");
        }
        items.push(this.parsePrimary(ctx));
        if (this.peek().type === "COMMA") {
          this.consume();
        } else {
          break;
        }
      }
      if (this.peek().type !== "RBRACK") {
        throw new Error("Expected closing ']' in array literal");
      }
      this.consume();
      return items;
    }

    if (tok.type === "STRING") {
      this.consume();
      return tok.value;
    }

    if (tok.type === "NUMBER") {
      this.consume();
      return Number(tok.value);
    }

    if (tok.type === "BOOL") {
      this.consume();
      return tok.value === "true";
    }

    if (tok.type === "IDENT") {
      const path: string[] = [this.consume().value];
      while (this.peek().type === "DOT") {
        this.consume();
        const next = this.peek();
        if (next.type !== "IDENT") {
          throw new Error(`Expected property name after '.'`);
        }
        path.push(this.consume().value);
      }
      return resolvePath(path, ctx);
    }

    throw new Error(`Unexpected token "${tok.value}" (${tok.type})`);
  }
}

function resolvePath(path: string[], ctx: ExprEvalContext): unknown {
  const [root, ...rest] = path;
  let current: unknown;

  if (root === "context") {
    current = ctx.context;
  } else if (root === "args") {
    current = ctx.args;
  } else if (root === "contacts") {
    current = ctx.contacts;
  } else {
    return undefined;
  }

  for (const segment of rest) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "string" || Array.isArray(current)) {
      if (segment === "length") {
        current = current.length;
        continue;
      }
    }
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return current;
}

function checkIn(needle: unknown, haystack: unknown): boolean {
  if (Array.isArray(haystack)) {
    return haystack.includes(needle);
  }
  if (typeof haystack === "string" && typeof needle === "string") {
    return haystack.includes(needle);
  }
  return false;
}

export function validateExpression(expr: string): void {
  const tokens = tokenize(expr);
  const dummyCtx: ExprEvalContext = {
    context: { tainted: false, origins: [] },
    args: {},
    contacts: [],
  };
  new Parser(tokens).parse(dummyCtx);
}

export function evaluateExpression(expr: string, ctx: ExprEvalContext): boolean {
  const tokens = tokenize(expr);
  return Boolean(new Parser(tokens).parse(ctx));
}
