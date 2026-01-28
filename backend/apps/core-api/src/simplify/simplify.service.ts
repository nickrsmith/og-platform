import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/database';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  CreateSimplifyNotarySessionDto,
  SimplifyNotarySessionResponseDto,
  SubmitSimplifyRecordingDto,
  SimplifyRecordingResponseDto,
} from './dto/simplify.dto';

@Injectable()
export class SimplifyService {
  private readonly logger = new Logger(SimplifyService.name);
  private readonly simplifyApiKey: string;
  private readonly simplifyBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.simplifyApiKey = this.configService.get<string>('SIMPLIFY_API_KEY') || '';
    this.simplifyBaseUrl = this.configService.get<string>('SIMPLIFY_BASE_URL') || 'https://api.simplify.com/v1';
    
    if (!this.simplifyApiKey) {
      this.logger.warn('SIMPLIFY_API_KEY not configured. Simplify integration will be disabled.');
    }
  }

  /**
   * Create a new Simplify e-notary session for a transaction
   * NOTE: This is a placeholder implementation. Actual API endpoints and structure
   * will be determined once Simplify API documentation is received.
   */
  async createNotarySession(
    dto: CreateSimplifyNotarySessionDto,
  ): Promise<SimplifyNotarySessionResponseDto> {
    if (!this.simplifyApiKey) {
      throw new Error('Simplify API not configured. Please set SIMPLIFY_API_KEY.');
    }

    const transactionId = dto.transactionId;

    // Verify transaction exists
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: true,
        seller: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }

    try {
      // TODO: Replace with actual Simplify API call once documentation is received
      // Expected structure based on common e-notary APIs:
      // - Endpoint: POST /notary/sessions or similar
      // - Body: { transactionId, buyer, seller, documents, etc. }
      // - Response: { sessionId, clientToken, redirectUrl }
      
      this.logger.warn(
        `Simplify API integration pending documentation. Transaction: ${transactionId}`,
      );

      // Placeholder: Mock response until API docs are received
      // In production, this would be:
      // const response = await firstValueFrom(
      //   this.httpService.post(
      //     `${this.simplifyBaseUrl}/notary/sessions`,
      //     {
      //       transactionId,
      //       buyerId: transaction.buyerId,
      //       sellerId: transaction.sellerId,
      //       // ... other required fields
      //     },
      //     {
      //       headers: {
      //         'Authorization': `Bearer ${this.simplifyApiKey}`,
      //         'Content-Type': 'application/json',
      //       },
      //     },
      //   ),
      // );

      // Placeholder session ID
      const sessionId = `simplify_session_${transactionId}_${Date.now()}`;

      // Update transaction with Simplify session ID
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          simplifyNotarySessionId: sessionId,
        },
      });

      this.logger.log(`Created Simplify notary session ${sessionId} for transaction ${transactionId}`);

      return {
        sessionId,
        clientToken: '', // Will be populated from actual API response
        redirectUrl: '', // Will be populated from actual API response
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to create Simplify notary session for transaction ${transactionId}:`,
        error.response?.data || error.message,
      );
      throw new Error(
        `Failed to create Simplify notary session: ${error.response?.data?.errors?.[0]?.detail || error.message}`,
      );
    }
  }

  /**
   * Submit a recording to Simplify
   * NOTE: This is a placeholder implementation. Actual API endpoints and structure
   * will be determined once Simplify API documentation is received.
   */
  async submitRecording(
    dto: SubmitSimplifyRecordingDto,
  ): Promise<SimplifyRecordingResponseDto> {
    if (!this.simplifyApiKey) {
      throw new Error('Simplify API not configured. Please set SIMPLIFY_API_KEY.');
    }

    const transactionId = dto.transactionId;

    // Verify transaction exists
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }

    try {
      // TODO: Replace with actual Simplify API call once documentation is received
      // Expected structure based on common e-recording APIs:
      // - Endpoint: POST /recordings/submit or similar
      // - Body: { transactionId, documents, metadata, etc. }
      // - Response: { submissionId, status, fileNumber, bookPage }

      this.logger.warn(
        `Simplify recording API integration pending documentation. Transaction: ${transactionId}`,
      );

      // Placeholder: Mock response until API docs are received
      // In production, this would be:
      // const response = await firstValueFrom(
      //   this.httpService.post(
      //     `${this.simplifyBaseUrl}/recordings/submit`,
      //     {
      //       transactionId,
      //       sessionId: transaction.simplifyNotarySessionId,
      //       // ... other required fields
      //     },
      //     {
      //       headers: {
      //         'Authorization': `Bearer ${this.simplifyApiKey}`,
      //         'Content-Type': 'application/json',
      //       },
      //     },
      //   ),
      // );

      // Placeholder submission ID
      const submissionId = `simplify_recording_${transactionId}_${Date.now()}`;

      // Update transaction with recording status
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          recordingStatus: 'submitted',
        },
      });

      this.logger.log(`Submitted Simplify recording ${submissionId} for transaction ${transactionId}`);

      return {
        submissionId,
        status: 'submitted',
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to submit Simplify recording for transaction ${transactionId}:`,
        error.response?.data || error.message,
      );
      throw new Error(
        `Failed to submit Simplify recording: ${error.response?.data?.errors?.[0]?.detail || error.message}`,
      );
    }
  }

  /**
   * Handle Simplify e-notary webhook events
   */
  async handleNotaryWebhook(payload: any): Promise<void> {
    this.logger.log('Received Simplify notary webhook:', JSON.stringify(payload, null, 2));

    const eventType = payload.eventType || payload.type;
    const sessionId = payload.sessionId || payload.data?.sessionId;

    if (!sessionId) {
      this.logger.warn('Simplify notary webhook missing session ID');
      return;
    }

    // Find transaction by Simplify session ID
    const transaction = await this.prisma.transaction.findFirst({
      where: { simplifyNotarySessionId: sessionId },
    });

    if (!transaction) {
      this.logger.warn(`No transaction found for Simplify notary session ${sessionId}`);
      return;
    }

    // Handle different event types
    switch (eventType) {
      case 'notary.session.completed':
      case 'notary.completed':
        // Update transaction status when notary session completes
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            // Update any relevant fields based on webhook payload
            // Example: status, recordingStatus, etc.
          },
        });

        this.logger.log(`Notary session completed for transaction ${transaction.id}`);
        break;

      case 'notary.session.failed':
      case 'notary.failed':
        // Handle notary session failure
        this.logger.warn(`Notary session failed for transaction ${transaction.id}`);
        break;

      default:
        this.logger.log(`Unhandled Simplify notary webhook event type: ${eventType}`);
    }
  }

  /**
   * Handle Simplify e-recording webhook events
   */
  async handleRecordingWebhook(payload: any): Promise<void> {
    this.logger.log('Received Simplify recording webhook:', JSON.stringify(payload, null, 2));

    const eventType = payload.eventType || payload.type;
    const transactionId = payload.transactionId || payload.data?.transactionId;
    const recordingData = payload.data || payload;

    if (!transactionId) {
      this.logger.warn('Simplify recording webhook missing transaction ID');
      return;
    }

    // Verify transaction exists
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      this.logger.warn(`No transaction found for ID ${transactionId}`);
      return;
    }

    // Handle different event types
    switch (eventType) {
      case 'recording.submitted':
      case 'recording.pending':
        await this.prisma.transaction.update({
          where: { id: transactionId },
          data: {
            recordingStatus: 'submitted',
          },
        });

        this.logger.log(`Recording submitted for transaction ${transactionId}`);
        break;

      case 'recording.recorded':
      case 'recording.completed':
        await this.prisma.transaction.update({
          where: { id: transactionId },
          data: {
            recordingStatus: 'recorded',
            recordingFileNumber: recordingData.fileNumber || recordingData.file_number,
            recordingBookPage: recordingData.bookPage || recordingData.book_page,
          },
        });

        this.logger.log(
          `Recording completed for transaction ${transactionId}: File ${recordingData.fileNumber}, Page ${recordingData.bookPage}`,
        );
        break;

      case 'recording.failed':
      case 'recording.rejected':
        await this.prisma.transaction.update({
          where: { id: transactionId },
          data: {
            recordingStatus: 'failed',
          },
        });

        this.logger.warn(`Recording failed for transaction ${transactionId}`);
        break;

      default:
        this.logger.log(`Unhandled Simplify recording webhook event type: ${eventType}`);
    }
  }
}
