import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { type BlockchainJob } from '@prisma/client';
import {
  ChainEventType,
  ChainTransactionStatus,
  TransactionFinalizedEvent,
} from '@app/common';

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);
  private readonly exchange = 'Empressa.events.topic';

  constructor(private readonly amqpConnection: AmqpConnection) {}

  publishTransactionFinalized(eventData: {
    txId: string;
    txHash: string;
    blockNumber: string;
    job: BlockchainJob;
    finalStatus:
      | ChainTransactionStatus.CONFIRMED
      | ChainTransactionStatus.FAILED;
    eventOutput?: Record<string, unknown>;
  }) {
    const { txId, txHash, blockNumber, job, finalStatus, eventOutput } =
      eventData;
    const { id, eventType, createdAt, finalizedAt, payloadJson, errorMessage } =
      job;

    const event: TransactionFinalizedEvent = {
      id: txId,
      jobId: id,
      eventType: eventType as ChainEventType,
      finalStatus,
      txHash,
      blockNumber,
      submittedAt: createdAt.toISOString(),
      finalizedAt: finalizedAt!.toISOString(),
      originalPayload: payloadJson,
      error: errorMessage,
      eventOutput,
    };

    const routingKey = `transactions.finalized.${finalStatus.toLowerCase()}`;

    this.logger.log(`Publishing event with routing key '${routingKey}'...`);

    void this.amqpConnection.publish(this.exchange, routingKey, event, {
      persistent: true,
      contentType: 'application/json',
    });
  }
}
