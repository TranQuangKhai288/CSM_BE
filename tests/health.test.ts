import request from 'supertest';
import App from '../src/app';

describe('Health Check', () => {
  let app: App;

  beforeAll(() => {
    app = new App();
  });

  it('should return 200 OK for health check', async () => {
    const response = await request(app.app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  it('should return service statuses', async () => {
    const response = await request(app.app).get('/health');

    expect(response.body).toHaveProperty('services');
    expect(response.body.services).toHaveProperty('database');
    expect(response.body.services).toHaveProperty('redis');
  });
});
