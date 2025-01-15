# file: views/InfluencerView.vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Button from 'primevue/button';
import Select from 'primevue/select';
import ClaimsList from '@/components/ClaimsList.vue';
import { formatNumber, getTrustScoreColor } from '@/utils/format';
import { useInfluencerStore } from '@/stores/influencers';

const route = useRoute();
const store = useInfluencerStore();
const influencerId = route.params.id as string;
const isLoading = ref(true);

onMounted(async () => {
  if (!store.influencers.length) {
    await store.loadInfluencers();
  }
  isLoading.value = false;
});

const searchQuery = ref('');
const selectedVerification = ref('All');
const sortBy = ref('Latest First');
const sortOptions = ['Latest First', 'Oldest First', 'Trust Score High', 'Trust Score Low'];

const influencer = computed(() => store.influencers.find((inf) => inf.id === influencerId));

const trustScoreClass = computed(() => getTrustScoreColor(influencer.value?.trustScore ?? 0));

const metrics = computed(() => [
  {
    value: `${influencer.value?.trustScore ?? 0}%`,
    label: 'Trust Score',
    colorClass: trustScoreClass.value,
    icon: 'pi pi-star',
  },
  {
    value: formatNumber(influencer.value?.followers || 0) + '+',
    label: 'Followers',
    colorClass: 'text-primary-500',
    icon: 'pi pi-users',
  },
  {
    value: influencer.value?.stats.verified || 0,
    label: 'Verified Claims',
    colorClass: 'text-green-500',
    icon: 'pi pi-check-circle',
  },
  {
    value: influencer.value?.stats.debunked || 0,
    label: 'Debunked Claims',
    colorClass: 'text-red-500',
    icon: 'pi pi-times-circle',
  },
]);

const sortedAndFilteredClaims = computed(() => {
  let filtered = store.claims[influencerId] || [];

  if (selectedVerification.value !== 'All') {
    const isVerified = selectedVerification.value === 'Verified';
    filtered = filtered.filter((claim) => claim.verified === isVerified);
  }

  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (claim) =>
        claim.claim.toLowerCase().includes(search) || claim.analysis.toLowerCase().includes(search),
    );
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
  <div v-if="isLoading" class="flex justify-center items-center min-h-[200px]">
    <i class="pi pi-spin pi-spinner text-4xl text-primary-500" />
  </div>

  <div v-else-if="influencer" class="space-y-6">
    <div class="flex flex-col md:flex-row items-center text-center md:text-left md:gap-8">
      <div>
        <h1 class="text-3xl font-bold mb-1">{{ influencer.name }}</h1>
        <p class="text-gray-400">{{ influencer.handle }}</p>
        <p class="text-gray-300 mt-2">{{ influencer.description }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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

    <Card>
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
              <Select v-model="sortBy" :options="sortOptions" class="w-full md:w-40" />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <ClaimsList :claims="sortedAndFilteredClaims" :searchQuery="searchQuery" />
  </div>

  <div v-else class="text-center py-12">
    <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-4" />
    <h2 class="text-2xl font-bold mb-2">Influencer Not Found</h2>
    <p class="text-gray-400">This influencer might have been removed or doesn't exist.</p>
  </div>
</template>
