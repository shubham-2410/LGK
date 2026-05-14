import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.addEventListener("dblclick", (e) => {
  const el = e.target as HTMLElement;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    (el as HTMLInputElement | HTMLTextAreaElement).select();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
