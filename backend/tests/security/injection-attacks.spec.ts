import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { CoreApiModule } from '../../apps/core-api/src/core-api.module';
import { standardValidationPipe } from '@app/common';

/**
 * Security tests for injection attacks
 * Tests SQL injection, XSS, command injection, and other injection vectors
 */
describe('Security: Injection Attacks', () => {
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

  describe('SQL Injection', () => {
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "' OR '1'='1' --",
      "' OR '1'='1' /*",
      "1' OR '1'='1",
      "admin'--",
      "admin'/*",
      "' UNION SELECT NULL--",
      "1; DROP TABLE users--",
      "' OR 1=1--",
      "1' AND '1'='1",
    ];

    it('should reject SQL injection in query parameters', async () => {
      for (const payload of sqlInjectionPayloads) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/users?email=${encodeURIComponent(payload)}`)
          .expect(400);

        // Should be rejected by validation, not processed
        expect(response.status).toBe(400);
      }
    });

    it('should reject SQL injection in path parameters', async () => {
      for (const payload of sqlInjectionPayloads) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/users/${encodeURIComponent(payload)}`)
          .expect(400);

        expect(response.status).toBe(400);
      }
    });

    it('should reject SQL injection in request body', async () => {
      for (const payload of sqlInjectionPayloads) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/organizations')
          .send({
            requestedName: payload,
            country: 'US',
            legalEntityType: 'LLC',
            primaryIndustry: 'Energy',
          })
          .expect(400);

        expect(response.status).toBe(400);
      }
    });
  });

  describe('XSS (Cross-Site Scripting)', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
      '<select onfocus=alert("XSS") autofocus>',
      '<textarea onfocus=alert("XSS") autofocus>',
      '<keygen onfocus=alert("XSS") autofocus>',
      '<video><source onerror="alert(\'XSS\')">',
      '<audio src=x onerror=alert("XSS")>',
    ];

    it('should sanitize XSS payloads in string fields', async () => {
      for (const payload of xssPayloads) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/organizations')
          .send({
            requestedName: payload,
            country: 'US',
            legalEntityType: 'LLC',
            primaryIndustry: 'Energy',
          })
          .expect(400);

        // Should be rejected by validation
        expect(response.status).toBe(400);
      }
    });

    it('should sanitize XSS in URL parameters', async () => {
      for (const payload of xssPayloads) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/users?search=${encodeURIComponent(payload)}`)
          .expect(400);

        expect(response.status).toBe(400);
      }
    });
  });

  describe('Command Injection', () => {
    const commandInjectionPayloads = [
      '; ls',
      '| ls',
      '&& ls',
      '|| ls',
      '`ls`',
      '$(ls)',
      '; cat /etc/passwd',
      '| cat /etc/passwd',
      '&& cat /etc/passwd',
      '; rm -rf /',
      '| rm -rf /',
    ];

    it('should reject command injection in input fields', async () => {
      for (const payload of commandInjectionPayloads) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/organizations')
          .send({
            requestedName: payload,
            country: 'US',
            legalEntityType: 'LLC',
            primaryIndustry: 'Energy',
          })
          .expect(400);

        expect(response.status).toBe(400);
      }
    });

    it('should reject command injection in file paths', async () => {
      for (const payload of commandInjectionPayloads) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/ipfs/upload')
          .send({
            path: payload,
          })
          .expect(400);

        expect(response.status).toBe(400);
      }
    });
  });

  describe('NoSQL Injection', () => {
    const nosqlPayloads = [
      { $ne: null },
      { $gt: '' },
      { $regex: '.*' },
      { $where: 'this.password == this.username' },
      { $or: [{ username: 'admin' }, { password: 'admin' }] },
    ];

    it('should reject NoSQL injection in request body', async () => {
      for (const payload of nosqlPayloads) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(payload)
          .expect(400);

        expect(response.status).toBe(400);
      }
    });
  });

  describe('LDAP Injection', () => {
    const ldapPayloads = [
      '*',
      ')(&',
      '*)(&',
      '*))%00',
      'admin)(&(password=*',
      'admin)(|(password=*',
    ];

    it('should reject LDAP injection in search queries', async () => {
      for (const payload of ldapPayloads) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/users?search=${encodeURIComponent(payload)}`)
          .expect(400);

        expect(response.status).toBe(400);
      }
    });
  });

  describe('Path Traversal', () => {
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%2f..%2f..%2fetc%2fpasswd',
    ];

    it('should reject path traversal in file paths', async () => {
      for (const payload of pathTraversalPayloads) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/ipfs/upload')
          .send({
            path: payload,
          })
          .expect(400);

        expect(response.status).toBe(400);
      }
    });

    it('should reject path traversal in URL paths', async () => {
      for (const payload of pathTraversalPayloads) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/files/${encodeURIComponent(payload)}`)
          .expect(404);

        // Should return 404, not process the path
        expect(response.status).toBe(404);
      }
    });
  });
});

