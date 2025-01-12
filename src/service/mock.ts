import type { Influencer } from '@/types/influencer';

export const mockInfluencers: Influencer[] = [
  {
    id: '1',
    name: 'Dr. Health Guru',
    handle: '@healthguru',
    avatar: '/api/placeholder/40/40',
    followers: 1200000,
    mainCategory: 'Medicine',
    stats: {
      verified: 142,
      debunked: 2,
    },
    lastUpdated: '2024-01-10',
  },
  {
    id: '2',
    name: 'Wellness Warrior',
    handle: '@wellnessw',
    avatar: '/api/placeholder/40/40',
    followers: 890000,
    mainCategory: 'Nutrition',
    stats: {
      verified: 89,
      debunked: 36,
    },
    lastUpdated: '2024-01-11',
  },
  {
    id: '3',
    name: 'Mind & Body Coach',
    handle: '@mbcoach',
    avatar: '/api/placeholder/40/40',
    followers: 550000,
    mainCategory: 'Mental Health',
    stats: {
      verified: 132,
      debunked: 6,
    },
    lastUpdated: '2024-01-09',
  },
  {
    id: '4444',
    name: 'Mind & Body Coach',
    handle: '@mbcoach',
    avatar: '/api/placeholder/40/40',
    followers: 550000,
    mainCategory: 'Mental Health',
    stats: {
      verified: 132,
      debunked: 50,
    },
    lastUpdated: '2024-01-09',
  },
];
