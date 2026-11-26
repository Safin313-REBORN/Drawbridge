import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.js";

export function NotFoundPage() {
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
        <div style={{ display: "flex", gap: 12 }}>
          <Link className="btn btn-s" to="/trace" style={{ minHeight: 48 }}>
            Live trace
          </Link>
          <Link className="btn btn-s" to="/lab" style={{ minHeight: 48 }}>
            Attack lab
          </Link>
        </div>
      </header>
      <main
        id="main-content"
        className="wrap"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 64,
          paddingBottom: 64,
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 560,
            width: "100%",
            padding: 36,
            boxShadow: "var(--shadow-md)",
          }}
        >
          <span className="bdg no">404 &middot; Route not found</span>
          <h1 className="disp" style={{ fontSize: 64, marginTop: 16 }}>
            This gate does not exist.
          </h1>
          <p style={{ margin: "16px 0 28px", color: "var(--stone)" }}>
            The page you requested could not be found. Return to the landing
            page or open one of the Drawbridge tools below.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link className="btn btn-p" to="/">
              Back to home
            </Link>
            <Link className="btn btn-s" to="/trace">
              Open live trace
            </Link>
            <Link className="btn btn-s" to="/policy">
              Policy editor
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
