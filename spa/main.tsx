import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PassMachine } from "@/components/pass-machine";
import "@/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PassMachine />
  </StrictMode>,
);
