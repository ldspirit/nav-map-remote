const { test, expect, request } = require('@playwright/test');
const { spawn } = require('child_process');

let server;

async function waitForHealth(baseURL) {
  const req = await request.newContext({ baseURL });
  for (let i = 0; i < 20; i++) {
    const res = await req.get('/health');
    if (res.ok()) return;
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('API did not become healthy');
}

test.beforeAll(async () => {
  server = spawn('node', ['apps/api/src/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: '4001', MOCK_DB: '1' },
    stdio: 'inherit'
  });
  await waitForHealth('http://localhost:4001');
});

test.afterAll(async () => {
  if (server) server.kill();
});

test('POST /auth/register - happy path', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const res = await api.post('/api/v1/auth/register', {
    data: {
      email: 'a@example.com',
      phone: '+234801234567',
      full_name: 'Test User',
      device_region: 'NG',
      coordinates: { lat: 6.5244, lng: 3.3792 }
    }
  });
  expect(res.status()).toBe(201);
  const json = await res.json();
  expect(json.user_id).toBeTruthy();
  expect(json.debug_otp).toBeTruthy();
});

test('POST /auth/register - duplicate user', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  await api.post('/api/v1/auth/register', {
    data: {
      email: 'dup@example.com',
      phone: '+234801234568',
      full_name: 'Test User',
      device_region: 'NG',
      coordinates: { lat: 6.5244, lng: 3.3792 }
    }
  });
  const res = await api.post('/api/v1/auth/register', {
    data: {
      email: 'dup@example.com',
      phone: '+234801234568',
      full_name: 'Test User',
      device_region: 'NG',
      coordinates: { lat: 6.5244, lng: 3.3792 }
    }
  });
  expect(res.status()).toBe(409);
});

test('POST /auth/register - invalid input', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const res = await api.post('/api/v1/auth/register', { data: { email: 'bad' } });
  expect(res.status()).toBe(400);
});

test('POST /auth/register - unsupported country', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const res = await api.post('/api/v1/auth/register', {
    data: {
      email: 'x@example.com',
      phone: '+111',
      full_name: 'Test',
      device_region: 'US',
      coordinates: { lat: 0, lng: 0 }
    }
  });
  expect(res.status()).toBe(400);
});

test('POST /auth/verify-phone - valid OTP', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const reg = await api.post('/api/v1/auth/register', {
    data: {
      email: 'v@example.com',
      phone: '+234801000000',
      full_name: 'Test',
      device_region: 'NG',
      coordinates: { lat: 6.5244, lng: 3.3792 }
    }
  });
  const regJson = await reg.json();
  const res = await api.post('/api/v1/auth/verify-phone', {
    data: { user_id: regJson.user_id, otp_code: regJson.debug_otp }
  });
  expect(res.status()).toBe(200);
});

test('POST /auth/verify-phone - wrong code', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const reg = await api.post('/api/v1/auth/register', {
    data: {
      email: 'w@example.com',
      phone: '+234801000001',
      full_name: 'Test',
      device_region: 'NG',
      coordinates: { lat: 6.5244, lng: 3.3792 }
    }
  });
  const regJson = await reg.json();
  const res = await api.post('/api/v1/auth/verify-phone', {
    data: { user_id: regJson.user_id, otp_code: '000000' }
  });
  expect(res.status()).toBe(401);
});

test('POST /auth/verify-phone - user not found', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const res = await api.post('/api/v1/auth/verify-phone', {
    data: { user_id: '11111111-1111-1111-1111-111111111111', otp_code: '123456' }
  });
  expect(res.status()).toBe(404);
});

test('POST /addresses/create - new street generation', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const reg = await api.post('/api/v1/auth/register', {
    data: {
      email: 'a1@example.com',
      phone: '+234801111111',
      full_name: 'Test',
      device_region: 'NG',
      coordinates: { lat: 6.0, lng: 3.0 }
    }
  });
  const { user_id } = await reg.json();
  const res = await api.post('/api/v1/addresses/create', {
    data: { user_id, coordinates: { lat: 6.0, lng: 3.0 } }
  });
  expect(res.status()).toBe(201);
});

test('POST /addresses/create - nearby street attach', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const reg = await api.post('/api/v1/auth/register', {
    data: {
      email: 'a2@example.com',
      phone: '+234801111112',
      full_name: 'Test',
      device_region: 'NG',
      coordinates: { lat: 6.1, lng: 3.1 }
    }
  });
  const { user_id } = await reg.json();
  await api.post('/api/v1/addresses/create', {
    data: { user_id, coordinates: { lat: 6.1, lng: 3.1 } }
  });
  const res = await api.post('/api/v1/addresses/create', {
    data: { user_id, coordinates: { lat: 6.1003, lng: 3.1003 } }
  });
  expect(res.status()).toBe(201);
});

test('POST /addresses/create - P-system GPS match', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const reg = await api.post('/api/v1/auth/register', {
    data: {
      email: 'a3@example.com',
      phone: '+234801111113',
      full_name: 'Test',
      device_region: 'NG',
      coordinates: { lat: 6.2, lng: 3.2 }
    }
  });
  const { user_id } = await reg.json();
  await api.post('/api/v1/addresses/create', {
    data: { user_id, coordinates: { lat: 6.2, lng: 3.2 } }
  });
  const res = await api.post('/api/v1/addresses/create', {
    data: { user_id, coordinates: { lat: 6.200001, lng: 3.200001 } }
  });
  expect(res.status()).toBe(201);
});

test('GET /addresses/search - results found', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const reg = await api.post('/api/v1/auth/register', {
    data: {
      email: 's1@example.com',
      phone: '+234801222222',
      full_name: 'Test',
      device_region: 'NG',
      coordinates: { lat: 6.4, lng: 3.4 }
    }
  });
  const { user_id } = await reg.json();
  const created = await api.post('/api/v1/addresses/create', {
    data: { user_id, coordinates: { lat: 6.4, lng: 3.4 } }
  });
  const createdJson = await created.json();
  const street = createdJson.components.street_name.split(' ')[0];
  const res = await api.get(`/api/v1/addresses/search?q=${street}`);
  expect(res.status()).toBe(200);
});

test('GET /addresses/search - empty results', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const res = await api.get('/api/v1/addresses/search?q=Nope');
  const json = await res.json();
  expect(json.results.length).toBe(0);
});

test('GET /addresses/search - country filter', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const res = await api.get('/api/v1/addresses/search?q=Hope&country=NG');
  expect(res.status()).toBe(200);
});

test('GET /addresses/:id - found and not found', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:4001' });
  const reg = await api.post('/api/v1/auth/register', {
    data: {
      email: 'a4@example.com',
      phone: '+234801111114',
      full_name: 'Test',
      device_region: 'NG',
      coordinates: { lat: 6.3, lng: 3.3 }
    }
  });
  const { user_id } = await reg.json();
  const created = await api.post('/api/v1/addresses/create', {
    data: { user_id, coordinates: { lat: 6.3, lng: 3.3 } }
  });
  const { address_id } = await created.json();
  const found = await api.get(`/api/v1/addresses/${address_id}`);
  expect(found.status()).toBe(200);
  const notFound = await api.get('/api/v1/addresses/11111111-1111-1111-1111-111111111111');
  expect(notFound.status()).toBe(404);
});
