// Buffer polyfill module - ensures Buffer is available globally
// This file must be imported FIRST before any code that uses Buffer
import { Buffer as BufferImpl } from 'buffer';

// Make Buffer available globally immediately
const g = typeof globalThis !== 'undefined' ? globalThis : 
          typeof window !== 'undefined' ? window : 
          typeof global !== 'undefined' ? global : {};

(g as any).Buffer = BufferImpl;
if (typeof window !== 'undefined') {
  (window as any).Buffer = BufferImpl;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = BufferImpl;
}

// Export for module usage
export const Buffer = BufferImpl;
export default BufferImpl;

