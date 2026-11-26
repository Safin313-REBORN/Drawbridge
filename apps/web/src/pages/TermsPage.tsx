import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.js";
import { usePageMeta } from "../components/SiteWidgets.js";

export function TermsPage() {
  usePageMeta("Terms of Use — Drawbridge", "Drawbridge open-source MIT license terms and threat model notice.");
  return (
    <div className="app">
      <header className="top">
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
          aria-label="Drawbridge home"
        >
          <BrandLogo size={30} />
          <span className="disp" style={{ fontSize: 26 }}>
            Drawbridge
          </span>
        </Link>
        <Link className="btn btn-s" to="/" style={{ minHeight: 48 }}>
          Back to home
        </Link>
      </header>
      <main id="main-content" className="wrap" style={{ paddingTop: 64, paddingBottom: 96, maxWidth: 820 }}>
        <div className="chip" style={{ marginBottom: 20 }}>
          <span className="lab">Terms of Use</span>
        </div>
        <h1 className="disp" style={{ fontSize: 56 }}>
          Open-source software, as-is.
        </h1>
        <div className="card" style={{ padding: 28, marginTop: 28 }}>
          <p style={{ marginTop: 0 }}>
            Drawbridge is released as open-source software under the MIT
            License.
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li style={{ marginBottom: 10 }}>
              <strong>Risk reduction, not immunity:</strong> Drawbridge reduces
              prompt-injection risk via taint tracking and deterministic policy
              rules, and does not make AI agents immune to all attacks.
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong>Defensive test payloads:</strong> Attack Lab payloads are
              defensive test strings targeting fictional{" "}
              <code>*.example</code> domains only.
            </li>
            <li>
              <strong>No warranty:</strong> The software is provided "as is",
              without warranty of any kind.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
