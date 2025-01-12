<script setup lang="ts">
import Card from 'primevue/card';
import InfluencerTable from '@/components/InfluencerTable.vue';

const metrics = [
  {
    value: '1,234',
    label: 'Active Influencers',
    icon: 'pi-users',
  },
  {
    value: '25,431',
    label: 'Claims Verified',
    icon: 'pi-check-circle',
  },
  {
    value: '85.7%',
    label: 'Average Trust Score',
    icon: 'pi-star',
  },
];
</script>

<template>
  <div>
    <h1 class="text-4xl font-bold mb-2">Influencer Trust Leaderboard</h1>
    <p class="mb-6">
      Real-time rankings of health influencers based on scientific accuracy, credibility, and
      transparency.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <template v-for="metric in metrics" :key="metric.label">
        <Card class="bg-slate-900">
          <template #content>
            <div class="grid grid-cols-[auto_1fr] gap-4 items-center">
              <i :class="['pi !text-3xl text-primary-500', metric.icon]" />
              <div>
                <h2 class="text-emerald-400 text-3xl font-bold">{{ metric.value }}</h2>
                <p class="text-gray-400">{{ metric.label }}</p>
              </div>
            </div>
          </template>
        </Card>
      </template>
    </div>

    <InfluencerTable />
  </div>
</template>
