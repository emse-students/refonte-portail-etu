import { describe, it, expect } from 'vitest';
import { GET } from '../../src/routes/api/calendar/+server';

// Mock request object as a minimal RequestEvent-like object for the handler
const mockRequest = {
  url: new URL('/api/calendar?start=2025-10-01&end=2025-10-31', 'http://localhost'),
  request: new Request('http://localhost/api/calendar?start=2025-10-01&end=2025-10-31', { method: 'GET' }),
  params: {},
  locals: {},
  cookies: {
    get: (_name: string) => undefined,
    getAll: () => [],
    set: () => {},
    delete: () => {},
  },
  fetch: globalThis.fetch?.bind(globalThis) ?? (() => Promise.reject(new Error('no fetch'))),
  getClientAddress: () => '127.0.0.1',
} as unknown as any;

describe('API /api/calendar', () => {
  it('should return events for a valid date range', async () => {
    const response = await GET(mockRequest);
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    // You can add more checks on the response format
  });
});
