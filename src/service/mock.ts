import type { Influencer } from '@/types/influencer';

export const mockInfluencers: Influencer[] = [
  {
    id: '1',
    name: 'Dr. Health Guru',
    handle: '@healthguru',
    description:
      'Stanford Professor of Medicine, focusing on evidence-based approaches to health and wellness. Host of the Health Revolution Podcast.',
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
    description:
      'Certified nutritionist and wellness coach. Helping people find balance through holistic approaches to health.',
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
    description:
      'Clinical psychologist specializing in mind-body connection. Teaching evidence-based techniques for mental wellness.',
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
    description:
      'Clinical psychologist specializing in mind-body connection. Teaching evidence-based techniques for mental wellness.',
    followers: 55000,
    mainCategory: 'Mental Health',
    stats: {
      verified: 132,
      debunked: 50,
    },
    lastUpdated: '2024-01-09',
  },
];
