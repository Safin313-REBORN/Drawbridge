import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DrawbridgeProvider } from "./context/DrawbridgeContext.js";
import { LabPage } from "./pages/LabPage.js";
import { LandingPage } from "./pages/LandingPage.js";
import { PolicyPage } from "./pages/PolicyPage.js";
import { TracePage } from "./pages/TracePage.js";

export function App() {
  return (
    <DrawbridgeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/trace" element={<TracePage />} />
          <Route path="/lab" element={<LabPage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DrawbridgeProvider>
  );
}
