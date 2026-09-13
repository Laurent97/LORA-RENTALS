// LORA accessibility helpers (T5P17)

export function announce(message: string, priority: "polite" | "assertive" = "polite") {
  if (typeof document === "undefined") return;
  let live = document.getElementById(`aria-live-${priority}`);
  if (!live) {
    live = document.createElement("div");
    live.id = `aria-live-${priority}`;
    live.setAttribute("aria-live", priority);
    live.setAttribute("aria-atomic", "true");
    live.className = "sr-only";
    document.body.appendChild(live);
  }
  live.textContent = "";
  setTimeout(() => {
    live!.textContent = message;
  }, 100);
}
