import { Test, TestingModule } from '@nestjs/testing';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EventPublisherService } from './event-publisher.service';
import {
  ChainEventType,
  ChainTransactionStatus,
  BlockchainJobStatus,
} from '@app/common';
import { BlockchainJob } from '@prisma/client';

describe('EventPublisherService', () => {
  let service: EventPublisherService;
  let amqpConnection: jest.Mocked<AmqpConnection>;

  beforeEach(async () => {
    const mockAmqpConnection = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventPublisherService,
        {
          provide: AmqpConnection,
          useValue: mockAmqpConnection,
        },
      ],
    }).compile();

    service = module.get<EventPublisherService>(EventPublisherService);
    amqpConnection = module.get(AmqpConnection);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publishTransactionFinalized', () => {
    const mockJob: BlockchainJob = {
      id: 'job-id-123',
      idempotencyKey: 'idempotency-key-123',
      eventType: ChainEventType.CREATE_ORG_CONTRACT,
      status: BlockchainJobStatus.SUCCESS,
      payloadJson: { organizationId: 'org-123' },
      errorMessage: null,
      retryCount: 0,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      finalizedAt: new Date('2024-01-01T01:00:00Z'),
    };

    it('should publish confirmed transaction event', () => {
      // Arrange
      const eventData = {
        txId: 'tx-id-123',
        txHash:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: '12345',
        job: mockJob,
        finalStatus: ChainTransactionStatus.CONFIRMED as
          | ChainTransactionStatus.CONFIRMED
          | ChainTransactionStatus.FAILED,
        eventOutput: { organizationAddress: '0xORG123' },
      };

      // Act
      service.publishTransactionFinalized(eventData);

      // Assert
      expect(amqpConnection.publish as jest.Mock).toHaveBeenCalledWith(
        'Empressa.events.topic',
        'transactions.finalized.confirmed',
        {
          id: eventData.txId,
          jobId: mockJob.id,
          eventType: mockJob.eventType,
          finalStatus: ChainTransactionStatus.CONFIRMED,
          txHash: eventData.txHash,
          blockNumber: eventData.blockNumber,
          submittedAt: mockJob.createdAt.toISOString(),
          finalizedAt: mockJob.finalizedAt!.toISOString(),
          originalPayload: mockJob.payloadJson,
          error: mockJob.errorMessage,
          eventOutput: eventData.eventOutput,
        },
        {
          persistent: true,
          contentType: 'application/json',
        },
      );
    });

    it('should publish failed transaction event', () => {
      // Arrange
      const failedJob: BlockchainJob = {
        ...mockJob,
        status: BlockchainJobStatus.ERROR,
        errorMessage: 'Transaction reverted',
      };

      const eventData = {
        txId: 'tx-id-456',
        txHash:
          '0xfailed1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: '12346',
        job: failedJob,
        finalStatus: ChainTransactionStatus.FAILED as
          | ChainTransactionStatus.CONFIRMED
          | ChainTransactionStatus.FAILED,
        eventOutput: undefined,
      };

      // Act
      service.publishTransactionFinalized(eventData);

      // Assert
      expect(amqpConnection.publish as jest.Mock).toHaveBeenCalledWith(
        'Empressa.events.topic',
        'transactions.finalized.failed',
        {
          id: eventData.txId,
          jobId: failedJob.id,
          eventType: failedJob.eventType,
          finalStatus: ChainTransactionStatus.FAILED,
          txHash: eventData.txHash,
          blockNumber: eventData.blockNumber,
          submittedAt: failedJob.createdAt.toISOString(),
          finalizedAt: failedJob.finalizedAt!.toISOString(),
          originalPayload: failedJob.payloadJson,
          error: failedJob.errorMessage,
          eventOutput: undefined,
        },
        {
          persistent: true,
          contentType: 'application/json',
        },
      );
    });

    it('should publish event without eventOutput when not provided', () => {
      // Arrange
      const eventData = {
        txId: 'tx-id-789',
        txHash:
          '0xnooutput1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: '12347',
        job: mockJob,
        finalStatus: ChainTransactionStatus.CONFIRMED as
          | ChainTransactionStatus.CONFIRMED
          | ChainTransactionStatus.FAILED,
      };

      // Act
      service.publishTransactionFinalized(eventData);

      // Assert
      expect(amqpConnection.publish as jest.Mock).toHaveBeenCalledWith(
        'Empressa.events.topic',
        'transactions.finalized.confirmed',
        expect.objectContaining({
          id: eventData.txId,
          jobId: mockJob.id,
          eventOutput: undefined,
        }),
        {
          persistent: true,
          contentType: 'application/json',
        },
      );
    });

    it('should use correct routing key for confirmed status', () => {
      // Arrange
      const eventData = {
        txId: 'tx-id-confirmed',
        txHash:
          '0xconfirmed1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: '12348',
        job: mockJob,
        finalStatus: ChainTransactionStatus.CONFIRMED as
          | ChainTransactionStatus.CONFIRMED
          | ChainTransactionStatus.FAILED,
      };

      // Act
      service.publishTransactionFinalized(eventData);

      // Assert
      expect(amqpConnection.publish as jest.Mock).toHaveBeenCalledWith(
        'Empressa.events.topic',
        'transactions.finalized.confirmed',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should use correct routing key for failed status', () => {
      // Arrange
      const eventData = {
        txId: 'tx-id-failed',
        txHash:
          '0xfailedhash1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: '12349',
        job: mockJob,
        finalStatus: ChainTransactionStatus.FAILED as
          | ChainTransactionStatus.CONFIRMED
          | ChainTransactionStatus.FAILED,
      };

      // Act
      service.publishTransactionFinalized(eventData);

      // Assert
      expect(amqpConnection.publish as jest.Mock).toHaveBeenCalledWith(
        'Empressa.events.topic',
        'transactions.finalized.failed',
        expect.any(Object),
        expect.any(Object),
      );
    });
  });
});
