# file: views/InfluencerView.vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Button from 'primevue/button';
import Select from 'primevue/select';
import ClaimsList from '@/components/ClaimsList.vue';
import { formatNumber, calculateTrustScore, getTrustScoreColor } from '@/utils/format';
import { mockInfluencers } from '@/service/mock';

const route = useRoute();
const influencerId = route.params.id as string;
const searchQuery = ref('');
const selectedVerification = ref('All');
const sortBy = ref('Date');

const sortOptions = ['Latest First', 'Oldest First', 'Trust Score High', 'Trust Score Low'];

const trustScoreClass = computed(() => getTrustScoreColor(trustScore.value));

const influencer = computed(() => mockInfluencers.find(inf => inf.id === influencerId));

const trustScore = computed(() =>
  influencer.value
    ? calculateTrustScore(influencer.value.stats.verified, influencer.value.stats.debunked)
    : 0
);

const metrics = ref([
  {
    value: computed(() => `${trustScore.value}%`),
    label: 'Trust Score',
    colorClass: trustScoreClass,
    icon: 'pi pi-star',
  },
  {
    value: computed(() => `${formatNumber(influencer.value?.followers || 0)}+`),
    label: 'Followers',
    colorClass: 'text-primary-500',
    icon: 'pi pi-users',
  },
  {
    value: computed(() => influencer.value?.stats.verified || 0),
    label: 'Verified Claims',
    colorClass: 'text-green-500',
    icon: 'pi pi-check-circle',
  },
  {
    value: computed(() => influencer.value?.stats.debunked || 0),
    label: 'Debunked Claims',
    colorClass: 'text-red-500',
    icon: 'pi pi-times-circle',
  },
]);

const claims = ref([
  {
    id: '1',
    date: '2024-01-14',
    claim: 'Viewing sunlight within 30-60 minutes of waking enhances cortisol release',
    verified: true,
    trustScore: 92,
    analysis:
      'Multiple studies confirm morning light exposure affects cortisol rhythms. Timing window supported by research.',
  },
  {
    id: '2',
    date: '2023-12-06',
    claim: 'Non-sleep deep rest (NSDR) protocols can accelerate learning and recovery',
    verified: true,
    trustScore: 88,
    analysis: "Research supports NSDR's effects on learning consolidation and autonomic recovery.",
  },
]);

const sortedAndFilteredClaims = computed(() => {
  let filtered = claims.value;

  if (selectedVerification.value !== 'All') {
    const isVerified = selectedVerification.value === 'Verified';
    filtered = filtered.filter(claim => claim.verified === isVerified);
  }

  return [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'Latest First':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'Oldest First':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'Trust Score High':
        return b.trustScore - a.trustScore;
      case 'Trust Score Low':
        return a.trustScore - b.trustScore;
      default:
        return 0;
    }
  });
});
</script>

<template>
  <div v-if="influencer">
    <div class="flex flex-col md:flex-row items-center text-center md:text-left md:gap-8 mb-6">
      <img
        :src="influencer.avatar"
        :alt="influencer.name"
        class="w-20 h-20 md:w-16 md:h-16 rounded-full"
      />
      <div>
        <h1 class="text-3xl font-bold mb-1">{{ influencer.name }}</h1>
        <p class="text-gray-400">{{ influencer.handle }}</p>
        <p class="text-gray-300 mt-2">{{ influencer.description }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card v-for="metric in metrics" :key="metric.label">
        <template #content>
          <div class="text-center">
            <div :class="['text-3xl font-bold mb-1', metric.colorClass]">
              <i :class="['!text-xl', metric.icon, metric.colorClass]" />
              {{ metric.value }}
            </div>
            <div class="text-gray-400">{{ metric.label }}</div>
          </div>
        </template>
      </Card>
    </div>

    <Card class="mb-4">
      <template #content>
        <div class="space-y-4">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Search claims..." class="w-full" />
          </IconField>

          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex flex-wrap gap-2">
              <Button
                v-for="status in ['All', 'Verified', 'Debunked']"
                :key="status"
                :label="status"
                :class="[
                  'p-button-rounded p-button-sm',
                  selectedVerification === status
                    ? 'p-button-primary'
                    : 'p-button-secondary p-button-outlined',
                ]"
                @click="selectedVerification = status"
              />
            </div>

            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-400">Sort by:</span>
              <Select
                v-model="sortBy"
                placeholder="Sort..."
                :options="sortOptions"
                class="w-full md:w-40"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <ClaimsList :claims="sortedAndFilteredClaims" :searchQuery="searchQuery" />
  </div>
</template>
