// Temporary test file to verify React is working
import { createRoot } from "react-dom/client";

console.log("Test: main-test.tsx loaded");
console.log("Test: React createRoot available:", typeof createRoot);

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Test: Root element not found!");
  document.body.innerHTML = '<div style="padding: 20px; color: red;">ERROR: Root element not found!</div>';
} else {
  console.log("Test: Root element found");
  try {
    const root = createRoot(rootElement);
    root.render(
      <div style={{ padding: "20px", fontFamily: "system-ui" }}>
        <h1 style={{ color: "green" }}>✅ React is Working!</h1>
        <p>If you see this, React and Vite are working correctly.</p>
        <p>Check the browser console (F12) for test messages.</p>
      </div>
    );
    console.log("Test: React render successful");
  } catch (error) {
    console.error("Test: React render failed:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h1>React Render Error</h1>
        <p>${error instanceof Error ? error.message : String(error)}</p>
      </div>
    `;
  }
}

