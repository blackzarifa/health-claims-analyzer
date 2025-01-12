<script setup lang="ts">
import { ref, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { useRouter } from 'vue-router';
import type { Influencer } from '@/types/influencer';
import { mockInfluencers } from '@/service/mock';
import {
  formatNumber,
  getCategoryColor,
  getTrustScoreColor,
  calculateTrustScore,
} from '@/utils/format';

const router = useRouter();
const influencers = ref<Influencer[]>(mockInfluencers);

const influencersWithScore = computed(() =>
  influencers.value
    .map(inf => ({
      ...inf,
      trustScore: calculateTrustScore(inf.stats.verified, inf.stats.debunked),
    }))
    .sort((a, b) => b.trustScore - a.trustScore)
    .map((inf, index) => ({ ...inf, rank: index + 1 }))
);

const handleRowClick = (event: { data: Influencer }) => {
  router.push(`/influencer/${event.data.id}`);
};
</script>

<template>
  <DataTable
    :value="influencersWithScore"
    class="mt-4 cursor-pointer"
    @row-click="handleRowClick"
    :rowHover="true"
  >
    <Column field="rank" header="Rank" :sortable="true" class="w-16">
      <template #body="{ data }">
        <div
          class="font-semibold"
          :class="{
            'text-amber-400': data.rank === 1,
            'text-slate-300': data.rank === 2,
            'text-amber-600': data.rank === 3,
          }"
        >
          #{{ data.rank }}
        </div>
      </template>
    </Column>

    <Column field="avatar" class="w-16">
      <template #body="{ data }">
        <img :src="data.avatar" :alt="data.name" class="w-10 h-10 rounded-full" />
      </template>
    </Column>

    <Column field="name" header="Influencer" class="w-64">
      <template #body="{ data }">
        <div>
          <div class="font-medium">{{ data.name }}</div>
          <div class="text-sm text-gray-400">{{ data.handle }}</div>
        </div>
      </template>
    </Column>

    <Column field="mainCategory" header="Category" class="w-40">
      <template #body="{ data }">
        <Tag
          :value="data.mainCategory"
          :severity="getCategoryColor(data.mainCategory)"
          size="small"
        />
      </template>
    </Column>

    <Column field="trustScore" header="Trust Score" :sortable="true" class="w-32">
      <template #body="{ data }">
        <span :class="['font-bold', getTrustScoreColor(data.trustScore)]">
          {{ data.trustScore }}%
        </span>
      </template>
    </Column>

    <Column field="followers" header="Followers" :sortable="true" class="w-32">
      <template #body="{ data }"> {{ formatNumber(data.followers) }}+ </template>
    </Column>

    <Column field="stats.verified" header="Verified Claims" :sortable="true" class="w-32">
      <template #body="{ data }">
        <span class="text-green-500 font-medium">{{ data.stats.verified }}</span>
      </template>
    </Column>
  </DataTable>
</template>
