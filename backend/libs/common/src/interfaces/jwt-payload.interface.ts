import { Role } from '../enums/roles.enum';

export interface JwtPayload {
  /** Subject (User ID) */
  sub: string;

  /** User's email */
  email: string;

  /** Currently active Organization ID (Empressa internal) */
  organizationId?: string;

  /** P2P Site Address for the active organization */
  siteAddress?: string | null;

  /** User's role (e.g., 'Creator', 'Admin') */
  role?: Role;

  /** User's P2P PeerId (base58) */
  peerId: string;

  /** User's P2P public key (Ed25519) */
  p2pPublicKey: string;

  /** User's on-chain wallet public key (secp256k1) */
  walletPublicKey: string;

  /** Issued At (Unix timestamp) */
  iat: number;

  /** Expiration Time (Unix timestamp) */
  exp: number;
}
