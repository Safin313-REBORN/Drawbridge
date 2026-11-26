import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.js";
import { usePageMeta } from "../components/SiteWidgets.js";

export function RefundPage() {
  usePageMeta(
    "Refund Policy — Drawbridge",
    "Drawbridge is free, open-source MIT software with no paid plans or hidden fees."
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
          <span className="lab">Refund Policy</span>
        </div>
        <h1 className="disp" style={{ fontSize: 56 }}>
          Free and open source.
        </h1>
        <div className="card" style={{ padding: 28, marginTop: 28 }}>
          <p style={{ margin: 0 }}>
            Drawbridge is free, open-source software licensed under MIT. There are no paid tiers, subscriptions, billing, or hidden fees, so no charges or refunds apply.
          </p>
        </div>
      </main>
    </div>
  );
}
