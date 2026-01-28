import type { Request } from 'express';
import { AdminJwtPayload } from './admin-jwt-payload.interface';

/**
 * Extends the Express Request object to include the typed admin user payload.
 */
export interface RequestWithAdmin extends Request {
  user: AdminJwtPayload;
}
