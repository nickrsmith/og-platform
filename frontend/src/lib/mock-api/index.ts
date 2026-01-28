/**
 * Mock API System for Beta Testing
 * Provides comprehensive mock data for all API endpoints when backend is unavailable
 */

// Default to true for development - set VITE_USE_MOCK_API=false to use real API
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false' && 
                            import.meta.env.VITE_USE_MOCK_API !== '0';

// Simulate network delay for realistic testing
const MOCK_DELAY = import.meta.env.VITE_MOCK_API_DELAY 
  ? parseInt(import.meta.env.VITE_MOCK_API_DELAY) 
  : 300; // Default 300ms delay

export function delay(ms: number = MOCK_DELAY): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function mockResponse<T>(data: T, status: number = 200): Promise<T> {
  return delay().then(() => {
    if (status >= 400) {
      const error: any = new Error(data as any);
      error.status = status;
      throw error;
    }
    return data;
  });
}

export function mockError(message: string, status: number = 500): Promise<never> {
  return delay().then(() => {
    const error: any = new Error(message);
    error.status = status;
    throw error;
  });
}

// Export mock API modules
export * from './auth';
export * from './assets';
export * from './data-rooms';
export * from './enverus';
export * from './division-orders';

