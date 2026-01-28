import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * A Passport guard that protects routes by invoking the 'admin-jwt' strategy.
 * It's responsible for initiating the JWT validation process for admin users.
 */
@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('admin-jwt') {
  // By extending AuthGuard('admin-jwt'), we are leveraging the built-in Passport
  // functionality provided by NestJS. This guard will automatically:
  //
  // 1. Look for the 'admin-jwt' strategy that we registered in the AuthModule.
  // 2. Execute that strategy's logic, which extracts the JWT from the request header.
  // 3. Call the `validate()` method within our `AdminJwtStrategy`.
  // 4. If `validate()` returns a payload, it attaches that payload to `request.user`.
  // 5. If `validate()` throws an error (like an UnauthorizedException), Passport will
  //    automatically deny the request and send the appropriate 401 HTTP response.
  //
  // No additional implementation is needed within this class for the standard JWT flow.
}
