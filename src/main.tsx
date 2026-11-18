import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { BranchProvider } from "./context/BranchContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <BranchProvider>
        <App />
      </BranchProvider>
    </BrowserRouter>
  </StrictMode>,
);
