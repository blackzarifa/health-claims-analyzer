import type { Claim } from '@/types/claim';

export const formatNumber = (num: number) => {
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
};

export const getTrustScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};

export const calculateTrustScore = (claims: Claim[]) => {
  if (!claims || claims.length === 0) return 0;
  const total = claims.reduce((sum, claim) => sum + claim.trustScore, 0);
  return Math.round(total / claims.length);
};
