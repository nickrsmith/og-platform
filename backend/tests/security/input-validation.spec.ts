import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CoreApiModule } from '../../apps/core-api/src/core-api.module';
import { standardValidationPipe } from '@app/common';

/**
 * Security tests for input validation
 * Tests that the system properly validates and sanitizes all inputs
 */
describe('Security: Input Validation', () => {
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

  describe('Type Validation', () => {
    it('should reject invalid types in request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({
          requestedName: 12345, // Should be string
          country: 'US',
          legalEntityType: 'LLC',
          primaryIndustry: 'Energy',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should reject wrong data types for numeric fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users?page=not-a-number')
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should reject boolean values where strings expected', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({
          requestedName: true,
          country: 'US',
          legalEntityType: 'LLC',
          primaryIndustry: 'Energy',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('Required Field Validation', () => {
    it('should reject requests with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({
          // Missing requestedName
          country: 'US',
          legalEntityType: 'LLC',
          primaryIndustry: 'Energy',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should reject empty required string fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({
          requestedName: '',
          country: 'US',
          legalEntityType: 'LLC',
          primaryIndustry: 'Energy',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('Length Validation', () => {
    it('should reject strings exceeding maximum length', async () => {
      const longString = 'a'.repeat(10000);

      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({
          requestedName: longString,
          country: 'US',
          legalEntityType: 'LLC',
          primaryIndustry: 'Energy',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should reject arrays exceeding maximum length', async () => {
      const largeArray = Array(10000).fill('item');

      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({
          requestedName: 'Test',
          country: 'US',
          legalEntityType: 'LLC',
          primaryIndustry: 'Energy',
          links: largeArray,
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('Format Validation', () => {
    it('should validate email format', async () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user@domain',
        'user..name@example.com',
      ];

      for (const email of invalidEmails) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/organizations/invitations')
          .send({
            email,
            role: 'AssetManager',
          })
          .expect(400);

        expect(response.status).toBe(400);
      }
    });

    it('should validate UUID format', async () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123',
        '123e4567-e89b-12d3-a456-426614174000-invalid',
        '',
      ];

      for (const uuid of invalidUUIDs) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/organizations/${uuid}`)
          .expect(400);

        expect(response.status).toBe(400);
      }
    });

    it('should validate URL format', async () => {
      const invalidURLs = [
        'not-a-url',
        'http://',
        'ftp://invalid',
        'javascript:alert(1)',
      ];

      for (const url of invalidURLs) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/organizations')
          .send({
            requestedName: 'Test',
            country: 'US',
            legalEntityType: 'LLC',
            primaryIndustry: 'Energy',
            links: [{ type: 'website', url }],
          })
          .expect(400);

        expect(response.status).toBe(400);
      }
    });
  });

  describe('Enum Validation', () => {
    it('should reject invalid enum values', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations/invitations')
        .send({
          email: 'test@example.com',
          role: 'InvalidRole', // Not a valid Role enum value
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('Whitelist Validation', () => {
    it('should reject extra properties not in DTO', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({
          requestedName: 'Test',
          country: 'US',
          legalEntityType: 'LLC',
          primaryIndustry: 'Energy',
          maliciousField: 'should be rejected',
          anotherBadField: 123,
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('Nested Object Validation', () => {
    it('should validate nested objects', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({
          requestedName: 'Test',
          country: 'US',
          legalEntityType: 'LLC',
          primaryIndustry: 'Energy',
          links: [
            {
              type: 'website',
              url: 'not-a-valid-url', // Invalid URL
            },
          ],
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('Array Validation', () => {
    it('should reject non-array values where arrays expected', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({
          requestedName: 'Test',
          country: 'US',
          legalEntityType: 'LLC',
          primaryIndustry: 'Energy',
          links: 'not-an-array',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should validate array element types', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({
          requestedName: 'Test',
          country: 'US',
          legalEntityType: 'LLC',
          primaryIndustry: 'Energy',
          links: [123, 456], // Should be objects
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('Special Characters', () => {
    it('should handle special characters safely', async () => {
      const specialChars = [
        '\x00',
        '\n',
        '\r',
        '\t',
        '\u0000',
        String.fromCharCode(0),
      ];

      for (const char of specialChars) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/organizations')
          .send({
            requestedName: `Test${char}Name`,
            country: 'US',
            legalEntityType: 'LLC',
            primaryIndustry: 'Energy',
          })
          .expect(400);

        expect(response.status).toBe(400);
      }
    });
  });
});

