import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.js";
import { usePageMeta } from "../components/SiteWidgets.js";

export function CookiePolicyPage() {
  usePageMeta(
    "Cookie Policy — Drawbridge",
    "Drawbridge uses zero tracking cookies and stores only local UI preferences."
  );
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
          <span className="lab">Cookie Policy</span>
        </div>
        <h1 className="disp" style={{ fontSize: 56 }}>
          Zero tracking cookies.
        </h1>
        <div className="card" style={{ padding: 28, marginTop: 28 }}>
          <p style={{ marginTop: 0 }}>
            Drawbridge does not set advertising, analytics, or cross-site tracking cookies.
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li style={{ marginBottom: 10 }}>
              <strong><code>drawbridge_theme</code> (localStorage):</strong> Remembers your Light/Dark mode choice.
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong><code>drawbridge_cookie_ack</code> (localStorage):</strong> Remembers that you dismissed the storage notice.
            </li>
            <li>
              <strong>Data deletion:</strong> Clear your browser site data at any time to remove these keys, or email{" "}
              <a href="mailto:251-15-858@diu.edu.bd" style={{ textDecoration: "underline" }}>
                251-15-858@diu.edu.bd
              </a>.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
