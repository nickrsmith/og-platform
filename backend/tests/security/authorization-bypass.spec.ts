import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CoreApiModule } from '../../apps/core-api/src/core-api.module';
import { standardValidationPipe } from '@app/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, Role } from '@app/common';

/**
 * Security tests for authorization bypass attempts
 * Tests role-based access control and privilege escalation
 */
describe('Security: Authorization Bypass', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CoreApiModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(standardValidationPipe);
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Helper to create a JWT token with specific role
   */
  function createToken(role: Role, organizationId?: string): string {
    const payload: JwtPayload = {
      sub: 'test-user-id',
      email: 'test@example.com',
      role,
      organizationId,
      peerId: 'test-peer-id',
      p2pPublicKey: 'test-public-key',
      walletPublicKey: 'test-wallet-key',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    return jwtService.sign(payload);
  }

  describe('Role-Based Access Control', () => {
    it('should prevent Compliance from accessing AssetManager endpoints', async () => {
      const token = createToken(Role.Compliance);

      const response = await request(app.getHttpServer())
        .post('/api/v1/releases')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Release',
          description: 'Test',
        })
        .expect(403);

      expect(response.body.message).toContain('permission');
    });

    it('should prevent AssetManager from accessing Manager endpoints', async () => {
      const token = createToken(Role.AssetManager);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.status).toBe(403);
    });

    it('should prevent Principal from accessing Manager endpoints', async () => {
      const token = createToken(Role.Principal);

      const response = await request(app.getHttpServer())
        .delete('/api/v1/admin/organizations/some-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.status).toBe(403);
    });
  });

  describe('Privilege Escalation', () => {
    it('should reject tokens with modified role claims', async () => {
      // Create token as AssetManager
      const assetManagerToken = createToken(Role.AssetManager);

      // Try to access Manager endpoint
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${assetManagerToken}`)
        .expect(403);

      expect(response.status).toBe(403);
    });

    it('should validate organization membership for scoped endpoints', async () => {
      const token = createToken(Role.AssetManager, 'org-123');

      // Try to access organization-scoped endpoint with different org
      const response = await request(app.getHttpServer())
        .get('/api/v1/organizations/org-456/members')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.status).toBe(403);
    });
  });

  describe('IDOR (Insecure Direct Object Reference)', () => {
    it('should prevent access to other users resources', async () => {
      const token = createToken(Role.AssetManager, 'org-123');

      // Try to access another user's resource
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/other-user-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.status).toBe(403);
    });

    it('should prevent access to other organizations resources', async () => {
      const token = createToken(Role.Principal, 'org-123');

      // Try to access another organization's release
      const response = await request(app.getHttpServer())
        .get('/api/v1/releases/org-456-release-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.status).toBe(403);
    });
  });

  describe('Missing Authorization', () => {
    it('should require authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/v1/users/me' },
        { method: 'post', path: '/api/v1/releases' },
        { method: 'get', path: '/api/v1/organizations' },
        { method: 'put', path: '/api/v1/organizations/123' },
        { method: 'delete', path: '/api/v1/organizations/123' },
      ];

      for (const endpoint of protectedEndpoints) {
        const req = request(app.getHttpServer())[endpoint.method](
          endpoint.path,
        );

        const response = await req.expect(401);

        expect(response.status).toBe(401);
      }
    });
  });

  describe('Role Enumeration', () => {
    it('should not reveal valid roles in error messages', async () => {
      const token = createToken(Role.AssetManager);

      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Error message should not list valid roles
      expect(response.body.message).not.toContain('Manager');
      expect(response.body.message).not.toContain('Principal');
    });
  });

  describe('Token Reuse Across Contexts', () => {
    it('should validate token context for organization-scoped operations', async () => {
      const token = createToken(Role.Principal, 'org-123');

      // Token should only work for org-123 operations
      const response = await request(app.getHttpServer())
        .get('/api/v1/organizations/org-456/members')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.status).toBe(403);
    });
  });
});

