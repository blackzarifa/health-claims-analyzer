export type Category = 'Medicine' | 'Nutrition' | 'Mental Health';

export interface VerificationStats {
  verified: number;
  debunked: number;
}

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  followers: number;
  mainCategory: Category;
  stats: VerificationStats;
  lastUpdated: string;
}
