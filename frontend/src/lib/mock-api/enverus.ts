/**
 * Enverus API Mock Data
 * Simulates Enverus courthouse verification and matching endpoints
 */

import { delay, mockResponse } from './index';

export interface EnverusMatch {
  id: string;
  description: string;
  confidence: number;
  county: string;
  state: string;
  legalDescription: string;
  ownerName: string;
  recordDate: string;
  acreage: number;
  matchScore: number;
}

export interface EnverusVerificationRequest {
  county: string;
  state: string;
  legalDescription?: string;
  ownerName?: string;
}

export interface EnverusVerificationResponse {
  verified: boolean;
  matches: EnverusMatch[];
  confidence: number;
  verificationId: string;
  timestamp: string;
}

/**
 * Mock Enverus courthouse verification
 */
export async function mockEnverusVerify(
  request: EnverusVerificationRequest
): Promise<EnverusVerificationResponse> {
  await delay(800); // Simulate API delay
  
  // Generate mock matches based on location
  const matches: EnverusMatch[] = [
    {
      id: `enverus-${Date.now()}-1`,
      description: `Section 12, Block A-27, Abstract 1234, ${request.county} County, ${request.state} - 160 acres`,
      confidence: 98,
      county: request.county,
      state: request.state,
      legalDescription: request.legalDescription || `Section 12, Block A-27, Abstract 1234, ${request.county} County, ${request.state}`,
      ownerName: request.ownerName || "Property Owner",
      recordDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      acreage: 160,
      matchScore: 98,
    },
    {
      id: `enverus-${Date.now()}-2`,
      description: `Section 12, Block A-27, Abstract 1235, ${request.county} County, ${request.state} - 80 acres`,
      confidence: 85,
      county: request.county,
      state: request.state,
      legalDescription: `Section 12, Block A-27, Abstract 1235, ${request.county} County, ${request.state}`,
      ownerName: request.ownerName || "Property Owner",
      recordDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      acreage: 80,
      matchScore: 85,
    },
    {
      id: `enverus-${Date.now()}-3`,
      description: `Section 13, Block A-27, Abstract 1240, ${request.county} County, ${request.state} - 160 acres`,
      confidence: 72,
      county: request.county,
      state: request.state,
      legalDescription: `Section 13, Block A-27, Abstract 1240, ${request.county} County, ${request.state}`,
      ownerName: request.ownerName || "Property Owner",
      recordDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      acreage: 160,
      matchScore: 72,
    },
  ];

  return mockResponse({
    verified: matches[0].confidence >= 90,
    matches: matches.sort((a, b) => b.confidence - a.confidence),
    confidence: matches[0].confidence,
    verificationId: `verify-${Date.now()}`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Mock Enverus production data lookup
 */
export async function mockEnverusProductionData(assetId: string) {
  await delay(600);
  
  return mockResponse({
    assetId,
    productionHistory: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      oil: Math.floor(Math.random() * 500) + 1000,
      gas: Math.floor(Math.random() * 1000) + 2000,
      water: Math.floor(Math.random() * 200) + 500,
    })),
    averageProduction: {
      oil: 1250,
      gas: 2500,
      water: 600,
    },
    declineRate: 15.5,
    eur: 425000,
  });
}

/**
 * Mock Enverus well data
 */
export async function mockEnverusWellData(county: string, state: string) {
  await delay(500);
  
  return mockResponse({
    wells: Array.from({ length: 8 }, (_, i) => ({
      id: `well-${i + 1}`,
      name: `Well #${i + 1}`,
      operator: ['Pioneer Natural Resources', 'Diamondback Energy', 'Concho Resources'][i % 3],
      status: ['producing', 'drilling', 'permitted'][i % 3],
      spudDate: new Date(Date.now() - (i + 1) * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      firstProduction: new Date(Date.now() - i * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      peakProduction: Math.floor(Math.random() * 1000) + 1500,
      currentProduction: Math.floor(Math.random() * 500) + 800,
    })),
    totalWells: 8,
    activeWells: 5,
  });
}

