/**
 * Offers Service
 * Handles offer-related API calls
 */

import { api } from '../api';

export interface CreateOfferRequest {
  assetId: string;
  amount: number;
  offerType: 'cash' | 'terms' | 'hybrid' | 'exchange' | 'farm_out';
  earnestMoney?: number;
  ddPeriod?: number;
  closingDate?: string;
  contingencies?: Array<{
    type: string;
    description: string;
  }>;
  terms?: Record<string, any>;
  notes?: string;
  expiresAt?: string;
}

export interface Offer {
  id: string;
  assetId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  earnestMoney?: number;
  ddPeriod?: number;
  closingDate?: string;
  offerType: 'cash' | 'terms' | 'hybrid' | 'exchange' | 'farm_out';
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired';
  contingencies?: Array<{
    type: string;
    description: string;
  }>;
  terms?: Record<string, any>;
  notes?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  buyer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  seller?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

/**
 * Create a new offer on an asset
 */
export async function createOffer(data: CreateOfferRequest): Promise<Offer> {
  return api.post<Offer>('/offers', data);
}

/**
 * Get all offers (with optional filters)
 */
export async function getOffers(options?: {
  assetId?: string;
  buyerId?: string;
  sellerId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ offers: Offer[]; total: number; page: number; pageSize: number }> {
  const params = new URLSearchParams();
  if (options?.assetId) params.append('assetId', options.assetId);
  if (options?.buyerId) params.append('buyerId', options.buyerId);
  if (options?.sellerId) params.append('sellerId', options.sellerId);
  if (options?.status) params.append('status', options.status);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.pageSize) params.append('pageSize', options.pageSize.toString());

  const queryString = params.toString();
  const endpoint = queryString ? `/offers?${queryString}` : '/offers';
  
  return api.get<{ offers: Offer[]; total: number; page: number; pageSize: number }>(endpoint);
}

/**
 * Get a single offer by ID
 */
export async function getOffer(offerId: string): Promise<Offer> {
  return api.get<Offer>(`/offers/${offerId}`);
}

/**
 * Accept an offer
 */
export async function acceptOffer(offerId: string, data?: { notes?: string }): Promise<Offer> {
  return api.post<Offer>(`/offers/${offerId}/accept`, data || {});
}

/**
 * Decline an offer
 */
export async function declineOffer(offerId: string, data?: { reason?: string }): Promise<Offer> {
  return api.post<Offer>(`/offers/${offerId}/decline`, data || {});
}

/**
 * Withdraw an offer
 */
export async function withdrawOffer(offerId: string): Promise<Offer> {
  return api.post<Offer>(`/offers/${offerId}/withdraw`);
}

/**
 * Create a counteroffer
 */
export async function createCounterOffer(
  parentOfferId: string,
  data: CreateOfferRequest
): Promise<Offer> {
  return api.post<Offer>(`/offers/${parentOfferId}/counter`, data);
}
