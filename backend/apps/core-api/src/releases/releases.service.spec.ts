import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PrismaService } from '@app/database';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
import { VerificationStatus } from '@app/common';

describe('ReleasesService', () => {
  let service: ReleasesService;
  let httpService: jest.Mocked<HttpService>;
  let transactionService: jest.Mocked<TransactionsService>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'IPFS_SERVICE_URL') {
          return 'http://ipfs-service';
        }
        if (key === 'BLOCKCHAIN_SERVICE_URL') {
          return 'http://blockchain-service';
        }
        if (key === 'INDEXER_API_URL') {
          return 'http://indexer-api';
        }
        if (key === 'LENS_MANAGER_URL') {
          return 'http://lens-manager';
        }
        return '';
      }),
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'HTTP_TIMEOUT') {
          return defaultValue ?? 100000;
        }
        return defaultValue;
      }),
    };

    const mockTransactionService = {
      indexTransaction: jest.fn(),
    };

    const mockPrismaService = {
      organization: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReleasesService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReleasesService>(ReleasesService);
    httpService = module.get(HttpService);
    transactionService = module.get(TransactionsService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllReleases', () => {
    const mockReleases = {
      releases: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    };

    it('should return paginated releases', async () => {
      httpService.get.mockReturnValue(of({ data: mockReleases }) as any);

      const result = await service.findAllReleases({ page: 1, pageSize: 20 });

      expect(result).toEqual(mockReleases);
      expect(httpService.get).toHaveBeenCalledWith(
        'http://indexer-api/releases',
        { params: { page: 1, pageSize: 20 } },
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(
        service.findAllReleases({ page: 1, pageSize: 20 }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOneRelease', () => {
    const mockRelease = {
      id: 'release-123',
      name: 'Test Release',
      description: 'Test Description',
    };

    it('should return release by ID', async () => {
      httpService.get.mockReturnValue(of({ data: mockRelease }) as any);

      const result = await service.findOneRelease('release-123');

      expect(result).toEqual(mockRelease);
      expect(httpService.get).toHaveBeenCalledWith(
        'http://indexer-api/releases/release-123',
      );
    });

    it('should throw NotFoundException when release not found', async () => {
      const axiosError = {
        response: { status: 404 },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(service.findOneRelease('release-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on other errors', async () => {
      const axiosError = {
        response: { status: 500, data: { error: 'Server error' } },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(service.findOneRelease('release-123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('initiateAssetOnChainLicense', () => {
    const mockJwtPayload = {
      sub: 'user-123',
      peerId: 'peer-123',
    };
    const mockRelease = {
      id: 'release-123',
      siteAddress: 'site-123',
      onChainAssetId: 'asset-123',
      price: '10.00',
      verificationStatus: VerificationStatus.VERIFIED,
      postedBy: 'creator-peer-123',
    };
    const mockFees = {
      integratorFee: '100',
      EmpressaFee: '200',
    };

    it('should initiate license purchase successfully', async () => {
      httpService.get
        .mockReturnValueOnce(of({ data: mockRelease }) as any)
        .mockReturnValueOnce(of({ data: mockFees }) as any);
      httpService.post.mockReturnValue(
        of({ data: { jobId: 'job-123' } }) as any,
      );
      transactionService.indexTransaction.mockResolvedValue(undefined);

      const result = await service.initiateAssetOnChainLicense(
        'release-123',
        mockJwtPayload as any,
        'attempt-1',
      );

      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('txId');
      expect(transactionService.indexTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when asset is not verified', async () => {
      const unverifiedRelease = {
        ...mockRelease,
        verificationStatus: VerificationStatus.UNVERIFIED,
      };
      httpService.get.mockReturnValue(of({ data: unverifiedRelease }) as any);

      await expect(
        service.initiateAssetOnChainLicense(
          'release-123',
          mockJwtPayload as any,
          'attempt-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when onChainAssetId is missing', async () => {
      const releaseWithoutAssetId = {
        ...mockRelease,
        onChainAssetId: null,
      };
      httpService.get.mockReturnValue(
        of({ data: releaseWithoutAssetId }) as any,
      );

      await expect(
        service.initiateAssetOnChainLicense(
          'release-123',
          mockJwtPayload as any,
          'attempt-1',
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw BadRequestException when price is missing', async () => {
      const releaseWithoutPrice = {
        ...mockRelease,
        price: null,
      };
      httpService.get.mockReturnValue(of({ data: releaseWithoutPrice }) as any);
      httpService.get.mockReturnValueOnce(of({ data: mockFees }) as any);

      await expect(
        service.initiateAssetOnChainLicense(
          'release-123',
          mockJwtPayload as any,
          'attempt-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when blockchain service fails', async () => {
      httpService.get
        .mockReturnValueOnce(of({ data: mockRelease }) as any)
        .mockReturnValueOnce(of({ data: mockFees }) as any);
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.post.mockReturnValue(throwError(() => axiosError) as any);
      transactionService.indexTransaction.mockResolvedValue(undefined);

      await expect(
        service.initiateAssetOnChainLicense(
          'release-123',
          mockJwtPayload as any,
          'attempt-1',
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('checkAssetHash', () => {
    it('should return hash existence check', async () => {
      httpService.get.mockReturnValue(of({ data: { exists: true } }) as any);

      const result = await service.checkAssetHash('hash-123');

      expect(result).toEqual({ exists: true });
      expect(httpService.get).toHaveBeenCalledWith(
        'http://blockchain-service/rpc/assets/check-hash/hash-123',
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(service.checkAssetHash('hash-123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('createRelease', () => {
    it('should create release successfully', async () => {
      httpService.post.mockReturnValue(of({ data: {} }) as any);

      const result = await service.createRelease('site-123', 'peer-123', {
        id: 'release-123',
        name: 'Test',
      } as any);

      expect(result).toEqual({ releaseId: 'release-123' });
      expect(httpService.post).toHaveBeenCalledWith(
        'http://lens-manager/sites/site-123/releases',
        expect.objectContaining({
          id: 'release-123',
          siteAddress: 'site-123',
          postedBy: 'peer-123',
        }),
        { timeout: 100000 },
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.post.mockReturnValue(throwError(() => axiosError) as any);

      await expect(
        service.createRelease('site-123', 'peer-123', {
          id: 'release-123',
        } as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateRelease', () => {
    it('should update release successfully', async () => {
      httpService.patch.mockReturnValue(of({ data: {} }) as any);

      await service.updateRelease('site-123', 'release-123', {
        name: 'Updated Name',
      } as any);

      expect(httpService.patch).toHaveBeenCalledWith(
        'http://lens-manager/sites/site-123/releases/release-123',
        { name: 'Updated Name' },
        { timeout: 100000 },
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.patch.mockReturnValue(throwError(() => axiosError) as any);

      await expect(
        service.updateRelease('site-123', 'release-123', {} as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('removeRelease', () => {
    it('should delete release successfully', async () => {
      httpService.delete.mockReturnValue(of({ data: {} }) as any);

      await service.removeRelease('site-123', 'release-123');

      expect(httpService.delete).toHaveBeenCalledWith(
        'http://lens-manager/sites/site-123/releases/release-123',
        { timeout: 100000 },
      );
    });

    it('should throw InternalServerErrorException when request fails', async () => {
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.delete.mockReturnValue(throwError(() => axiosError) as any);

      await expect(
        service.removeRelease('site-123', 'release-123'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('initiateAssetOnChainCreation', () => {
    const mockIpfsPayload = {
      releaseId: 'release-123',
      userId: 'user-123',
      actorPeerId: 'peer-123',
    };
    const mockIpfsResult = {
      contentCID: 'QmContent123',
      thumbnailManifestCID: 'QmThumbnail123',
      assetHash: '0xhash123',
    };
    const mockIndexedRelease = {
      id: 'release-123',
      name: 'Test Release',
      description: 'Test Description',
      siteAddress: 'site-123',
      price: '10.00',
      isEncrypted: false,
      tags: ['tag1'],
      createdAt: new Date().toISOString(),
    };
    const mockOrganization = {
      id: 'org-123',
      contractAddress: '0xContractAddress123',
    };

    it('should initiate asset creation successfully when organization has contract address', async () => {
      httpService.get.mockReturnValue(of({ data: mockIndexedRelease }) as any);
      (prismaService.organization.findFirst as jest.Mock).mockResolvedValue(
        mockOrganization,
      );
      transactionService.indexTransaction.mockResolvedValue(undefined);
      httpService.post.mockReturnValue(
        of({ data: { jobId: 'job-123' } }) as any,
      );

      await service.initiateAssetOnChainCreation(
        mockIpfsPayload as any,
        mockIpfsResult as any,
      );

      expect(prismaService.organization.findFirst).toHaveBeenCalledWith({
        where: { siteAddress: mockIndexedRelease.siteAddress },
        select: { contractAddress: true, id: true },
      });
      expect(transactionService.indexTransaction).toHaveBeenCalled();
      expect(httpService.post).toHaveBeenCalled();
    });

    it('should throw NotFoundException when organization is not found', async () => {
      httpService.get.mockReturnValue(of({ data: mockIndexedRelease }) as any);
      (prismaService.organization.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.initiateAssetOnChainCreation(
          mockIpfsPayload as any,
          mockIpfsResult as any,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.organization.findFirst).toHaveBeenCalledWith({
        where: { siteAddress: mockIndexedRelease.siteAddress },
        select: { contractAddress: true, id: true },
      });
      expect(transactionService.indexTransaction).not.toHaveBeenCalled();
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when organization has no contract address', async () => {
      httpService.get.mockReturnValue(of({ data: mockIndexedRelease }) as any);
      (prismaService.organization.findFirst as jest.Mock).mockResolvedValue({
        id: 'org-123',
        contractAddress: null,
      });

      await expect(
        service.initiateAssetOnChainCreation(
          mockIpfsPayload as any,
          mockIpfsResult as any,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prismaService.organization.findFirst).toHaveBeenCalledWith({
        where: { siteAddress: mockIndexedRelease.siteAddress },
        select: { contractAddress: true, id: true },
      });
      expect(transactionService.indexTransaction).not.toHaveBeenCalled();
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when indexer API fails', async () => {
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(
        service.initiateAssetOnChainCreation(
          mockIpfsPayload as any,
          mockIpfsResult as any,
        ),
      ).rejects.toThrow(InternalServerErrorException);

      expect(prismaService.organization.findFirst).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when blockchain service fails', async () => {
      httpService.get.mockReturnValue(of({ data: mockIndexedRelease }) as any);
      (prismaService.organization.findFirst as jest.Mock).mockResolvedValue(
        mockOrganization,
      );
      transactionService.indexTransaction.mockResolvedValue(undefined);
      const axiosError = {
        response: { data: { error: 'Failed' } },
      } as AxiosError;
      httpService.post.mockReturnValue(throwError(() => axiosError) as any);

      await expect(
        service.initiateAssetOnChainCreation(
          mockIpfsPayload as any,
          mockIpfsResult as any,
        ),
      ).rejects.toThrow(InternalServerErrorException);

      expect(transactionService.indexTransaction).toHaveBeenCalled();
    });
  });
});
