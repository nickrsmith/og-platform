import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CoreApiController } from './core-api.controller';
import { CoreApiService } from './core-api.service';
import { PrismaService } from '@app/database';

describe('CoreApiController', () => {
  let coreApiController: CoreApiController;

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
      del: jest.fn(),
    };

    const mockAmqpConnection = {
      managedConnection: {
        isConnected: jest.fn().mockReturnValue(true),
      },
    };

    const mockPrismaServiceWithQuery = {
      ...mockPrismaService,
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [CoreApiController],
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
          useValue: mockPrismaServiceWithQuery,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: AmqpConnection,
          useValue: mockAmqpConnection,
        },
      ],
    }).compile();

    coreApiController = app.get<CoreApiController>(CoreApiController);
  });

  describe('health', () => {
    it('should return health status', async () => {
      const result = await coreApiController.health();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('service', 'core-api');
      expect(result).toHaveProperty('checks');
    });
  });
});
