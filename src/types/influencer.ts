import type { ClaimResponse } from '@/types/claim';

export interface VerificationStats {
  verified: number;
  debunked: number;
}

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  description: string;
  followers: number;
  mainCategory: string;
  stats: VerificationStats;
  lastUpdated: string;
}

export interface InfluencerResponse {
  influencer: Omit<Influencer, 'id'>;
  claims?: Array<ClaimResponse>;
}

export interface RawInfluencerData {
  name: string;
  handle: string;
  description: string;
  followers: number;
  mainCategory: string;
  claims?: Array<{
    claim: string;
    trustScore: number;
    analysis: string;
    sources: string[];
  }>;
}
