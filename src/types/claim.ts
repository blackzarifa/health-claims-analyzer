export interface Claim {
  id: string;
  date: string;
  claim: string;
  verified: boolean;
  trustScore: number;
  analysis: string;
  sources: string[];
}

export type ClaimResponse = Omit<Claim, 'id'>;
