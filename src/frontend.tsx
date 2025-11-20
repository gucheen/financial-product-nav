/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { render } from "preact";
import { App } from "./App";

const elem = document.getElementById("root")!;
const app = (
  <App />
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  render(app, import.meta.hot.data.root ?? elem);
} else {
  // The hot module reloading API is not available in production.
  render(app, elem);
}
