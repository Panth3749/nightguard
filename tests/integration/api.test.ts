import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../apps/api/src/app';

describe('NightGuard REST API Integration Tests', () => {
  let authToken = '';
  let networkId = '';

  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/networks');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects registration with invalid email or weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'weak',
      name: 'Tester',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('successfully registers a new administrator account and returns default network', async () => {
    const uniqueEmail = `admin_test_${Date.now()}@nightguard.test`;
    const res = await request(app).post('/api/auth/register').send({
      name: 'Integration Test Admin',
      email: uniqueEmail,
      password: 'SecurePassword123!',
      timezone: 'UTC',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.defaultNetworkId).toBeDefined();

    authToken = res.body.data.token;
    networkId = res.body.data.defaultNetworkId;
  });

  it('allows access to protected routes with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/networks')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.networks)).toBe(true);
  });

  it('pairs a router and returns pairingToken and installCommand', async () => {
    const res = await request(app)
      .post('/api/routers/pair')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        networkId,
        adapterType: 'SIMULATOR',
        isSimulated: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pairingToken).toBeDefined();
    expect(res.body.data.installCommand).toContain('sh <(curl');
  });

  it('retrieves discovered devices for the network', async () => {
    const res = await request(app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ networkId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.devices.length).toBeGreaterThan(0);
  });

  it('checks system health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('NightGuard Cloud API');
  });
});
