import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { DrawbridgeProvider } from "./context/DrawbridgeContext.js";
import { LabPage } from "./pages/LabPage.js";
import { LandingPage } from "./pages/LandingPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import { PolicyPage } from "./pages/PolicyPage.js";
import { PrivacyPage } from "./pages/PrivacyPage.js";
import { TermsPage } from "./pages/TermsPage.js";
import { TracePage } from "./pages/TracePage.js";

export function App() {
  return (
    <ErrorBoundary>
      <DrawbridgeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/trace" element={<TracePage />} />
            <Route path="/lab" element={<LabPage />} />
            <Route path="/policy" element={<PolicyPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </DrawbridgeProvider>
    </ErrorBoundary>
  );
}
