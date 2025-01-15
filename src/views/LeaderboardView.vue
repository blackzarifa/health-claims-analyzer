<script setup lang="ts">
import { computed, onMounted } from 'vue';
import Card from 'primevue/card';
import InfluencerTable from '@/components/InfluencerTable.vue';
import { useInfluencerStore } from '@/stores/influencers';

const store = useInfluencerStore();

onMounted(async () => {
  await store.loadInfluencers();
});

const metrics = computed(() => {
  const totalInfluencers = store.influencers.length;
  const totalClaims = store.influencers.reduce(
    (sum, inf) => sum + inf.stats.verified + inf.stats.debunked,
    0,
  );
  const avgTrustScore = store.influencers.length
    ? store.influencers.reduce((sum, inf) => sum + (inf.trustScore ?? 0), 0) /
      store.influencers.length
    : 0;

  return [
    {
      value: totalInfluencers.toString(),
      label: 'Active Influencers',
      icon: 'pi-users',
    },
    {
      value: totalClaims.toString(),
      label: 'Claims Verified',
      icon: 'pi-check-circle',
    },
    {
      value: `${avgTrustScore.toFixed(1)}%`,
      label: 'Average Trust Score',
      icon: 'pi-star',
    },
  ];
});
</script>

<template>
  <div>
    <h1 class="text-4xl font-bold mb-2">Influencer Trust Leaderboard</h1>
    <p class="mb-6">
      Real-time rankings of health influencers based on scientific accuracy, credibility, and
      transparency.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="metric in metrics" :key="metric.label">
        <Card class="bg-slate-900">
          <template #content>
            <div class="grid grid-cols-[auto_1fr] gap-4 items-center">
              <i :class="['pi !text-3xl text-primary-500', metric.icon]" />
              <div>
                <div class="text-emerald-400 text-3xl font-bold">{{ metric.value }}</div>
                <div class="text-gray-400">{{ metric.label }}</div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <InfluencerTable :influencers="store.influencers" />
  </div>
</template>
