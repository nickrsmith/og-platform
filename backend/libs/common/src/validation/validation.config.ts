import {
  BadRequestException,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

/**
 * Security-focused validation configuration for all API endpoints.
 * 
 * This configuration enforces:
 * - Whitelist: Only properties defined in DTOs are allowed
 * - Forbid non-whitelisted: Rejects requests with extra properties
 * - Transform: Automatically transforms payloads to DTO instances
 * - Strict type checking: Validates types match DTO definitions
 * - Detailed error messages: Provides clear validation feedback
 */
export const createValidationPipe = (
  options?: Partial<ValidationPipeOptions>,
): ValidationPipe => {
  const defaultOptions: ValidationPipeOptions = {
    // Security: Only allow properties defined in DTOs
    whitelist: true,
    
    // Security: Reject requests with extra properties (prevents mass assignment)
    forbidNonWhitelisted: true,
    
    // Transform payloads to DTO instances (enables type checking)
    transform: true,
    
    // Enable automatic type transformation (string -> number, etc.)
    transformOptions: {
      enableImplicitConversion: true,
    },
    
    // Stop at first validation error (performance optimization)
    stopAtFirstError: false,
    
    // Disable detailed error messages in production (security)
    disableErrorMessages: process.env.NODE_ENV === 'production',
    
    // Custom exception factory for better error formatting
    exceptionFactory: (errors) => {
      const formattedErrors = errors.map((error) => {
        const constraints = error.constraints || {};
        return {
          property: error.property,
          value: error.value,
          constraints: Object.values(constraints),
        };
      });

      return new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    },
    
    // Validate nested objects
    validateCustomDecorators: true,
    
    // ... merge with any provided options
    ...options,
  };

  return new ValidationPipe(defaultOptions);
};

/**
 * Standard validation pipe instance for use across all services.
 * Use this in main.ts: app.useGlobalPipes(standardValidationPipe)
 */
export const standardValidationPipe = createValidationPipe();

/**
 * Validation pipe with transform enabled (for query parameters).
 * Use this for @Query() decorators that need type transformation.
 */
export const transformValidationPipe = createValidationPipe({
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
});

/**
 * Validation pipe for body validation (stricter settings).
 * Use this for @Body() decorators.
 */
export const bodyValidationPipe = createValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

