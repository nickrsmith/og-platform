# API Documentation Setup

## Overview

The Empressa O&G Platform API now includes comprehensive OpenAPI/Swagger documentation for all endpoints.

## Swagger UI Access

**Local Development:**
```
http://localhost:3000/api/v1/docs
```

**Production:**
```
https://api.Empressa.io/api/v1/docs
```

## Features

### Interactive Documentation
- Browse all available endpoints
- See request/response schemas
- Test API calls directly in the browser
- View authentication requirements
- See example requests and responses

### Authentication
- JWT Bearer token authentication is configured
- Click the "Authorize" button in Swagger UI
- Enter your JWT token: `Bearer {your-token}`
- All protected endpoints will use this token

### Documented Endpoints

#### Transaction Management
- `POST /api/v1/transactions` - Create transaction from accepted offer
- `GET /api/v1/transactions/:id` - Get transaction details
- `GET /api/v1/transactions` - List transactions with filters
- `PATCH /api/v1/transactions/:id/status` - Update transaction status
- `POST /api/v1/transactions/:id/deposit-earnest` - Deposit earnest money
- `POST /api/v1/transactions/:id/complete-due-diligence` - Complete due diligence
- `POST /api/v1/transactions/:id/fund` - Fund transaction
- `POST /api/v1/transactions/:id/close` - Close transaction
- `GET /api/v1/transactions/:id/settlement-statement` - Get settlement statement

#### Revenue Distribution
- `POST /api/v1/revenue/calculate-split` - Calculate revenue split
- `GET /api/v1/revenue/fee-structure/:orgContractAddress` - Get fee structure
- `GET /api/v1/revenue/stats/:orgContractAddress` - Get revenue statistics
- `GET /api/v1/revenue/earnings/:organizationId` - Get organization earnings

#### Offer Management
- `POST /api/v1/offers` - Create offer
- `GET /api/v1/offers` - List offers
- `GET /api/v1/offers/:id` - Get offer details
- `PATCH /api/v1/offers/:id` - Update offer
- `POST /api/v1/offers/:id/accept` - Accept offer
- `POST /api/v1/offers/:id/decline` - Decline offer
- `POST /api/v1/offers/:id/withdraw` - Withdraw offer
- `POST /api/v1/offers/:id/counter` - Create counter offer

#### Asset Validation
- `POST /api/v1/validation/asset` - Validate asset

#### Enverus Integration
- `GET /api/v1/enverus/wells` - Get wells data
- `GET /api/v1/enverus/production` - Get production data
- `GET /api/v1/enverus/rigs` - Get rigs data
- `GET /api/v1/enverus/permits` - Get permits data
- `GET /api/v1/enverus/completions` - Get completions data
- `GET /api/v1/enverus/transactions` - Get transactions data
- `POST /api/v1/enverus/validate` - Validate asset with Enverus

#### AI Model Integration
- `POST /api/v1/ai/analyze-document` - Analyze document
- `POST /api/v1/ai/generate-valuation` - Generate valuation
- `POST /api/v1/ai/assess-risk` - Assess risk
- `POST /api/v1/ai/generate-listing` - Generate listing

## Implementation Details

### Swagger Configuration

The Swagger setup is configured in `apps/core-api/src/main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle('Empressa O&G Platform API')
  .setDescription('API documentation for Empressa Oil & Gas Platform...')
  .setVersion('1.0.0')
  .addTag('transactions', 'Transaction management and settlement')
  .addTag('revenue', 'Revenue distribution and fee calculations')
  // ... more tags
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/v1/docs', app, document);
```

### Controller Decorators

All controllers use Swagger decorators:

```typescript
@ApiTags('transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
export class TransactionsBusinessController {
  @Post()
  @ApiOperation({
    summary: 'Create transaction from accepted offer',
    description: 'Creates a new transaction from an accepted offer...',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: TransactionDto,
  })
  async createTransaction(...) { ... }
}
```

### DTO Decorators

DTOs include `@ApiProperty` decorators for schema generation:

```typescript
export class CreateTransactionDto {
  @ApiProperty({
    description: 'Accepted offer ID to create transaction from',
    example: 'offer-uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  offerId: string;
}
```

## Markdown Documentation

Comprehensive markdown documentation is available at:

```
backend/og-backend/docs/API_DOCUMENTATION.md
```

This includes:
- Authentication guide
- Endpoint descriptions
- Request/response examples
- Error handling
- Rate limiting
- Pagination
- Idempotency

## Generating OpenAPI Spec

The OpenAPI JSON spec is automatically generated at runtime. To export it:

```bash
# Start the server
pnpm start:core-api

# Access the JSON spec
curl http://localhost:3000/api/v1/docs-json > openapi.json
```

## Testing with Swagger UI

1. Start the backend:
   ```bash
   pnpm start:core-api
   ```

2. Open Swagger UI:
   ```
   http://localhost:3000/api/v1/docs
   ```

3. Authenticate:
   - Click "Authorize" button
   - Enter: `Bearer {your-jwt-token}`
   - Click "Authorize"

4. Test endpoints:
   - Expand any endpoint
   - Click "Try it out"
   - Fill in parameters
   - Click "Execute"
   - View response

## Benefits

1. **Frontend Integration:** Frontend developers can easily discover and test all available APIs
2. **API Testing:** QA can test APIs directly without writing code
3. **Documentation:** Always up-to-date with code changes
4. **Client Generation:** Can generate client SDKs from OpenAPI spec
5. **Contract Testing:** Can validate API contracts automatically

## Future Enhancements

- [ ] Add more detailed examples
- [ ] Add response examples for error cases
- [ ] Generate client SDKs (TypeScript, Python, etc.)
- [ ] Add API versioning documentation
- [ ] Add webhook documentation
- [ ] Add rate limiting details per endpoint

---

*Last Updated: January 30, 2025*

