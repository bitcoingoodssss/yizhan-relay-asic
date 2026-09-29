import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RelayDesk } from "./components/relay/desk";
import "./styles.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <RelayDesk />
    </StrictMode>,
  );
}
