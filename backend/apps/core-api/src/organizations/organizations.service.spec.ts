import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '@app/database';
import { EmailService } from '@app/common/modules/email/email.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
import { InvitationStatus, RequestStatus, Prisma } from '@prisma/client';
import { ethers } from 'ethers';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let httpService: jest.Mocked<HttpService>;
  let prismaService: jest.Mocked<PrismaService>;
  let emailService: jest.Mocked<EmailService>;
  let transactionService: jest.Mocked<TransactionsService>;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    };

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        const urls: Record<string, string> = {
          INDEXER_API_URL: 'http://indexer-api',
          LENS_MANAGER_URL: 'http://lens-manager',
          ROYALTY_MARKETPLACE_URL: 'http://dashboard',
          IPFS_SERVICE_URL: 'http://ipfs-service',
          BLOCKCHAIN_SERVICE_URL: 'http://blockchain-service',
        };
        return urls[key] || '';
      }),
    };

    const mockPrismaService = {
      organization: {
        findUnique: jest.fn().mockResolvedValue(null),
        findUniqueOrThrow: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue(null),
      },
      organizationMember: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(null),
      },
      organizationInvitation: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue(null),
      },
      organizationCreationRequest: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(null),
      },
      organizationFollow: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue(null),
      },
      organizationLink: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn((callback) => {
        // Create a transaction client that has the same structure
        const txClient = {
          organization: mockPrismaService.organization,
          organizationMember: mockPrismaService.organizationMember,
          organizationInvitation: mockPrismaService.organizationInvitation,
          organizationCreationRequest:
            mockPrismaService.organizationCreationRequest,
          organizationFollow: mockPrismaService.organizationFollow,
          organizationLink: mockPrismaService.organizationLink,
        };
        return callback(txClient);
      }),
    } as any;

    const mockEmailService = {
      sendOrganizationInvitation: jest.fn(),
    };

    const mockTransactionService = {
      indexTransaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    httpService = module.get(HttpService);
    prismaService = module.get(PrismaService);
    emailService = module.get(EmailService);
    transactionService = module.get(TransactionsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyOrganization', () => {
    const mockOrg = {
      id: 'org-123',
      name: 'Test Org',
      siteAddress: 'test-org',
      logoImage: 'QmYgrUFBSsrEqP7oqog8x4nRYxoRaFTN3FYWYphTpG4YWv',
      blurb: 'Test description',
      legalEntityType: 'LLC',
      country: 'US',
      primaryIndustry: 'Tech',
      isConfigured: true,
      createdAt: new Date(),
      _count: { followers: 10, following: 5 },
      principalUser: {
        firstName: 'John',
        lastName: 'Doe',
        profileImage: 'profile.jpg',
      },
      links: [],
    };

    it('should return organization profile', async () => {
      (prismaService.organization.findUnique as jest.Mock).mockResolvedValue(
        mockOrg as any,
      );

      const result = await service.getMyOrganization('org-123');

      expect(result).toHaveProperty('id', 'org-123');
      expect(result).toHaveProperty('name', 'Test Org');
      expect(result).toHaveProperty('followerCount', 10);
      expect(result).toHaveProperty(
        'logoImage',
        'QmYgrUFBSsrEqP7oqog8x4nRYxoRaFTN3FYWYphTpG4YWv',
      );
    });

    it('should return organization profile without logoImage', async () => {
      const mockOrgWithoutLogo = {
        ...mockOrg,
        logoImage: null,
      };
      (prismaService.organization.findUnique as jest.Mock).mockResolvedValue(
        mockOrgWithoutLogo as any,
      );

      const result = await service.getMyOrganization('org-123');

      expect(result).toHaveProperty('id', 'org-123');
      expect(result.logoImage).toBeNull();
    });

    it('should throw NotFoundException when organization not found', async () => {
      (prismaService.organization.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.getMyOrganization('org-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated organizations', async () => {
      const mockOrgs = [
        {
          id: 'org-1',
          name: 'Org 1',
          _count: { followers: 5, following: 2 },
          principalUser: null,
          links: [],
          createdAt: new Date(),
        },
      ];
      (prismaService.organization.findMany as jest.Mock).mockResolvedValue(
        mockOrgs as any,
      );

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result).toHaveLength(1);
      expect(prismaService.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('createRequest', () => {
    it('should create organization request successfully', async () => {
      (
        prismaService.organizationMember.findFirst as jest.Mock
      ).mockResolvedValue(null);
      (
        prismaService.organizationCreationRequest.findFirst as jest.Mock
      ).mockResolvedValue(null);
      (
        prismaService.organizationCreationRequest.create as jest.Mock
      ).mockResolvedValue({
        id: 'request-123',
      } as any);

      await service.createRequest('user-123', {
        requestedName: 'New Org',
        country: 'US',
        legalEntityType: 'LLC',
        primaryIndustry: 'Tech',
      });

      expect(
        prismaService.organizationCreationRequest.create,
      ).toHaveBeenCalled();
    });

    it('should throw ConflictException when user is already a member', async () => {
      (
        prismaService.organizationMember.findFirst as jest.Mock
      ).mockResolvedValue({
        id: 'member-123',
      } as any);

      await expect(
        service.createRequest('user-123', {
          requestedName: 'New Org',
          country: 'US',
          legalEntityType: 'LLC',
          primaryIndustry: 'Tech',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when pending request exists', async () => {
      (
        prismaService.organizationMember.findFirst as jest.Mock
      ).mockResolvedValue(null);
      (
        prismaService.organizationCreationRequest.findFirst as jest.Mock
      ).mockResolvedValue({
        id: 'request-123',
        status: RequestStatus.PENDING,
      } as any);

      await expect(
        service.createRequest('user-123', {
          requestedName: 'New Org',
          country: 'US',
          legalEntityType: 'LLC',
          primaryIndustry: 'Tech',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createInvitation', () => {
    const mockOrg = {
      id: 'org-123',
      name: 'Test Org',
    };

    it('should create invitation successfully', async () => {
      (prismaService.organization.findUnique as jest.Mock).mockResolvedValue(
        mockOrg as any,
      );
      (
        prismaService.organizationMember.findFirst as jest.Mock
      ).mockResolvedValue(null);
      (
        prismaService.organizationInvitation.findFirst as jest.Mock
      ).mockResolvedValue(null);
      (
        prismaService.organizationInvitation.create as jest.Mock
      ).mockResolvedValue({
        id: 'invitation-123',
        organizationId: 'org-123',
      } as any);
      emailService.sendOrganizationInvitation.mockResolvedValue(undefined);

      await service.createInvitation('org-123', {
        email: 'test@example.com',
        role: 'MEMBER' as any,
      });

      expect(prismaService.organizationInvitation.create).toHaveBeenCalled();
      expect(emailService.sendOrganizationInvitation).toHaveBeenCalled();
    });

    it('should throw NotFoundException when organization not found', async () => {
      (prismaService.organization.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.createInvitation('org-123', {
          email: 'test@example.com',
          role: 'MEMBER' as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user is already a member', async () => {
      (prismaService.organization.findUnique as jest.Mock).mockResolvedValue(
        mockOrg as any,
      );
      (
        prismaService.organizationMember.findFirst as jest.Mock
      ).mockResolvedValue({
        id: 'member-123',
      } as any);

      await expect(
        service.createInvitation('org-123', {
          email: 'test@example.com',
          role: 'MEMBER' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when pending invitation exists', async () => {
      (prismaService.organization.findUnique as jest.Mock).mockResolvedValue(
        mockOrg as any,
      );
      (
        prismaService.organizationMember.findFirst as jest.Mock
      ).mockResolvedValue(null);
      (
        prismaService.organizationInvitation.findFirst as jest.Mock
      ).mockResolvedValue({
        id: 'invitation-123',
        status: InvitationStatus.PENDING,
      } as any);

      await expect(
        service.createInvitation('org-123', {
          email: 'test@example.com',
          role: 'MEMBER' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateMyOrganizationLogo', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'logo',
      originalname: 'logo.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 4,
      destination: '',
      filename: '',
      path: '/tmp/logo.jpg',
      stream: null as any,
    };

    it('should update organization logo successfully', async () => {
      // Mock the first call to create pin record in indexer
      httpService.post.mockReturnValueOnce(
        of({ data: { ids: ['pin-123'] } }) as any,
      );
      // Mock the second call to ipfs-service
      httpService.post.mockReturnValueOnce(
        of({ data: { jobId: 'job-123' } }) as any,
      );

      const result = await service.updateMyOrganizationLogo(
        'org-123',
        mockFile,
      );

      expect(result).toEqual({ jobId: 'job-123', status: 'QUEUED' });
      expect(httpService.post).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(
        service.updateMyOrganizationLogo('org-123', null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when IPFS service fails', async () => {
      // Mock the first call to create pin record in indexer
      httpService.post.mockReturnValueOnce(
        of({ data: { ids: ['pin-123'] } }) as any,
      );
      // Mock the second call to ipfs-service to fail
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.post.mockReturnValueOnce(throwError(() => axiosError) as any);

      await expect(
        service.updateMyOrganizationLogo('org-123', mockFile),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('follow', () => {
    it('should create follow relationship successfully', async () => {
      (prismaService.organizationFollow.create as jest.Mock).mockResolvedValue({
        id: 'follow-123',
      } as any);

      await service.follow('follower-org', 'following-org');

      expect(prismaService.organizationFollow.create).toHaveBeenCalledWith({
        data: {
          followerOrgId: 'follower-org',
          followingOrgId: 'following-org',
        },
      });
    });

    it('should throw ConflictException when trying to follow self', async () => {
      await expect(service.follow('org-123', 'org-123')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when already following', async () => {
      // Create a mock error that matches Prisma.PrismaClientKnownRequestError
      class MockPrismaError extends Error {
        code = 'P2002';
        meta = {};
        clientVersion = 'test';
      }
      const error = new MockPrismaError('Unique constraint violation');
      // Make it pass the instanceof check
      Object.setPrototypeOf(
        error,
        Prisma.PrismaClientKnownRequestError.prototype,
      );

      (prismaService.organizationFollow.create as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(
        service.follow('follower-org', 'following-org'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('unfollow', () => {
    it('should delete follow relationship successfully', async () => {
      (prismaService.organizationFollow.delete as jest.Mock).mockResolvedValue({
        id: 'follow-123',
      } as any);

      await service.unfollow('follower-org', 'following-org');

      expect(prismaService.organizationFollow.delete).toHaveBeenCalledWith({
        where: {
          followerOrgId_followingOrgId: {
            followerOrgId: 'follower-org',
            followingOrgId: 'following-org',
          },
        },
      });
    });
  });

  describe('getMyOrganizationEarnings', () => {
    it('should return earnings successfully', async () => {
      const mockOrg = {
        id: 'org-123',
        contractAddress: '0x123',
      };
      const mockEarnings = {
        pendingEarnings: ethers.parseUnits('1000', 6).toString(),
      };
      (
        prismaService.organization.findUniqueOrThrow as jest.Mock
      ).mockResolvedValue(mockOrg as any);
      httpService.get.mockReturnValue(of({ data: mockEarnings }) as any);

      const result = await service.getMyOrganizationEarnings('org-123');

      expect(result).toHaveProperty('pendingEarnings');
      expect(result).toHaveProperty('formattedPendingEarnings');
      expect(result.formattedPendingEarnings).toBe('1000.0');
    });

    it('should return zero earnings when no contract address', async () => {
      const mockOrg = {
        id: 'org-123',
        contractAddress: null,
      };
      (
        prismaService.organization.findUniqueOrThrow as jest.Mock
      ).mockResolvedValue(mockOrg as any);

      const result = await service.getMyOrganizationEarnings('org-123');

      expect(result.pendingEarnings).toBe('0');
      expect(result.formattedPendingEarnings).toBe('0.00');
    });

    it('should throw InternalServerErrorException when blockchain service fails', async () => {
      const mockOrg = {
        id: 'org-123',
        contractAddress: '0x123',
      };
      (
        prismaService.organization.findUniqueOrThrow as jest.Mock
      ).mockResolvedValue(mockOrg as any);
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(
        service.getMyOrganizationEarnings('org-123'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('initiateEarningsWithdrawal', () => {
    it('should initiate withdrawal successfully', async () => {
      transactionService.indexTransaction.mockResolvedValue(undefined);
      httpService.post.mockReturnValue(
        of({ data: { jobId: 'job-123' } }) as any,
      );

      const result = await service.initiateEarningsWithdrawal(
        'org-123',
        'user-123',
      );

      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('txId');
      expect(transactionService.indexTransaction).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when blockchain service fails', async () => {
      transactionService.indexTransaction.mockResolvedValue(undefined);
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.post.mockReturnValue(throwError(() => axiosError) as any);

      await expect(
        service.initiateEarningsWithdrawal('org-123', 'user-123'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateMyOrganization', () => {
    const mockOrg = {
      id: 'org-123',
      name: 'Test Org',
      siteAddress: 'test-org',
      logoImage: 'QmYgrUFBSsrEqP7oqog8x4nRYxoRaFTN3FYWYphTpG4YWv',
      blurb: 'Test description',
      legalEntityType: 'LLC',
      country: 'US',
      primaryIndustry: 'Tech',
      isConfigured: true,
      createdAt: new Date(),
      _count: { followers: 10, following: 5 },
      principalUser: null,
      links: [],
    };

    it('should update organization profile and preserve logoImage', async () => {
      const updatedOrg = {
        ...mockOrg,
        name: 'Updated Org',
        blurb: 'Updated description',
      };

      // Mock the transaction to return the updated org
      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const txClient = {
            organization: {
              update: jest.fn().mockResolvedValue(updatedOrg as any),
              findUnique: jest.fn().mockResolvedValue(updatedOrg as any),
            },
            organizationLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
              createMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
          };
          return await callback(txClient);
        },
      );

      const result = await service.updateMyOrganization('org-123', {
        name: 'Updated Org',
        blurb: 'Updated description',
      });

      expect(result).toHaveProperty('name', 'Updated Org');
      expect(result).toHaveProperty('blurb', 'Updated description');
      // logoImage should be preserved
      expect(result).toHaveProperty(
        'logoImage',
        'QmYgrUFBSsrEqP7oqog8x4nRYxoRaFTN3FYWYphTpG4YWv',
      );
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should update organization profile without logoImage', async () => {
      const orgWithoutLogo = {
        ...mockOrg,
        logoImage: null,
        name: 'Updated Org',
      };

      // Mock the transaction to return the updated org
      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const txClient = {
            organization: {
              update: jest.fn().mockResolvedValue(orgWithoutLogo as any),
              findUnique: jest.fn().mockResolvedValue(orgWithoutLogo as any),
            },
            organizationLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
              createMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
          };
          return await callback(txClient);
        },
      );

      const result = await service.updateMyOrganization('org-123', {
        name: 'Updated Org',
      });

      expect(result).toHaveProperty('name', 'Updated Org');
      expect(result.logoImage).toBeNull();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });
});
