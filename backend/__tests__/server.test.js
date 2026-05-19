import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

describe('GET /api/health', () => {
  it('responds with status 200 and { status: "ok" }', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('responds with JSON content-type', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('Unknown routes', () => {
  it('returns 404 for unknown API routes when no frontend build exists', async () => {
    const response = await request(app).get('/api/unknown-route');
    expect(response.status).toBe(404);
  });
});
