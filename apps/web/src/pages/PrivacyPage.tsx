import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.js";

export function PrivacyPage() {
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
      <main className="wrap" style={{ paddingTop: 64, paddingBottom: 96, maxWidth: 820 }}>
        <div className="chip" style={{ marginBottom: 20 }}>
          <span className="lab">Privacy Policy</span>
        </div>
        <h1 className="disp" style={{ fontSize: 56 }}>
          Runs locally. Collects nothing.
        </h1>
        <div className="card" style={{ padding: 28, marginTop: 28 }}>
          <p style={{ marginTop: 0 }}>
            Drawbridge is an open-source demo and developer tool built for
            GenHacks 2026.
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li style={{ marginBottom: 10 }}>
              <strong>No accounts or tracking:</strong> This web app does not
              create user accounts, set tracking cookies, or collect personal
              data.
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong>In-browser execution:</strong> The demo inbox, trace
              viewer, Attack Lab, and YAML policy dry-run execute locally in
              your browser using synthetic <code>*.example</code> fixture data.
            </li>
            <li>
              <strong>Optional LLM provider:</strong> If you configure an
              optional API key in a local Node environment, requests are sent
              only to your chosen provider. No keys are stored in the frontend.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
