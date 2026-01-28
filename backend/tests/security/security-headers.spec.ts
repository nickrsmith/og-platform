import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CoreApiModule } from '../../apps/core-api/src/core-api.module';
import { standardValidationPipe } from '@app/common';

/**
 * Security tests for security headers
 * Tests that appropriate security headers are set on responses
 */
describe('Security: Security Headers', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CoreApiModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(standardValidationPipe);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('X-Frame-Options', () => {
    it('should set X-Frame-Options header to prevent clickjacking', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
    });
  });

  describe('X-Content-Type-Options', () => {
    it('should set X-Content-Type-Options to prevent MIME sniffing', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('X-XSS-Protection', () => {
    it('should set X-XSS-Protection header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('Referrer-Policy', () => {
    it('should set Referrer-Policy header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['referrer-policy']).toBe(
        'strict-origin-when-cross-origin',
      );
    });
  });

  describe('Content-Security-Policy', () => {
    it('should set Content-Security-Policy header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['content-security-policy']).toBeDefined();
      expect(
        response.headers['content-security-policy'],
      ).toContain("default-src 'self'");
    });
  });
});

