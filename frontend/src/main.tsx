import { createRoot } from "react-dom/client";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Check Buffer is available
if (typeof window !== 'undefined' && !window.Buffer) {
  console.error('❌ Buffer not available! HTML script may have failed.');
}

// ⭐ PRIORITY 3: Validate Web Crypto API availability (required for Web3Auth)
if (typeof window !== 'undefined') {
  if (!window.crypto?.subtle) {
    console.error('❌ Web Crypto API not available! Web3Auth requires HTTPS.');
    console.error('Current protocol:', window.location.protocol);
    console.error('Current hostname:', window.location.hostname);
    console.warn('⚠️ Web3Auth will not work without Web Crypto API. Please use HTTPS.');
  } else {
    console.log('✅ Web Crypto API is available');
  }
  
  // Global error handler for Web3Auth crypto errors
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error?.message?.includes('digest') || 
        error?.message?.includes('crypto') || 
        error?.message?.includes('Web3Auth')) {
      console.error('❌ ========== Web3Auth CRYPTO ERROR DETECTED ==========');
      console.error('This is likely a Web3Auth crypto polyfill issue');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('===========================================');
      // Don't prevent default - let it log but continue
      // This helps us see the error in console for debugging
    }
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Make sure index.html has a <div id='root'></div>");
}

// Dynamic import with error handling to catch module errors
async function loadApp() {
  try {
    console.log('📦 Loading App component...');
    const { default: App } = await import("./App");
    console.log('✅ App component loaded');
    
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
    console.log('✅ React rendered successfully');
  } catch (error) {
    console.error("❌ Failed to load app:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: system-ui; background: #f8d7da; border: 2px solid #dc3545; border-radius: 8px;">
        <h1 style="color: #721c24; margin-top: 0;">❌ Failed to Load Application</h1>
        <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
        <p><strong>Stack:</strong></p>
        <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow: auto; font-size: 12px;">${error instanceof Error ? error.stack : 'No stack trace'}</pre>
        <p style="margin-top: 20px;">Check the browser console (F12) for more details.</p>
      </div>
    `;
  }
}

loadApp();
