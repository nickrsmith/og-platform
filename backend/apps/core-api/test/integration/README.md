# Phase 4 Integration Tests

## Overview

This directory contains integration tests for Phase 4 O&G services, validating that all components work together correctly.

## Test Files

### `phase4-workflows.integration.spec.ts`

Tests the complete workflows:
- **Enverus → Validation → Asset Creation**: Validates Enverus data integration
- **AI → Validation → Asset Creation**: Validates AI document analysis integration
- **Organization Category → Asset Validation**: Validates category-based business rules
- **Complete Asset Creation Workflow**: End-to-end validation

### `smart-contract-integration.integration.spec.ts`

Tests smart contract integration:
- **O&G Fields in Blockchain Job Payload**: Verifies all O&G fields are passed correctly
- **Backward Compatibility**: Ensures old releases without O&G fields still work
- **Category C Free Listing**: Validates Category C free listing logic

### `transaction-workflows.integration.spec.ts`

Tests transaction lifecycle:
- **Transaction Creation from Accepted Offer**: Validates transaction creation workflow
- **Transaction Status Workflow**: Tests status transitions (PENDING → EARNEST → DD → FUNDING → CLOSED)
- **Settlement Calculation**: Validates settlement calculations for Category A and Category C
- **Notification Integration**: Tests notification sending for transaction events
- **End-to-End Transaction Flow**: Complete transaction lifecycle test

### `revenue-distribution.integration.spec.ts`

Tests revenue distribution:
- **Revenue Split Calculation**: Tests fee calculations for different categories
- **Category C Free Listing**: Validates 0% fees for Category C
- **Custom Organization Fees**: Tests custom fee handling
- **Fee Structure Retrieval**: Tests reading fees from smart contracts
- **Revenue Statistics**: Tests revenue tracking and reporting
- **Organization Earnings**: Tests earnings tracking

### `notification-system.integration.spec.ts`

Tests notification system:
- **Notification Sending**: Tests email notification delivery
- **Transaction Event Notifications**: Tests notifications for transaction lifecycle events
- **Offer Event Notifications**: Tests notifications for offer events
- **Notification History**: Tests notification retrieval and tracking
- **Error Handling**: Tests graceful error handling for notification failures

## Running Tests

```bash
# Run all integration tests
pnpm test integration

# Run specific test file
pnpm test phase4-workflows.integration.spec.ts

# Run with coverage
pnpm test --coverage integration
```

## Test Helpers

The `test-helpers.ts` file provides utilities for creating mock data:
- `createMockRelease()` - Creates mock release with O&G fields
- `createMockOrganization()` - Creates mock organization
- `createCategoryAOrganization()` - Creates Category A org
- `createCategoryBOrganization()` - Creates Category B org
- `createCategoryCOrganization()` - Creates Category C org
- `createMockEnverusValidation()` - Creates Enverus validation response
- `createMockAIAnalysis()` - Creates AI analysis response

## Test Coverage

These tests validate:
- ✅ Service integration (Enverus, AI, Validation)
- ✅ Category-based business logic
- ✅ Smart contract payload generation
- ✅ Backward compatibility
- ✅ Error handling and graceful degradation
- ✅ Transaction lifecycle workflows
- ✅ Revenue distribution calculations
- ✅ Settlement calculations
- ✅ Notification system
- ✅ End-to-end transaction flow

## Notes

- Tests use mocks for external services (Enverus, AI, Blockchain)
- Tests validate the integration logic, not external API calls
- All tests should pass in CI/CD without external dependencies

