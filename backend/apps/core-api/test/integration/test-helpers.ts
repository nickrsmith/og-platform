import { AssetCategory, AssetType, ProductionStatus } from '@app/common';

/**
 * Test Helpers for Phase 4 Integration Tests
 */

export interface MockReleaseData {
  id: string;
  name: string;
  siteAddress: string;
  price?: string;
  category?: AssetCategory;
  assetType?: AssetType;
  productionStatus?: ProductionStatus;
  basin?: string;
  acreage?: number;
  state?: string;
  county?: string;
  location?: string;
  projectedROI?: number;
  isEncrypted?: boolean;
  createdAt?: string;
}

export interface MockOrganizationData {
  id: string;
  name: string;
  siteAddress?: string;
  contractAddress?: string;
  legalEntityType?: string;
  primaryIndustry?: string;
  members?: any[];
}

/**
 * Creates a mock release with O&G fields
 */
export function createMockRelease(overrides: Partial<MockReleaseData> = {}): MockReleaseData {
  return {
    id: 'release-123',
    name: 'Test O&G Asset',
    siteAddress: 'test-site',
    price: '100000',
    category: AssetCategory.C,
    assetType: AssetType.Mineral,
    productionStatus: ProductionStatus.Producing,
    basin: 'PERMIAN',
    acreage: 40.5,
    state: 'TX',
    county: 'REEVES',
    location: 'Section 10, Block 10',
    projectedROI: 15.5,
    isEncrypted: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock organization
 */
export function createMockOrganization(overrides: Partial<MockOrganizationData> = {}): MockOrganizationData {
  return {
    id: 'org-123',
    name: 'Test Organization',
    siteAddress: 'test-site',
    contractAddress: '0x1234567890abcdef',
    legalEntityType: 'LLC',
    primaryIndustry: 'Oil & Gas',
    members: [],
    ...overrides,
  };
}

/**
 * Creates a Category A organization (Major Operator)
 */
export function createCategoryAOrganization(): MockOrganizationData {
  return createMockOrganization({
    name: 'Pioneer Natural Resources',
    legalEntityType: 'Corporation',
    primaryIndustry: 'Exploration & Production',
    members: [{}, {}, {}, {}, {}, {}], // 6 members
  });
}

/**
 * Creates a Category B organization (Broker)
 */
export function createCategoryBOrganization(): MockOrganizationData {
  return createMockOrganization({
    name: 'Override Trading Co',
    legalEntityType: 'LLC',
    primaryIndustry: 'Override Trading',
    members: [{}, {}], // 2 members
  });
}

/**
 * Creates a Category C organization (Individual)
 */
export function createCategoryCOrganization(): MockOrganizationData {
  return createMockOrganization({
    name: 'John Doe Minerals',
    legalEntityType: 'Individual',
    primaryIndustry: 'Mineral Rights',
    members: [{}], // 1 member
  });
}

/**
 * Creates mock Enverus validation response
 */
export function createMockEnverusValidation(verified: boolean = true) {
  return {
    verified,
    matchScore: verified ? 95 : 45,
    enverusId: verified ? '12345678' : undefined,
    matchedFields: verified ? ['county', 'state', 'operator'] : [],
    discrepancies: verified ? [] : ['No matching wells found'],
  };
}

/**
 * Creates mock AI document analysis response
 */
export function createMockAIAnalysis(confidence: number = 85) {
  return {
    extraction: {
      legalDescription: 'Section 10, Block 10, T-1-S, R-1-E',
      county: 'REEVES',
      state: 'TX',
      ownerNames: ['John Doe'],
      mineralRights: true,
      netMineralAcres: 40.5,
      confidence,
      extractedFields: ['legalDescription', 'county', 'state'],
      warnings: confidence < 70 ? ['Low confidence'] : [],
    },
  };
}

