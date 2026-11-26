import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ATTACK_PAYLOADS } from "@drawbridge/attacks";

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description);
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute(
        "href",
        `https://drawbridge-three.vercel.app${window.location.pathname}`
      );
    }
  }, [title, description]);
}

export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a href={`#${targetId}`} className="skip-link">
      Skip to content
    </a>
  );
}

export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      setPct(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <div className="scroll-progress-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="btn btn-s back-to-top"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      &uarr; Top
    </button>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-s"
      style={{ minHeight: 40, padding: "6px 12px", fontSize: 13 }}
      onClick={handleCopy}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

export function CookieBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("drawbridge_cookie_ack") === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const accept = () => {
    try {
      localStorage.setItem("drawbridge_cookie_ack", "1");
    } catch {
      // ignore storage errors
    }
    setDismissed(true);
  };

  return (
    <aside className="cookie-banner" aria-label="Cookie and storage notice">
      <span style={{ fontSize: 14 }}>
        Drawbridge uses local storage only for your theme and policy preferences.
        No tracking cookies.
      </span>
      <button type="button" className="btn btn-p" style={{ minHeight: 44 }} onClick={accept}>
        Got it
      </button>
    </aside>
  );
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-card">
        <h2 id="confirm-title" className="disp" style={{ fontSize: 36 }}>
          {title}
        </h2>
        <p style={{ margin: "12px 0 24px", color: "var(--fg-muted)" }}>{message}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-s" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-p" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FloatingContactButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (message.trim().length < 5) {
      setError("Please enter a message (at least 5 characters).");
      return;
    }
    if (!consent) {
      setError("Please confirm the consent and age (13+) checkbox.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-p floating-contact"
        onClick={() => {
          setSubmitted(false);
          setError("");
          setOpen(true);
        }}
        aria-label="Open contact form"
      >
        Contact
      </button>

      {open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="contact-title">
          <div className="modal-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h2 id="contact-title" className="disp" style={{ fontSize: 36 }}>
                Send feedback
              </h2>
              <button
                type="button"
                className="btn btn-s"
                style={{ minHeight: 40, padding: "6px 12px" }}
                onClick={() => setOpen(false)}
                aria-label="Close contact form"
              >
                Close
              </button>
            </div>

            {submitted ? (
              <div
                role="status"
                style={{
                  marginTop: 18,
                  padding: 16,
                  background: "var(--tclr)",
                  color: "var(--clrt)",
                  border: "2px solid var(--clrt)",
                }}
              >
                <strong>Message recorded locally.</strong> Thanks for testing Drawbridge!
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }} noValidate>
                {error && (
                  <div
                    role="alert"
                    style={{
                      padding: 12,
                      background: "var(--tsig)",
                      color: "var(--sigt)",
                      border: "2px solid var(--sig)",
                      fontSize: 14,
                    }}
                  >
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="contact-email" className="lab" style={{ display: "block", marginBottom: 6 }}>
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    className="field-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.example"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="contact-msg" className="lab" style={{ display: "block", marginBottom: 6 }}>
                    Message
                  </label>
                  <textarea
                    id="contact-msg"
                    className="field-input"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share feedback or a payload idea..."
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      style={{ width: 20, height: 20, marginTop: 2 }}
                    />
                    <span>
                      I consent to local-only form processing and confirm I am 13 years of age or older.
                    </span>
                  </label>
                </div>
                <button type="submit" className="btn btn-p">
                  Send message
                </button>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--stone)" }}>
                  Or email{" "}
                  <a href="mailto:security@drawbridge.example" style={{ textDecoration: "underline" }}>
                    security@drawbridge.example
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const SEARCH_ITEMS = [
  { title: "Landing — Overview", path: "/" },
  { title: "Live Trace — Step-by-step lineage", path: "/trace" },
  { title: "Attack Lab — 40 payloads & calibration", path: "/lab" },
  { title: "Policy Editor — YAML rules & dry-run", path: "/policy" },
  { title: "Privacy Policy", path: "/privacy" },
  { title: "Terms of Use", path: "/terms" },
  ...ATTACK_PAYLOADS.slice(0, 8).map((p) => ({
    title: `${p.id}: ${p.category} (${p.hiddenIn})`,
    path: "/lab",
  })),
];

export function SiteSearch() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const matches = query.trim()
    ? SEARCH_ITEMS.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="site-search">
      <label htmlFor="site-search-input" className="sr-only">
        Search Drawbridge
      </label>
      <input
        id="site-search-input"
        type="search"
        className="field-input"
        style={{ minHeight: 44, padding: "6px 12px", fontSize: 14, width: 180 }}
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.length > 0 && (
        <ul className="search-results" role="listbox" aria-label="Search results">
          {matches.map((m, idx) => (
            <li key={`${m.path}-${idx}`}>
              <button
                type="button"
                className="search-item"
                onClick={() => {
                  setQuery("");
                  navigate(m.path);
                }}
              >
                {m.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
