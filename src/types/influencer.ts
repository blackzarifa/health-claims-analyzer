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
