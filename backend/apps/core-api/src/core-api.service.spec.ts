import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InternalServerErrorException } from '@nestjs/common';
import { CoreApiService } from './core-api.service';
import { PrismaService } from '@app/database';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
import { ethers } from 'ethers';

describe('CoreApiService', () => {
  let service: CoreApiService;
  let httpService: jest.Mocked<HttpService>;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheManager: jest.Mocked<any>;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
    };

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'BLOCKCHAIN_SERVICE_URL') {
          return 'http://blockchain-service';
        }
        return '';
      }),
    };

    const mockPrismaService = {
      organization: {
        findUnique: jest.fn(),
      },
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreApiService,
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
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CoreApiService>(CoreApiService);
    httpService = module.get(HttpService);
    prismaService = module.get(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlatformFees', () => {
    const defaultFees = {
      integratorFee: '100',
      EmpressaFee: '200',
    };

    it('should return cached fees when available', async () => {
      const cachedFees = { integratorFee: '50', EmpressaFee: '150' };
      cacheManager.get.mockResolvedValue(cachedFees);

      const result = await service.getPlatformFees();

      expect(result).toEqual(cachedFees);
      expect(cacheManager.get).toHaveBeenCalledWith('platform-fees:default');
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should fetch and cache default fees when no cache exists', async () => {
      cacheManager.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(of({ data: defaultFees }) as any);

      const result = await service.getPlatformFees();

      expect(result).toEqual(defaultFees);
      expect(httpService.get).toHaveBeenCalledWith(
        'http://blockchain-service/rpc/factory/fees',
      );
      expect(cacheManager.set).toHaveBeenCalledWith(
        'platform-fees:default',
        defaultFees,
        3600,
      );
    });

    it('should use organization-specific cache key when organizationId is provided', async () => {
      const orgId = 'org-123';
      cacheManager.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(of({ data: defaultFees }) as any);
      prismaService.organization.findUnique.mockResolvedValue(null);

      await service.getPlatformFees(orgId);

      expect(cacheManager.get).toHaveBeenCalledWith(`platform-fees:${orgId}`);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `platform-fees:${orgId}`,
        expect.any(Object),
        3600,
      );
    });

    it('should override integrator fee to 0 when organization has no integration partner', async () => {
      const orgId = 'org-123';
      const contractAddress = '0x123';
      cacheManager.get.mockResolvedValue(null);
      httpService.get
        .mockReturnValueOnce(of({ data: defaultFees }) as any)
        .mockReturnValueOnce(
          of({
            data: { integrationPartner: ethers.ZeroAddress },
          }) as any,
        );
      prismaService.organization.findUnique.mockResolvedValue({
        id: orgId,
        contractAddress,
      } as any);

      const result = await service.getPlatformFees(orgId);

      expect(result.integratorFee).toBe('0');
      expect(result.EmpressaFee).toBe(defaultFees.EmpressaFee);
      expect(httpService.get).toHaveBeenCalledTimes(2);
    });

    it('should not override integrator fee when organization has integration partner', async () => {
      const orgId = 'org-123';
      const contractAddress = '0x123';
      const integrationPartner = '0x456';
      cacheManager.get.mockResolvedValue(null);
      httpService.get
        .mockReturnValueOnce(of({ data: defaultFees }) as any)
        .mockReturnValueOnce(
          of({
            data: { integrationPartner },
          }) as any,
        );
      prismaService.organization.findUnique.mockResolvedValue({
        id: orgId,
        contractAddress,
      } as any);

      const result = await service.getPlatformFees(orgId);

      expect(result.integratorFee).toBe(defaultFees.integratorFee);
      expect(result.EmpressaFee).toBe(defaultFees.EmpressaFee);
    });

    it('should throw InternalServerErrorException when blockchain service fails', async () => {
      cacheManager.get.mockResolvedValue(null);
      const axiosError = {
        response: { data: { error: 'Service unavailable' } },
      } as AxiosError;
      httpService.get.mockReturnValue(throwError(() => axiosError) as any);

      await expect(service.getPlatformFees()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle organization without contract address', async () => {
      const orgId = 'org-123';
      cacheManager.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(of({ data: defaultFees }) as any);
      prismaService.organization.findUnique.mockResolvedValue({
        id: orgId,
        contractAddress: null,
      } as any);

      const result = await service.getPlatformFees(orgId);

      expect(result).toEqual(defaultFees);
      expect(httpService.get).toHaveBeenCalledTimes(1);
    });
  });
});
