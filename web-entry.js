// Placeholder web entry.
//
// The real product is the native Expo app in artifacts/tammen-app.
// This file (and the root index.html) exist only so the build service's
// hardcoded `vite build` web step can resolve an entry and succeed, so the
// pipeline can proceed to its native packaging step. It is not the app.
const root = document.getElementById("root");
if (root) {
  root.textContent = "Ana Bekhair";
}
