import React, { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { CookieBanner, FloatingContactButton, SkipLink } from "./components/SiteWidgets.js";
import { DrawbridgeProvider } from "./context/DrawbridgeContext.js";
import { LandingPage } from "./pages/LandingPage.js";

const TracePage = lazy(() =>
  import("./pages/TracePage.js").then((m) => ({ default: m.TracePage }))
);
const LabPage = lazy(() =>
  import("./pages/LabPage.js").then((m) => ({ default: m.LabPage }))
);
const PolicyPage = lazy(() =>
  import("./pages/PolicyPage.js").then((m) => ({ default: m.PolicyPage }))
);
const PrivacyPage = lazy(() =>
  import("./pages/PrivacyPage.js").then((m) => ({ default: m.PrivacyPage }))
);
const TermsPage = lazy(() =>
  import("./pages/TermsPage.js").then((m) => ({ default: m.TermsPage }))
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage.js").then((m) => ({ default: m.NotFoundPage }))
);

export function App() {
  return (
    <ErrorBoundary>
      <DrawbridgeProvider>
        <BrowserRouter>
          <SkipLink />
          <Suspense
            fallback={
              <main id="main-content" className="wrap" style={{ paddingTop: 64 }}>
                <div className="lab">Loading view...</div>
                <div className="loading-bar" style={{ marginTop: 10, maxWidth: 280 }}>
                  <div className="loading-bar-inner" />
                </div>
              </main>
            }
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/trace" element={<TracePage />} />
              <Route path="/lab" element={<LabPage />} />
              <Route path="/policy" element={<PolicyPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          <CookieBanner />
          <FloatingContactButton />
        </BrowserRouter>
      </DrawbridgeProvider>
    </ErrorBoundary>
  );
}
