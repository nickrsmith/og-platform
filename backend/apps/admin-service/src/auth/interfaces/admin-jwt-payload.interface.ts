/**
 * Defines the shape of the JWT payload for a successfully authenticated Admin User.
 * This is the data that will be available in `request.user`.
 */
export interface AdminJwtPayload {
  /** Subject (AdminUser ID) */
  sub: string;

  /** Admin User's email */
  email: string;

  /** JWT ID (for blocklisting on logout) */
  jti: string;

  /** Issued At (Unix timestamp) */
  iat: number;

  /** Expiration Time (Unix timestamp) */
  exp: number;
}
