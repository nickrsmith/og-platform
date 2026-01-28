/**
 * Verification Service
 * Handles Persona identity verification API calls
 */

import { api } from '../api';

export interface PersonaSessionResponse {
  sessionId: string;
  clientToken: string;
}

export interface PersonaVerificationStatus {
  verified: boolean;
  status: 'pending' | 'verified' | 'failed';
  sessionId: string | null;
  personaStatus?: string;
}

export interface CreatePersonaSessionRequest {
  templateId?: string;
}

/**
 * Create a new Persona verification session
 */
export async function createPersonaSession(
  data?: CreatePersonaSessionRequest
): Promise<PersonaSessionResponse> {
  return api.post<PersonaSessionResponse>('/verification/persona/session', data);
}

/**
 * Get Persona verification status for the current user
 */
export async function getPersonaVerificationStatus(): Promise<PersonaVerificationStatus> {
  return api.get<PersonaVerificationStatus>('/verification/persona/status');
}
