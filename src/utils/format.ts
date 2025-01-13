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

export const calculateTrustScore = (verified: number, debunked: number) => {
  const total = verified + debunked;
  return total === 0 ? 0 : Math.round((verified / total) * 100);
};
