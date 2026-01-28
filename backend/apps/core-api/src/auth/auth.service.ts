import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@app/database';
import {
  ChainEventType,
  CreateBlockchainJobRequestDto,
  CreateChainTransactionRequestDto,
  CreateP2PIdentityRequestDto,
  CreateP2PIdentityResponseDto,
  CreateSiteRequestDto,
  CreateWalletRequestDto,
  CreateWalletResponseDto,
  FundUserWalletPayload,
  GrantAssetManagerRolePayload,
  JwtPayload,
  LoginRequestDto,
  LoginResponseDto,
  LogoutRequestDto,
  Role,
} from '@app/common';
import {
  InvitationStatus,
  OrganizationRole,
  OrganizationStatus,
} from '@prisma/client';
import * as crypto from 'crypto';
import { firstValueFrom, catchError, of, timeout, TimeoutError } from 'rxjs';
import { AxiosError } from 'axios';
import { Web3AuthService } from './strategies/web3auth.service';
import human from 'humanparser';
import { v4 as uuid } from 'uuid';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly kmsServiceUrl: string;
  private readonly lensManagerUrl: string | null;
  private readonly blockchainServiceUrl: string;
  private readonly indexerApiUrl: string | null;
  private readonly httpTimeout: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly web3authService: Web3AuthService,
  ) {
    this.kmsServiceUrl =
      this.configService.getOrThrow<string>('KMS_SERVICE_URL');
    this.lensManagerUrl =
      this.configService.get<string>('LENS_MANAGER_URL') || null;
    this.blockchainServiceUrl = this.configService.getOrThrow(
      'BLOCKCHAIN_SERVICE_URL',
    );
    this.indexerApiUrl = this.configService.get<string>('INDEXER_API_URL') || null;
    // Ensure httpTimeout is always a valid number (default: 100 seconds)
    // Handle both number and string values from environment variables
    const timeoutValue = this.configService.get<string | number>(
      'HTTP_TIMEOUT',
      100000,
    );
    const parsedTimeout =
      typeof timeoutValue === 'string' ? Number(timeoutValue) : timeoutValue;
    this.httpTimeout =
      typeof parsedTimeout === 'number' &&
      !isNaN(parsedTimeout) &&
      parsedTimeout > 0
        ? parsedTimeout
        : 100000;

    // Log service URLs at startup for debugging
    this.logger.log(`[INIT] KMS Service URL: ${this.kmsServiceUrl}`);
    if (this.lensManagerUrl) {
      this.logger.log(`[INIT] Lens Manager URL: ${this.lensManagerUrl}`);
    } else {
      this.logger.warn('[INIT] Lens Manager URL not configured. P2P site operations will be disabled.');
    }
    this.logger.log(
      `[INIT] Blockchain Service URL: ${this.blockchainServiceUrl}`,
    );
    if (this.indexerApiUrl) {
      this.logger.log(`[INIT] Indexer API URL: ${this.indexerApiUrl}`);
    } else {
      this.logger.warn('[INIT] Indexer API URL not configured. Indexing operations will be disabled.');
    }
  }

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    this.logger.log('[LOGIN] Starting login process');
    const { token, invitationToken } = dto;
    this.logger.log(`[LOGIN] Received token, length: ${token?.length}`);
    this.logger.log(
      `[LOGIN] Received invitationToken: ${invitationToken ? `Yes (${invitationToken.substring(0, 8)}...)` : 'No'}`,
    );

    try {
      this.logger.log('[LOGIN] Validating Web3Auth token...');
      let web3AuthPayload;
      try {
        web3AuthPayload = await this.web3authService.validateToken(token);
        this.logger.log('[LOGIN] Token validated successfully');
      } catch (error) {
        // If Web3Auth is not configured, provide helpful error message
        if (error instanceof UnauthorizedException && 
            error.message.includes('Web3Auth is not configured')) {
          this.logger.error('[LOGIN] Web3Auth is not configured. For local development, you can:');
          this.logger.error('[LOGIN] 1. Configure Web3Auth environment variables (WEB3AUTH_JWKS_URL, WEB3AUTH_ISSUER, WEB3AUTH_AUDIENCE)');
          this.logger.error('[LOGIN] 2. Or use a different authentication method');
          throw new UnauthorizedException(
            'Web3Auth is not configured. Please configure WEB3AUTH_JWKS_URL, WEB3AUTH_ISSUER, and WEB3AUTH_AUDIENCE in your backend environment variables. ' +
            'For local development, you may need to set up a Web3Auth account at https://web3auth.io'
          );
        }
        throw error;
      }

      const {
        email,
        name,
        profileImage,
        groupedAuthConnectionId: provider,
        userId: providerUserId,
      } = web3AuthPayload;
      const subject = `${provider}|${providerUserId}`;
      this.logger.log(
        `[LOGIN] User email: ${email}, provider: ${provider}, providerUserId: ${providerUserId}`,
      );

      this.logger.log(`[LOGIN] Looking up user by email: ${email}`);
      let user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        // --- BRAND NEW USER ---
        this.logger.log(
          `[LOGIN] New user detected: ${email}. Starting provisioning.`,
        );
        const parsedName = human.parseName(name);

        // Handle edge case: if name is actually an email or parsing failed
        let firstName = parsedName.firstName;
        let lastName = parsedName.lastName;

        if (!firstName || firstName === email) {
          this.logger.warn(
            `[LOGIN] Name parsing failed for ${email}, name was: ${name}. Using fallback.`,
          );
          firstName = email.split('@')[0] || 'User';
          lastName = 'User';
        }
        if (!lastName) {
          lastName = 'User';
        }

        this.logger.log(
          `[LOGIN] Creating user with firstName: ${firstName}, lastName: ${lastName}`,
        );

        // Fetch profile image only if a valid URL is provided
        let profileImageDataUrl: string | null = null;
        if (
          profileImage &&
          profileImage !== 'undefined' &&
          profileImage.startsWith('http')
        ) {
          this.logger.log(
            `[LOGIN] Fetching profile image from: ${profileImage}`,
          );
          profileImageDataUrl =
            await this._fetchProfileImageAsDataUrl(profileImage);
        } else {
          this.logger.log(
            `[LOGIN] No valid profile image URL provided, using fallback`,
          );
        }

        // Provide a fallback profile image if fetching fails
        const finalProfileImage =
          profileImageDataUrl || 'https://via.placeholder.com/150';

        this.logger.log(`[LOGIN] Creating user record in database...`);
        // Create user as inactive initially - will activate only after successful provisioning
        user = await this.prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            profileImage: finalProfileImage,
            isActive: false, // User is inactive until provisioning succeeds
            authentications: { create: { provider, providerUserId } },
          },
        });
        this.logger.log(`[LOGIN] User created with ID: ${user.id} (inactive)`);

        // Provision universal resources - if this fails, user remains inactive
        try {
          this.logger.log(`[LOGIN] Provisioning wallet for user ${user.id}...`);
          await this._provisionUserWallet(user.id);
          this.logger.log(`[LOGIN] Wallet provisioned successfully`);

          this.logger.log(
            `[LOGIN] Provisioning P2P identity for user ${user.id}...`,
          );
          await this._provisionUserP2PIdentity(user.id, subject);
          this.logger.log(`[LOGIN] P2P identity provisioned successfully`);

          // Only activate user after all provisioning succeeds
          await this.prisma.user.update({
            where: { id: user.id },
            data: { isActive: true },
          });
          this.logger.log(`[LOGIN] User ${user.id} activated successfully`);
        } catch (provisioningError) {
          // If provisioning fails, user remains inactive
          this.logger.error(
            `[LOGIN] Failed to provision resources for user ${user.id}. User will remain inactive.`,
            provisioningError instanceof Error
              ? provisioningError.message
              : String(provisioningError),
          );
          throw new InternalServerErrorException('Failed to register');
        }
      } else {
        // --- RETURNING USER ---
        this.logger.log(`[LOGIN] Returning user found with ID: ${user.id}`);

        // Check if user is active - inactive users indicate failed provisioning
        if (!user.isActive) {
          this.logger.warn(
            `[LOGIN] User ${user.id} is inactive. This may indicate a previous failed registration.`,
          );
          throw new InternalServerErrorException(
            'User account is not active. Registration may have failed previously.',
          );
        }

        // Check if this is a new authentication method for an existing user
        const authExists = await this.prisma.userAuthentication.count({
          where: { provider, providerUserId },
        });
        if (authExists === 0) {
          this.logger.log(
            `[LOGIN] Linking new auth provider '${provider}' to existing user ${user.id}`,
          );
          await this.prisma.userAuthentication.create({
            data: { provider, providerUserId, userId: user.id },
          });
        }

        // Check if user is missing essential resources and provision them if needed
        const existingWallet = await this.prisma.wallet.findUnique({
          where: { userId: user.id },
        });
        const existingP2PIdentity = await this.prisma.p2PIdentity.findUnique({
          where: { userId: user.id },
        });

        if (!existingWallet || !existingP2PIdentity) {
          this.logger.warn(
            `[LOGIN] User ${user.id} is missing essential resources. wallet: ${!!existingWallet}, p2pIdentity: ${!!existingP2PIdentity}. Provisioning missing resources...`,
          );

          try {
            if (!existingWallet) {
              this.logger.log(
                `[LOGIN] Provisioning wallet for user ${user.id}...`,
              );
              await this._provisionUserWallet(user.id);
              this.logger.log(`[LOGIN] Wallet provisioned successfully`);
            }

            if (!existingP2PIdentity) {
              this.logger.log(
                `[LOGIN] Provisioning P2P identity for user ${user.id}...`,
              );
              await this._provisionUserP2PIdentity(user.id, subject);
              this.logger.log(`[LOGIN] P2P identity provisioned successfully`);
            }
          } catch (provisioningError) {
            // If provisioning fails for returning user, this is a login failure
            this.logger.error(
              `[LOGIN] Failed to provision missing resources for returning user ${user.id}.`,
              provisioningError instanceof Error
                ? provisioningError.message
                : String(provisioningError),
            );
            throw new InternalServerErrorException(
              'Failed to complete login. Please try again.',
            );
          }
        }
      }

      // --- HANDLE INVITATION (for both new and existing users) ---
      if (invitationToken) {
        this.logger.log(
          `[LOGIN] Processing invitation token for user ${user.id} with email ${email}`,
        );
        this.logger.log(
          `[LOGIN] Invitation token value: ${invitationToken.substring(0, 16)}...`,
        );
        try {
          await this._handleInvitedUser(user.id, email, invitationToken);
          this.logger.log(
            `[LOGIN] Successfully processed invitation token for user ${user.id}`,
          );
        } catch (error) {
          this.logger.error(
            `[LOGIN] Failed to process invitation token: ${error instanceof Error ? error.message : String(error)}`,
          );
          this.logger.error(
            `[LOGIN] Invitation error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`,
          );
          // Don't fail the login if invitation processing fails, but log it
          // The user can still log in, they just won't be added to the organization
        }
      } else {
        this.logger.log(
          `[LOGIN] No invitation token provided for user ${user.id}`,
        );
      }

      // --- GENERATE TOKENS ---
      this.logger.log(`[LOGIN] Fetching user resources for user ${user.id}...`);
      // Fetch the user's latest state to build the JWT payload
      const memberInfo = await this.prisma.organizationMember.findFirst({
        where: { userId: user.id },
        include: { organization: true },
      });

      const p2pIdentity = await this.prisma.p2PIdentity.findUnique({
        where: { userId: user.id },
      });
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId: user.id },
      });

      if (!p2pIdentity || !wallet) {
        this.logger.error(
          `[LOGIN] Critical provisioning error for user ${user.id}: P2P Identity or Wallet not found. p2pIdentity: ${!!p2pIdentity}, wallet: ${!!wallet}`,
        );
        throw new InternalServerErrorException(
          'Failed to retrieve essential user resources after creation.',
        );
      }

      this.logger.log(`[LOGIN] Building JWT payload for user ${user.id}...`);
      // This is the key change: payload fields can be undefined for users without an org
      const accessTokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: user.id,
        email: user.email,
        organizationId: memberInfo?.organizationId,
        siteAddress: memberInfo?.organization.siteAddress,
        role: memberInfo?.role as Role,
        peerId: p2pIdentity.peerId,
        p2pPublicKey: p2pIdentity.publicKey,
        walletPublicKey: wallet.compressedPublicKey,
      };

      // Generate tokens first (critical path)
      this.logger.log(
        `[LOGIN] Generating and storing tokens for user ${user.id}...`,
      );
      const tokenResult = await this.generateAndStoreTokens(accessTokenPayload);
      this.logger.log(
        `[LOGIN] Tokens generated successfully for user ${user.id}`,
      );

      // Then fire-and-forget site opening (non-critical, don't block response)
      if (memberInfo?.organization?.siteAddress) {
        const siteAddress = memberInfo.organization.siteAddress;
        this.logger.log(`[LOGIN] Ensuring site is open: ${siteAddress}`);
        // Use setImmediate to ensure this happens after the response is sent
        setImmediate(() => {
          this._ensureSiteIsOpen(siteAddress).catch((_error) => {
            // Errors are already logged in _ensureSiteIsOpen, just prevent unhandled rejection
            this.logger.debug(
              `Site opening failed for org ${siteAddress}, but login continues`,
            );
          });
        });
      }

      this.logger.log(
        `[LOGIN] Login flow completed successfully for user ${user.id}`,
      );
      return tokenResult;
    } catch (error) {
      this.logger.error(
        `[LOGIN] Login failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.logger.error(
        `[LOGIN] Stack trace: ${error instanceof Error ? error.stack : 'No stack trace'}`,
      );
      throw error;
    }
  }

  /**
   * Provisions a Wallet for a new user via the KMS service.
   */
  private async _provisionUserWallet(
    userId: string,
  ): Promise<CreateWalletResponseDto> {
    const url = `${this.kmsServiceUrl}/wallets`;
    const payload: CreateWalletRequestDto = { userId };

    this.logger.log(`[KMS] Attempting to provision wallet for user ${userId}`);
    this.logger.log(`[KMS] KMS Service URL: ${this.kmsServiceUrl}`);
    this.logger.log(`[KMS] Full request URL: ${url}`);
    this.logger.log(`[KMS] Request payload: ${JSON.stringify(payload)}`);

    try {
      const { data: walletData } = await firstValueFrom(
        this.httpService
          .post<CreateWalletResponseDto>(url, payload, {
            timeout: 30000, // 30 second timeout
          })
          .pipe(
            catchError((err: AxiosError) => {
              // Enhanced error logging for KMS connection debugging
              const errorDetails = {
                url,
                kmsServiceUrl: this.kmsServiceUrl,
                userId,
                errorType: err.code || 'UNKNOWN',
                httpStatus: err.response?.status,
                httpStatusText: err.response?.statusText,
                responseData: err.response?.data,
                errorMessage: err.message,
                errorCode: err.code,
                isNetworkError: !err.response, // true if no response received (connection/timeout)
                isTimeout:
                  err.code === 'ECONNABORTED' ||
                  err.message?.includes('timeout'),
                isConnectionRefused: err.code === 'ECONNREFUSED',
                isHostNotFound:
                  err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN',
                requestConfig: {
                  method: err.config?.method,
                  baseURL: err.config?.baseURL,
                  timeout: err.config?.timeout,
                },
              };

              this.logger.error(
                `[KMS] Failed to create wallet for user ${userId}`,
                JSON.stringify(errorDetails, null, 2),
              );

              // Provide more specific error messages based on error type
              let errorMessage = 'Failed to provision user wallet.';
              if (err.code === 'ECONNREFUSED') {
                errorMessage = `KMS service connection refused. Is the KMS service running at ${this.kmsServiceUrl}?`;
              } else if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
                errorMessage = `KMS service host not found. Check if KMS_SERVICE_URL (${this.kmsServiceUrl}) is correct.`;
              } else if (
                err.code === 'ECONNABORTED' ||
                err.message?.includes('timeout')
              ) {
                errorMessage = `KMS service request timed out. The service at ${this.kmsServiceUrl} may be unresponsive.`;
              } else if (err.response) {
                errorMessage = `KMS service returned HTTP ${err.response.status}: ${err.response.statusText}`;
              } else {
                errorMessage = `KMS service error: ${err.message}`;
              }

              throw new InternalServerErrorException(errorMessage);
            }),
          ),
      );

      this.logger.log(
        `[KMS] Successfully provisioned wallet for user ${userId}. Wallet address: ${walletData.walletAddress}`,
      );

      // After the wallet is successfully created, trigger the funding job.
      // This is a "fire-and-forget" call; we don't await it so it doesn't block the login flow.
      this._enqueueFaucetJob(walletData.walletAddress).catch((err) => {
        // Log any errors that occur during the enqueue process, but don't fail the login.
        this.logger.error(
          `Failed to enqueue faucet job for new user ${userId} at address ${walletData.walletAddress}`,
          err,
        );
      });
      return walletData;
    } catch (error) {
      // Re-throw if it's already an InternalServerErrorException from catchError
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      // Catch any unexpected errors
      this.logger.error(
        `[KMS] Unexpected error during wallet provisioning for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException(
        `Unexpected error during wallet provisioning: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Provisions a P2P Identity for a new user via the KMS service.
   */
  private async _provisionUserP2PIdentity(
    userId: string,
    subject: string,
  ): Promise<CreateP2PIdentityResponseDto> {
    const url = `${this.kmsServiceUrl}/p2p-identities`;
    const payload: CreateP2PIdentityRequestDto = { userId, subject };

    this.logger.log(
      `[KMS] Attempting to provision P2P identity for user ${userId}`,
    );
    this.logger.log(`[KMS] Full request URL: ${url}`);
    this.logger.log(`[KMS] Request payload: ${JSON.stringify(payload)}`);

    try {
      const { data } = await firstValueFrom(
        this.httpService
          .post<CreateP2PIdentityResponseDto>(url, payload, {
            timeout: 30000, // 30 second timeout
          })
          .pipe(
            catchError((err: AxiosError) => {
              const errorDetails = {
                url,
                kmsServiceUrl: this.kmsServiceUrl,
                userId,
                subject,
                errorType: err.code || 'UNKNOWN',
                httpStatus: err.response?.status,
                httpStatusText: err.response?.statusText,
                responseData: err.response?.data,
                errorMessage: err.message,
                errorCode: err.code,
                isNetworkError: !err.response,
                isTimeout:
                  err.code === 'ECONNABORTED' ||
                  err.message?.includes('timeout'),
                isConnectionRefused: err.code === 'ECONNREFUSED',
                isHostNotFound:
                  err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN',
              };

              this.logger.error(
                `[KMS] Failed to create P2P Identity for user ${userId}`,
                JSON.stringify(errorDetails, null, 2),
              );

              let errorMessage = 'Failed to provision P2P identity.';
              if (err.code === 'ECONNREFUSED') {
                errorMessage = `KMS service connection refused. Is the KMS service running at ${this.kmsServiceUrl}?`;
              } else if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
                errorMessage = `KMS service host not found. Check if KMS_SERVICE_URL (${this.kmsServiceUrl}) is correct.`;
              } else if (
                err.code === 'ECONNABORTED' ||
                err.message?.includes('timeout')
              ) {
                errorMessage = `KMS service request timed out. The service at ${this.kmsServiceUrl} may be unresponsive.`;
              } else if (err.response) {
                errorMessage = `KMS service returned HTTP ${err.response.status}: ${err.response.statusText}`;
              } else {
                errorMessage = `KMS service error: ${err.message}`;
              }

              throw new InternalServerErrorException(errorMessage);
            }),
          ),
      );

      this.logger.log(
        `[KMS] Successfully provisioned P2P identity for user ${userId}. Public Key: ${data.publicKey.substring(0, 20)}...`,
      );
      return data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(
        `[KMS] Unexpected error during P2P identity provisioning for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException(
        `Unexpected error during P2P identity provisioning: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Handles the logic for a user who has an invitation token.
   */
  private async _handleInvitedUser(
    userId: string,
    email: string,
    token: string,
  ): Promise<void> {
    this.logger.log(
      `[_handleInvitedUser] Looking for invitation with token: ${token.substring(0, 8)}... and email: ${email}`,
    );

    // Find the invitation by token first (token is unique, so this should find the right one)
    // Then verify email matches (case-insensitive) and status is PENDING
    const invitation = await this.prisma.organizationInvitation.findFirst({
      where: {
        token,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      // --- MODIFICATION: Include organization data in the query ---
      include: {
        organization: true,
      },
    });

    if (!invitation) {
      // Log more details for debugging
      const allInvitations = await this.prisma.organizationInvitation.findMany({
        where: { token },
        select: {
          id: true,
          email: true,
          status: true,
          expiresAt: true,
          organizationId: true,
        },
      });

      this.logger.warn(
        `User ${userId} presented an invalid or expired invitation token.`,
      );
      this.logger.warn(
        `Invitation lookup details - Token: ${token.substring(0, 8)}..., User email: ${email}, Found invitations: ${JSON.stringify(allInvitations)}`,
      );
      return;
    }

    // Verify email matches (case-insensitive)
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      this.logger.warn(
        `Email mismatch: invitation email "${invitation.email}" does not match user email "${email}"`,
      );
      return;
    }

    this.logger.log(
      `[_handleInvitedUser] Found invitation ${invitation.id} for organization ${invitation.organizationId}`,
    );

    // --- NEW LOGIC: Check for the "claiming" flow ---
    const isClaimingFlow =
      invitation.role === OrganizationRole.Principal &&
      invitation.organization.status === OrganizationStatus.UNCLAIMED;

    if (isClaimingFlow) {
      this.logger.log(
        `User ${userId} is claiming unclaimed organization ${invitation.organizationId}`,
      );

      // 1. Fetch the user's wallet now that we know we need it
      const wallet = await this.prisma.wallet.findUniqueOrThrow({
        where: { userId },
      });
      const p2pIdentity = await this.prisma.p2PIdentity.findUniqueOrThrow({
        where: { userId },
      });

      // 2. Update the organization to "claim" it
      await this.prisma.organization.update({
        where: { id: invitation.organizationId },
        data: {
          principalUserId: userId,
          status: OrganizationStatus.ACTIVE,
        },
      });

      // 3. Trigger the resource provisioning (P2P site, contract, etc.)
      await this.provisionOrganizationResources(
        invitation.organizationId,
        p2pIdentity.publicKey,
        wallet.walletAddress,
      );
    }

    // This logic runs for both regular invites and the claiming flow
    // Use a transaction to ensure both operations succeed or fail together
    try {
      await this.prisma.$transaction(async (tx) => {
        this.logger.log(
          `[_handleInvitedUser] Starting transaction for invitation ${invitation.id}`,
        );

        // Check if user is already a member (could happen if manually added or previous partial attempt)
        const existingMember = await tx.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: invitation.organizationId,
              userId,
            },
          },
        });

        if (!existingMember) {
          // User is not a member yet, create the membership
          this.logger.log(
            `[_handleInvitedUser] Creating organization member for user ${userId} in organization ${invitation.organizationId}`,
          );
          await tx.organizationMember.create({
            data: {
              userId,
              organizationId: invitation.organizationId,
              role: invitation.role,
            },
          });
          this.logger.log(
            `[_handleInvitedUser] Successfully created organization member`,
          );
        } else {
          // User is already a member, log this case but continue to update invitation status
          this.logger.warn(
            `User ${userId} is already a member of organization ${invitation.organizationId}. Updating invitation status to ACCEPTED.`,
          );
        }

        // Always update the invitation status to ACCEPTED, regardless of whether member was created or already existed
        this.logger.log(
          `[_handleInvitedUser] Updating invitation ${invitation.id} status to ACCEPTED`,
        );
        await tx.organizationInvitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.ACCEPTED },
        });
        this.logger.log(
          `[_handleInvitedUser] Successfully updated invitation status to ACCEPTED`,
        );
      });
    } catch (error) {
      this.logger.error(
        `[_handleInvitedUser] Transaction failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.logger.error(
        `[_handleInvitedUser] Transaction error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`,
      );
      throw error; // Re-throw to be caught by the outer try-catch
    }

    this.logger.log(
      `User ${userId} successfully joined organization ${invitation.organizationId} via invitation.`,
    );

    if (invitation.organization.contractAddress) {
      this.logger.log(
        `User ${userId} has asset manager rights. Enqueuing GRANT_CREATOR_ROLE job.`,
      );
      try {
        const userWallet = await this.prisma.wallet.findUniqueOrThrow({
          where: { userId },
          select: { walletAddress: true },
        });

        const txId = uuid();
        const eventType = ChainEventType.GRANT_CREATOR_ROLE;

        // 1. Create the pending transaction record in the indexer
        if (this.indexerApiUrl) {
          await firstValueFrom(
            this.httpService.post(`${this.indexerApiUrl}/transactions`, {
              txId,
              eventType,
              submittedAt: new Date().toISOString(),
              relatedObjectId: invitation.organizationId,
            } as CreateChainTransactionRequestDto),
          );
        } else {
          this.logger.debug('Indexer API URL not configured. Skipping transaction indexing.');
        }

        // 2. Enqueue the job in the blockchain service
        const jobPayload: GrantAssetManagerRolePayload = {
          organizationId: invitation.organizationId,
          userWalletAddress: userWallet.walletAddress,
        };
        const jobRequest: CreateBlockchainJobRequestDto = {
          eventType,
          txId,
          payload: jobPayload,
        };
        await firstValueFrom(
          this.httpService.post(
            `${this.blockchainServiceUrl}/jobs`,
            jobRequest,
            {
              headers: {
                'X-Idempotency-Key': `grant-creator-${invitation.organizationId}-${userId}`,
              },
            },
          ),
        );
      } catch (error) {
        this.logger.error(
          `Failed to enqueue GRANT_CREATOR_ROLE job for user ${userId} in org ${invitation.organizationId}. This may require manual intervention.`,
          error instanceof AxiosError ? error.response?.data : error,
        );
        // We do not throw here, as the user has successfully joined off-chain.
        // This is a "fire-and-forget" enhancement.
      }
    }
  }

  async refreshToken(
    userId: string,
    currentRefreshToken: string,
  ): Promise<LoginResponseDto> {
    this.logger.log(`Attempting to refresh session for user ${userId}`);

    // 1. Hash the incoming token to find it in the database
    const tokenHash = crypto
      .createHash('sha256')
      .update(currentRefreshToken)
      .digest('hex');

    // 2. Find the session and ensure it's valid
    const session = await this.prisma.sessionRefreshToken.findUnique({
      where: { tokenHash },
    });

    if (!session || session.isRevoked || session.userId !== userId) {
      throw new UnauthorizedException('Invalid or revoked refresh token.');
    }

    // 3. Revoke the used refresh token (Token Rotation)
    await this.prisma.sessionRefreshToken.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });
    this.logger.log(`Revoked refresh token for session ${session.id}`);

    // 4. Fetch the user's most up-to-date information to build the new payload
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const memberInfo = await this.prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    const p2pIdentity = await this.prisma.p2PIdentity.findUnique({
      where: { userId },
    });
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });

    if (!p2pIdentity || !wallet) {
      throw new InternalServerErrorException(
        `Critical data missing for user ${userId}. Cannot refresh session.`,
      );
    }

    const newAccessTokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      organizationId: memberInfo?.organizationId,
      siteAddress: memberInfo?.organization?.siteAddress,
      role: memberInfo?.role as Role,
      peerId: p2pIdentity.peerId,
      p2pPublicKey: p2pIdentity.publicKey,
      walletPublicKey: wallet.compressedPublicKey,
    };

    // 5. Generate and store a new token pair
    return this.generateAndStoreTokens(newAccessTokenPayload);
  }

  async logout(dto: LogoutRequestDto): Promise<void> {
    const { refreshToken } = dto;

    // 1. Hash the incoming token to match the stored hash.
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // 2. Find the session record in the database.
    const session = await this.prisma.sessionRefreshToken.findUnique({
      where: { tokenHash },
    });

    // 3. If a session exists and is not already revoked, update it.
    // If no session is found, we do nothing. The token is already invalid.
    if (session && !session.isRevoked) {
      await this.prisma.sessionRefreshToken.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      this.logger.log(
        `Session for user ${session.userId} successfully revoked.`,
      );
    }
  }

  private async generateAndStoreTokens(
    accessTokenPayload: Omit<JwtPayload, 'iat' | 'exp'>,
  ): Promise<LoginResponseDto> {
    const { sub } = accessTokenPayload;

    this.logger.log(
      `[TOKENS] Signing access and refresh tokens for user ${sub}...`,
    );
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_TOKEN_EXPIRATION',
        ),
      }),
      this.jwtService.signAsync(
        { sub },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION',
          ),
        },
      ),
    ]);
    this.logger.log(`[TOKENS] Tokens signed successfully for user ${sub}`);

    // Store the hashed refresh token in the database
    this.logger.log(
      `[TOKENS] Storing refresh token in database for user ${sub}...`,
    );
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Matches 7d expiration

    await this.prisma.sessionRefreshToken.create({
      data: {
        userId: sub,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });
    this.logger.log(
      `[TOKENS] Refresh token stored successfully for user ${sub}`,
    );

    return { accessToken, refreshToken };
  }

  async provisionOrganizationResources(
    organizationId: string,
    p2pPublicKey: string,
    walletAddress: string,
  ) {
    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    const { siteAddress } = await this._createP2PSite({
      userPublicKey: p2pPublicKey,
      organizationId: organization.id,
      alias: organization.name,
    });

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { siteAddress },
    });

    this._indexNewSite(siteAddress, organization.id, organization.name);
    void this._enqueueOrgContractCreation(organization.id, walletAddress);

    this.logger.log(
      `Successfully provisioned resources for claimed organization ${organizationId}.`,
    );
  }

  private async _createP2PSite(
    dto: CreateSiteRequestDto,
  ): Promise<{ siteAddress: string }> {
    if (!this.lensManagerUrl) {
      this.logger.warn('Lens Manager URL not configured. Cannot create P2P site.');
      throw new InternalServerErrorException(
        'P2P site creation is not available. LENS_MANAGER_URL is not configured.',
      );
    }
    
    const url = `${this.lensManagerUrl}/sites`;
    const { data } = await firstValueFrom(
      this.httpService.post<{ siteAddress: string }>(url, dto).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(`Failed to create P2P site`, error.response?.data);
          throw new InternalServerErrorException(
            'Failed to provision P2P site.',
          );
        }),
      ),
    );
    return data;
  }

  private _indexNewSite(
    siteAddress: string,
    organizationId: string,
    alias: string,
  ) {
    if (!this.indexerApiUrl) {
      this.logger.debug('Indexer API URL not configured. Skipping site indexing.');
      return;
    }
    
    const url = `${this.indexerApiUrl}/sites/${siteAddress}`;
    void firstValueFrom(
      this.httpService.post(url, { organizationId, alias }).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(
            `Asynchronous indexing failed for site ${siteAddress}`,
            error.response?.data,
          );
          return [];
        }),
      ),
    );
  }

  private async _enqueueOrgContractCreation(
    organizationId: string,
    principalWalletAddress: string,
  ) {
    const blockchainJobUrl = `${this.blockchainServiceUrl}/jobs`;
    const txId = uuid();

    const jobRequest: CreateBlockchainJobRequestDto = {
      eventType: ChainEventType.CREATE_ORG_CONTRACT,
      txId,
      payload: { organizationId, principalWalletAddress },
    };

    try {
      // Create the pending transaction record in the indexer (if configured)
      if (this.indexerApiUrl) {
        const indexerTxUrl = `${this.indexerApiUrl}/transactions`;
        const indexerRequest: CreateChainTransactionRequestDto = {
          txId,
          eventType: ChainEventType.CREATE_ORG_CONTRACT,
          submittedAt: new Date().toISOString(),
          relatedObjectId: organizationId,
        };
        await firstValueFrom(this.httpService.post(indexerTxUrl, indexerRequest));
      } else {
        this.logger.debug('Indexer API URL not configured. Skipping transaction indexing.');
      }
      void firstValueFrom(
        this.httpService.post(blockchainJobUrl, jobRequest, {
          headers: { 'X-Idempotency-Key': `create-org-${organizationId}` },
        }),
      );
    } catch (err) {
      this.logger.error(
        `Failed to enqueue contract creation for org ${organizationId}`,
        err,
      );
    }
  }

  private async _enqueueFaucetJob(recipientAddress: string): Promise<void> {
    this.logger.log(
      `Enqueuing faucet job to fund address: ${recipientAddress}`,
    );

    const blockchainJobUrl = `${this.blockchainServiceUrl}/jobs`;
    const eventType = ChainEventType.FUND_USER_WALLET;
    // For simple jobs like this, we can use a deterministic txId if we want,
    // but a random one is fine as we don't need to track it from the core-api.
    const txId = uuid();

    const jobPayload: FundUserWalletPayload = {
      txId,
      recipientAddress,
    };

    const jobRequestDto: CreateBlockchainJobRequestDto = {
      eventType,
      txId,
      payload: jobPayload,
    };

    // We don't need to create a corresponding transaction record in the indexer for a simple faucet funding.
    // We just enqueue the job.
    await firstValueFrom(
      this.httpService.post(blockchainJobUrl, jobRequestDto, {
        // Idempotency key ensures we don't accidentally fund the same wallet twice
        // if the login flow is retried for some reason.
        headers: { 'X-Idempotency-Key': `fund-wallet-${recipientAddress}` },
      }),
    );
    this.logger.log(
      `Successfully enqueued faucet job for ${recipientAddress}.`,
    );
  }

  startSession(user: JwtPayload) {
    this.logger.log(`Starting session for user ${user.sub}...`);
    if (user.siteAddress) {
      // Fire-and-forget: don't block session start on site opening
      this._ensureSiteIsOpen(user.siteAddress).catch((_error) => {
        // Errors are already logged in _ensureSiteIsOpen, just prevent unhandled rejection
        this.logger.debug(
          `Site opening failed for user ${user.sub}, but session continues`,
        );
      });
    }
    return user;
  }

  private async _ensureSiteIsOpen(siteAddress: string): Promise<void> {
    if (!siteAddress) {
      this.logger.debug(
        'Skipping site open check: siteAddress is not provided',
      );
      return;
    }

    if (!this.lensManagerUrl) {
      this.logger.debug(
        'Skipping site open check: Lens Manager URL is not configured',
      );
      return;
    }

    this.logger.log(`Notifying lens-manager to open site: ${siteAddress}`);
    try {
      const url = `${this.lensManagerUrl}/sites/${siteAddress}`;

      // Wrap in Promise.race to ensure hard timeout even if HTTP client doesn't respect it
      await Promise.race([
        firstValueFrom(
          this.httpService
            .patch(url, { state: 'open' }, { timeout: this.httpTimeout })
            .pipe(
              timeout(this.httpTimeout),
              catchError((error: unknown) => {
                // Handle timeout errors
                if (error instanceof TimeoutError) {
                  this.logger.warn(
                    `Request to lens-manager timed out after ${this.httpTimeout}ms. Lens-manager may not be running or accessible. This may affect P2P operations.`,
                  );
                  return of(null); // Return empty observable to prevent error propagation
                }

                // Handle Axios errors
                if (!(error instanceof AxiosError)) {
                  // If it's not an AxiosError or TimeoutError, wrap it in an Error
                  const errorMessage =
                    error instanceof Error
                      ? error.message
                      : `Unexpected error: ${String(error)}`;
                  throw new InternalServerErrorException(errorMessage);
                }

                // At this point, TypeScript knows error is an AxiosError
                const statusCode = error.response?.status;

                // If site doesn't exist (404), it's not an error - just log and return
                if (statusCode === 404) {
                  this.logger.warn(
                    `Site ${siteAddress} not found in lens-manager. It may have been created yet or lens-manager was restarted.`,
                  );
                  return of(null); // Return empty observable to prevent error propagation
                }

                // Handle gateway timeouts (504) and server errors (5xx) as non-critical
                // These indicate lens-manager is slow or unavailable, but shouldn't block login
                if (
                  statusCode === 504 ||
                  (statusCode && statusCode >= 500 && statusCode < 600)
                ) {
                  this.logger.warn(
                    `Lens-manager returned ${statusCode} for site ${siteAddress}. This may indicate the site opening is taking too long or lens-manager is unavailable. Login will continue, but P2P operations may be affected.`,
                  );
                  return of(null); // Return empty observable to prevent error propagation
                }

                // Check for network/DNS errors (e.g., ENOTFOUND, ECONNREFUSED)
                // These are non-critical and should be handled gracefully
                const errorCode = (error.code || '').toUpperCase();
                const errorMessage = error.message || '';
                const isNetworkError =
                  errorCode === 'ENOTFOUND' ||
                  errorCode === 'ECONNREFUSED' ||
                  errorCode === 'ETIMEDOUT' ||
                  errorCode === 'EHOSTUNREACH' ||
                  errorMessage.includes('getaddrinfo') ||
                  errorMessage.includes('ENOTFOUND') ||
                  errorMessage.includes('ECONNREFUSED') ||
                  errorMessage.includes('timeout') ||
                  errorMessage.includes('504') ||
                  errorMessage.includes('Gateway Timeout');

                if (isNetworkError) {
                  this.logger.warn(
                    `Could not connect to lens-manager at ${this.lensManagerUrl} or request timed out. Lens-manager may not be running or accessible. This may affect P2P operations.`,
                  );
                  return of(null); // Return empty observable to prevent error propagation
                }

                // For other errors (4xx client errors), log but don't block
                if (statusCode && statusCode >= 400 && statusCode < 500) {
                  this.logger.warn(
                    `Lens-manager returned ${statusCode} for site ${siteAddress}: ${error.message}. This may affect P2P operations.`,
                  );
                  return of(null); // Return empty observable to prevent error propagation
                }

                // For unexpected errors, log but don't throw (this is fire-and-forget)
                this.logger.warn(
                  `Unexpected error from lens-manager for site ${siteAddress}: ${error.message}. This may affect P2P operations.`,
                );
                return of(null); // Return empty observable to prevent error propagation
              }),
            ),
        ),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => {
              this.logger.warn(
                `Hard timeout: Request to lens-manager exceeded ${this.httpTimeout}ms. Aborting.`,
              );
              reject(new TimeoutError());
            },
            this.httpTimeout + 100, // Add 100ms buffer
          ),
        ),
      ]);
      this.logger.log(
        `Successfully notified lens-manager for site: ${siteAddress}`,
      );
    } catch (error) {
      // Handle timeout errors from Promise.race
      if (error instanceof TimeoutError) {
        this.logger.warn(
          `Request to lens-manager timed out after ${this.httpTimeout}ms. Lens-manager may not be running or accessible. This may affect P2P operations.`,
        );
        return; // Exit early, don't throw
      }
      // All errors should be handled gracefully - this is fire-and-forget
      // Log as warning since this is non-critical for login
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Could not ensure site ${siteAddress} was open in lens-manager: ${errorMessage}. This may affect P2P operations, but login will continue.`,
      );
      // Don't throw - this is fire-and-forget
      return;
    }
  }

  private async _fetchProfileImageAsDataUrl(
    url: string,
  ): Promise<string | null> {
    // Validate URL before attempting to fetch
    if (!url || url === 'undefined' || !url.startsWith('http')) {
      this.logger.warn(`Invalid profile image URL: ${url}`);
      return null;
    }

    try {
      this.logger.log(`Fetching profile image from: ${url}`);
      const response = await firstValueFrom(
        this.httpService.get(url, { responseType: 'arraybuffer' }),
      );

      const contentType = response.headers['content-type'] as string;
      const buffer = Buffer.from(response.data); // No longer needs 'binary' encoding
      const base64 = buffer.toString('base64');

      if (!contentType || !base64) {
        throw new Error('Could not get content-type or convert to base64.');
      }

      const dataUrl = `data:${contentType};base64,${base64}`;
      this.logger.log(`Successfully converted image to a Data URL.`);
      return dataUrl;
    } catch (error) {
      this.logger.error(
        `Failed to fetch and convert profile image from ${url}`,
        error,
      );
      // Return null to gracefully handle cases where the external image is unavailable.
      return null;
    }
  }
}
