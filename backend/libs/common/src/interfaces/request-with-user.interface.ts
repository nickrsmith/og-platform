import { JwtPayload } from './jwt-payload.interface';
import type { Request } from 'express';
export interface RequestWithUser extends Request {
  user: JwtPayload;
}
